"""Rotas HTTP do canal de suporte/contato."""

import asyncio
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from App.models.suporte import SuporteContato
from App.services.suporte_email_service import (
    SupportEmailConfigError,
    SupportEmailServiceError,
    enviar_reclamacao_por_email,
)

router = APIRouter()


@router.post("/suporte/contato", status_code=status.HTTP_201_CREATED)
async def enviar_contato(payload: SuporteContato) -> dict[str, str]:
    """Recebe reclamacao de cliente e encaminha para o e-mail de suporte."""
    protocolo = f"SUP-{uuid4().hex[:10].upper()}"
    dados = payload.model_dump()
    dados["protocolo"] = protocolo

    try:
        await asyncio.to_thread(enviar_reclamacao_por_email, dados)
    except SupportEmailConfigError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Canal de suporte indisponivel: {error}",
        ) from error
    except SupportEmailServiceError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(error),
        ) from error

    return {
        "status": "recebido",
        "protocolo": protocolo,
        "message": "Reclamacao enviada para o suporte com sucesso.",
    }
