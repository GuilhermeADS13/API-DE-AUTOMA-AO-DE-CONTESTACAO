# API-DE-AUTOMA-AO-DE-CONTESTACAO

Projeto com frontend (React + Vite) e backend (FastAPI) para automacao de contestacoes com integracao n8n.

## Estrutura

- `Front comp/vite-project` - frontend
- `Backend` - backend

## Frontend

```bash
cd "Front comp/vite-project"
npm install
npm run dev
```

## Backend

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Variaveis de ambiente (backend)

Use `Backend/.env.example` como referencia:

- `FRONTEND_ORIGINS`
- `N8N_WEBHOOK_URL`
- `DATABASE_URL`

## Observacoes

- O endpoint principal de automacao esta em `POST /api/gerar-contestacao`.
- Cadastro/login/logout estao em `POST /api/usuarios/cadastro`, `POST /api/usuarios/login`, `POST /api/usuarios/logout` e validacao em `GET /api/usuarios/sessao`.
- O backend cria automaticamente a tabela `contestacoes` no PostgreSQL na primeira execucao.
- O envio de contestacao agora exige autenticacao.
- O frontend usa `credentials: include` para sessao por cookie HTTPOnly.
