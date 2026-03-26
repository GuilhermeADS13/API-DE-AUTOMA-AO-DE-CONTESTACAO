# Guia n8n Agente IA

Este guia ativa o fluxo de contestacao com geracao por IA no n8n.

## 1) Workflow publicado

- Workflow: `AutoJuri - Webhook Contestacao`
- ID: `WF_AUTOJURI_CONTESTACAO`
- Caminho do webhook: `POST /webhook/contestacao`
- Arquivo fonte: `docs/n8n_workflow_contestacao.json`

## 2) Variaveis de ambiente do n8n

Defina no terminal antes de iniciar o n8n:

```powershell
$env:OPENAI_API_KEY="sua_openai_api_key"
$env:OPENAI_MODEL="gpt-5.3-codex"
$env:OPENAI_BASE_URL="https://api.openai.com/v1"
$env:OPENAI_MAX_OUTPUT_TOKENS="2600"
$env:OPENAI_TEMPERATURE="0.12"
$env:OPENAI_TIMEOUT_MS="35000"
$env:CONTESTACAO_DB_PROVIDER="backend_postgresql_supabase"
$env:CONTESTACAO_DB_TABLE="contestacoes"
$env:CONTESTACAO_DB_STATUS_FIELD="status"
$env:N8N_RUNNERS_INSECURE_MODE="true"
$env:N8N_BLOCK_ENV_ACCESS_IN_NODE="false"
```

Observacao: o workflow aceita aliases de variavel para maior compatibilidade:
- `OPENAI_API_KEY` ou `OPENAI_KEY` ou `OPENAI_SECRET_KEY`
- `OPENAI_MODEL` ou `OPENAI_RESPONSES_MODEL` ou `OPENAI_CHAT_MODEL`
- `OPENAI_BASE_URL` ou `OPENAI_API_BASE_URL`

Se quiser salvar no Windows para abrir depois:

```powershell
setx OPENAI_API_KEY "sua_openai_api_key"
setx OPENAI_MODEL "gpt-5.3-codex"
setx OPENAI_BASE_URL "https://api.openai.com/v1"
setx OPENAI_MAX_OUTPUT_TOKENS "2600"
setx OPENAI_TEMPERATURE "0.12"
setx OPENAI_TIMEOUT_MS "35000"
setx CONTESTACAO_DB_PROVIDER "backend_postgresql_supabase"
setx CONTESTACAO_DB_TABLE "contestacoes"
setx CONTESTACAO_DB_STATUS_FIELD "status"
setx N8N_RUNNERS_INSECURE_MODE "true"
setx N8N_BLOCK_ENV_ACCESS_IN_NODE "false"
```

Depois de usar `setx`, feche e abra um novo terminal antes de executar `n8n.cmd start`.

## 3) Iniciar servicos

Terminal 1 (backend):

```powershell
cd "C:\Users\lakil\Downloads\FRONTEND AUTOJURI\API-DE-AUTOMA-AO-DE-CONTESTACAO\Backend"
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Terminal 2 (frontend):

```powershell
cd "C:\Users\lakil\Downloads\FRONTEND AUTOJURI\API-DE-AUTOMA-AO-DE-CONTESTACAO\Front comp\vite-project"
npm run dev
```

Terminal 3 (n8n):

```powershell
cd "C:\Users\lakil\Downloads\FRONTEND AUTOJURI\API-DE-AUTOMA-AO-DE-CONTESTACAO"
n8n.cmd start
```

## 4) Teste rapido do webhook

```powershell
$body = @{
  numero_processo = "0001234-56.2026.8.00.0000"
  autor = "Autor Teste"
  reu = "Reu Teste"
  tipo_acao = "Direito Civil"
  fatos = "Fatos de teste"
  pedido_autor = "Improcedencia"
  texto_editado_ao_vivo = "Observacoes do operador"
} | ConvertTo-Json

Invoke-RestMethod -Method POST `
  -Uri "http://127.0.0.1:5678/webhook/contestacao" `
  -ContentType "application/json" `
  -Body $body
```

## 5) Comportamento do agente

- Com `OPENAI_API_KEY`: usa OpenAI Responses API e retorna minuta estruturada.
- Sem `OPENAI_API_KEY`: entra em fallback local (nao interrompe o fluxo).
- Validacao CNJ e campos obrigatorios sempre ativa.
- O retorno inclui bloco `infra` com:
  - modelo configurado (`OPENAI_MODEL`)
  - provider/tabela de persistencia (`CONTESTACAO_DB_PROVIDER` e `CONTESTACAO_DB_TABLE`)
  - campo de status (`CONTESTACAO_DB_STATUS_FIELD`)
- A persistencia real fica no backend (`save_contestacao` na tabela `contestacoes`).

## 6) Diagnostico rapido (quando cair em fallback)

- Se vier `motivo: OPENAI_API_KEY_nao_configurada`:
  - confira `OPENAI_API_KEY` e `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`;
  - reinicie o `n8n.cmd start` no mesmo terminal.
- Se vier `motivo: OpenAI API falhou: You exceeded your current quota...`:
  - a chave esta sendo lida, mas a conta/projeto da OpenAI esta sem saldo/limite;
  - regularize em Billing/Usage da OpenAI para voltar ao provider `openai`.
