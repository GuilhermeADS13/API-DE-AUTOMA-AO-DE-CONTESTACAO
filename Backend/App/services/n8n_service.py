# Servico de integracao com webhook do n8n para disparo de workflows de contestacao.
import asyncio
import json
import os
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

DEFAULT_N8N_WEBHOOK_URL = "http://localhost:5678/webhook/contestacao"
N8N_TIMEOUT_SECONDS = 130


class N8NServiceError(Exception):
    pass


def get_n8n_webhook_url() -> str:
    webhook_url = os.getenv("N8N_WEBHOOK_URL", DEFAULT_N8N_WEBHOOK_URL).strip()
    return webhook_url or DEFAULT_N8N_WEBHOOK_URL


def get_n8n_webhook_auth_token() -> str:
    return os.getenv("N8N_WEBHOOK_AUTH_TOKEN", "").strip()


def _enviar_para_n8n_sync(dados: dict[str, Any]) -> Any:
    """Execucao sincrona do POST para n8n (usada em thread dedicada)."""
    webhook_url = get_n8n_webhook_url()
    body = json.dumps(dados).encode("utf-8")
    request_headers = {"Content-Type": "application/json"}
    auth_token = get_n8n_webhook_auth_token()
    if auth_token:
        request_headers["Authorization"] = f"Bearer {auth_token}"

    request = Request(
        url=webhook_url,
        data=body,
        headers=request_headers,
        method="POST",
    )

    try:
        with urlopen(request, timeout=N8N_TIMEOUT_SECONDS) as response:
            response_body = response.read()
    except (HTTPError, URLError, TimeoutError, OSError) as error:
        raise N8NServiceError(
            f"Falha ao acionar o n8n em {webhook_url}. Verifique se o workflow esta ativo."
        ) from error

    if not response_body:
        return {"message": "Workflow acionado sem corpo de resposta."}

    try:
        return json.loads(response_body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return {"raw_response": response_body.decode("utf-8", errors="replace")}


async def enviar_para_n8n(dados: dict[str, Any]) -> Any:
    """Envia payload sem bloquear o loop principal da API."""
    return await asyncio.to_thread(_enviar_para_n8n_sync, dados)
