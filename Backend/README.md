# Backend

API FastAPI do projeto de automacao de contestacao.

## Requisitos

- Python 3.10+

## Configuracao

1. Copie `.env.example` para `.env` (opcional).
2. Ajuste URL do n8n e origens CORS conforme ambiente.

## Executar localmente

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Endpoints principais

- `GET /` - status basico do backend
- `GET /health` - healthcheck
- `POST /api/gerar-contestacao` - envia dados para n8n e registra no banco local
