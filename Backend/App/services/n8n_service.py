import os
from typing import Any

import requests


N8N_WEBHOOK_URL = os.getenv(
    "N8N_WEBHOOK_URL",
    "http://localhost:5678/webhook/contestacao",
)


def enviar_para_n8n(dados: dict[str, Any]) -> dict[str, Any]:
    try:
        response = requests.post(
            N8N_WEBHOOK_URL,
            json=dados,
            timeout=20,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        return {
            "ok": False,
            "error": f"Falha ao comunicar com n8n: {exc}",
        }

    if not response.content:
        return {"ok": True, "data": {}}

    try:
        payload = response.json()
    except ValueError:
        payload = {"raw": response.text}

    return {"ok": True, "data": payload}
