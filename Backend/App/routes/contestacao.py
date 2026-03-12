from fastapi import APIRouter
from App.models.processo import Processo
from App.services.n8n_service import enviar_para_n8n

router = APIRouter()

@router.post("/gerar-contestacao")
async def gerar_contestacao(processo: Processo):

    resposta = enviar_para_n8n(processo.dict())

    return {
        "status": "processando",
        "workflow": resposta
    }