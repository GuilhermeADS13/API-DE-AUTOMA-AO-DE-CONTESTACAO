from fastapi import APIRouter, HTTPException

from App.database import get_connection
from App.models.processo import Processo
from App.services.n8n_service import enviar_para_n8n

router = APIRouter()


@router.post("/gerar-contestacao")
async def gerar_contestacao(processo: Processo):
    payload = processo.model_dump()

    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO contestacoes (processo, cliente, tipo_acao, tese, observacoes, status)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                payload["processo"],
                payload["cliente"],
                payload["tipoAcao"],
                payload["tese"],
                payload["observacoes"],
                "Em analise",
            ),
        )
        conn.commit()

    resposta_n8n = enviar_para_n8n(payload)
    if not resposta_n8n["ok"]:
        raise HTTPException(status_code=502, detail=resposta_n8n["error"])

    return {
        "status": "processando",
        "workflow": resposta_n8n["data"],
    }
