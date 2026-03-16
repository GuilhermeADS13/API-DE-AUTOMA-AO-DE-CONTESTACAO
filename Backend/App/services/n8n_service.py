import os
from typing import Any

import requests

DEFAULT_N8N_WEBHOOK_URL = "http://localhost:5678/webhook/contestacao"
N8N_TIMEOUT_SECONDS = 30


class N8NServiceError(Exception):
    pass


def get_n8n_webhook_url() -> str:
    webhook_url = os.getenv("N8N_WEBHOOK_URL", DEFAULT_N8N_WEBHOOK_URL).strip()
    return webhook_url or DEFAULT_N8N_WEBHOOK_URL


def enviar_para_n8n(dados: dict[str, Any]) -> Any:
    webhook_url = get_n8n_webhook_url()

    try:
        response = requests.post(webhook_url, json=dados, timeout=N8N_TIMEOUT_SECONDS)
        response.raise_for_status()
    except requests.RequestException as error:
        raise N8NServiceError(
            f"Falha ao acionar o n8n em {webhook_url}. Verifique se o workflow esta ativo."
        ) from error

    if not response.content:
        return {"message": "Workflow acionado sem corpo de resposta."}

    try:
        return response.json()
    except ValueError:
        return {"raw_response": response.text}
