# Rotas HTTP de contestacoes: envio ao n8n e consulta de resumo do dashboard.
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status

from App.database import (
    get_dashboard_cards_por_usuario,
    list_contestacoes_por_usuario,
    save_contestacao,
)
from App.models.processo import Processo
from App.security import get_authenticated_user
from App.services.n8n_service import N8NServiceError, enviar_para_n8n

router = APIRouter()


@router.post("/gerar-contestacao")
async def gerar_contestacao(
    processo: Processo,
    usuario: dict[str, str] = Depends(get_authenticated_user),
) -> dict:
    """Dispara workflow do n8n e persiste rastreio do envio."""
    payload = processo.model_dump()
    payload["usuario_id"] = usuario["id"]
    payload["usuario_nome"] = usuario.get("nome", "")
    payload["usuario_email"] = usuario.get("email", "")
    payload["auth_provider"] = usuario.get("auth_provider", "legacy")

    try:
        resposta = await enviar_para_n8n(payload)
        workflow_status = "processando"
        if isinstance(resposta, dict):
            workflow_status = str(resposta.get("status") or "processando").strip() or "processando"

        if workflow_status in {"erro_validacao", "rejeitado"}:
            save_contestacao(payload, status=workflow_status, n8n_resposta=resposta)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(resposta.get("mensagem") if isinstance(resposta, dict) else "Falha de validacao no workflow."),
            )

        registro_id = save_contestacao(payload, status=workflow_status, n8n_resposta=resposta)
    except N8NServiceError as error:
        save_contestacao(
            payload,
            status="erro",
            n8n_resposta={"mensagem": str(error)},
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(error),
        ) from error

    case_year = datetime.now().year
    case_id = f"CTR-{case_year}-{int(registro_id):06d}"

    return {
        "status": "processando",
        "id_registro": registro_id,
        "id_caso": case_id,
        "workflow": resposta,
    }


@router.get("/contestacoes/resumo")
async def obter_resumo_contestacoes(
    limit: int = Query(default=20, ge=1, le=100),
    usuario: dict[str, str] = Depends(get_authenticated_user),
) -> dict:
    """Retorna cards e historico reais do dashboard para o usuario autenticado."""
    usuario_id = str(usuario["id"])
    return {
        "cards": get_dashboard_cards_por_usuario(usuario_id),
        "history": list_contestacoes_por_usuario(usuario_id, limit=limit),
    }
