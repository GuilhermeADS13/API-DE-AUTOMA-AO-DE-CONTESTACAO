# Backend

API FastAPI do projeto de automacao de contestacao com integracao n8n e persistencia em PostgreSQL.

## Requisitos

- Python 3.10+
- PostgreSQL 14+

## Configuracao

1. Copie `.env.example` para `.env`.
2. Ajuste `N8N_WEBHOOK_URL` e `FRONTEND_ORIGINS`.
3. Configure a conexao PostgreSQL.

Opcao 1 (recomendada): `DATABASE_URL`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/contestacao_db
```

Opcao 2: variaveis separadas (quando nao quiser URL completa)

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=contestacao_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_SSLMODE=prefer
DATABASE_CONNECT_TIMEOUT=5
```

## Executar localmente

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Validar conexao com PostgreSQL

Com o backend em execucao:

- `GET /health` - status geral da API
- `GET /health/db` - testa conexao real com PostgreSQL (`SELECT 1`)

## Endpoints principais

- `GET /` - status basico do backend
- `GET /health` - healthcheck
- `GET /health/db` - healthcheck da conexao PostgreSQL
- `POST /api/gerar-contestacao` - envia dados para n8n e registra no PostgreSQL
- `POST /api/usuarios/cadastro` - cria conta de usuario com validacao de email/senha
- `POST /api/usuarios/login` - autentica usuario por email/senha
- `POST /api/usuarios/logout` - invalida token de sessao no servidor
