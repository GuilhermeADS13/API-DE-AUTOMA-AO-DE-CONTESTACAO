import requests

N8N_WEBHOOK = "http://localhost:5678/webhook/contestacao"

def enviar_para_n8n(dados):

    response = requests.post(
        N8N_WEBHOOK,
        json=dados
    )

    return response.json()