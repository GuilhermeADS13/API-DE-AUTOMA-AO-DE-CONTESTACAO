from fastapi import APIRouter, HTTPException, status

from App.database import save_contestacao
from App.models.processo import Processo
from App.services.n8n_service import N8NServiceError, enviar_para_n8n

router = APIRouter()


@router.post("/gerar-contestacao")
async def gerar_contestacao(processo: Processo) -> dict:
    payload = processo.model_dump()

    try:
        resposta = enviar_para_n8n(payload)
        registro_id = save_contestacao(payload, status="processando", n8n_resposta=resposta)
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

    return {
        "status": "processando",
        "id_registro": registro_id,
        "workflow": resposta,
    }
