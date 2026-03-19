# Backend

API FastAPI do projeto de automacao de contestacao com integracao n8n e persistencia em PostgreSQL.

## Requisitos

- Python 3.10+
- PostgreSQL 14+

## Configuracao

1. Copie `.env.example` para `.env`.
2. Ajuste `N8N_WEBHOOK_URL` e `FRONTEND_ORIGINS`.
3. Configure a conexao PostgreSQL.
4. Configure opcoes de sessao (`SESSION_TTL_HOURS`, `SESSION_COOKIE_*`) quando necessario.

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
SESSION_TTL_HOURS=12
SESSION_COOKIE_NAME=contestacao_session
SESSION_COOKIE_SAMESITE=lax
SESSION_COOKIE_SECURE=false
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
- `GET /api/usuarios/sessao` - valida sessao atual via cookie/Authorization

## Seguranca e sessao

- O backend agora aceita sessao por cookie HTTPOnly e por header `Authorization: Bearer <token>`.
- O endpoint `POST /api/gerar-contestacao` exige autenticacao.
- CORS esta com `allow_credentials=True`, entao o frontend deve usar `credentials: "include"`.

## Testes

```bash
cd Backend
pip install -r requirements-dev.txt
pytest
```
