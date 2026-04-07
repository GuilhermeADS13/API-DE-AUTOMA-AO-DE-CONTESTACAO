# Guia n8n Agente IA

Este guia ativa o fluxo de contestacao com geracao por IA no n8n.

## 1) Workflow publicado

- Workflow: `AutoJuri - Webhook Contestacao v3`
- ID: `WF_AUTOJURI_CONTESTACAO`
- Caminho do webhook: `POST /webhook/contestacao`
- Arquivo fonte: `docs/n8n_workflow_contestacao_v3.json`
- Versoes anteriores: `docs/n8n_workflow_contestacao.json` (v1), `docs/n8n_workflow_contestacao_runtimefix.json` (v2)

## 2) Pipeline do workflow v3

```
Webhook POST /contestacao
  -> Orquestrador Regras (validacao CNJ, campos, normalizacao)
  -> Classificador Entrada (prioridade, complexidade, score_risco)
  -> Buscar Defesas Anteriores (consulta Supabase REST API)  [NOVO v3]
  -> Agente IA Contestacao (OpenAI com contexto de rotas/banco/defesas)  [ENRIQUECIDO v3]
  -> Responder (retorna JSON ao backend)
```

Novidades da v3:
- O agente agora **consulta defesas anteriores** do mesmo `tipo_acao` no Supabase antes de gerar a minuta.
- O system prompt inclui **contexto completo** de rotas do backend, schema do banco e paginas do frontend.
- Defesas anteriores sao usadas como **referencia de estilo e tese**, sem copia literal.
- O fallback local tambem incorpora teses de defesas anteriores quando disponiveis.

## 3) Variaveis de ambiente do n8n

Defina no terminal antes de iniciar o n8n:

```powershell
# OpenAI
$env:OPENAI_API_KEY="sua_openai_api_key"
$env:OPENAI_MODEL="gpt-5.3-codex"
$env:OPENAI_BASE_URL="https://api.openai.com/v1"
$env:OPENAI_MAX_OUTPUT_TOKENS="2600"
$env:OPENAI_TEMPERATURE="0.12"
$env:OPENAI_TIMEOUT_MS="35000"

# Banco de dados
$env:CONTESTACAO_DB_PROVIDER="backend_postgresql_supabase"
$env:CONTESTACAO_DB_TABLE="contestacoes"
$env:CONTESTACAO_DB_STATUS_FIELD="status"

# Supabase (necessario para busca de defesas anteriores na v3)
$env:SUPABASE_URL="https://sszkrvxhlxfrutwywsko.supabase.co"
$env:SUPABASE_PUBLISHABLE_KEY="sb_publishable_N1VpE-77jkMfRfoLncBO2w_fE2EAc6n"

# n8n runtime
$env:N8N_RUNNERS_INSECURE_MODE="true"
$env:N8N_BLOCK_ENV_ACCESS_IN_NODE="false"
```

Observacao: o workflow aceita aliases de variavel para maior compatibilidade:
- `OPENAI_API_KEY` ou `OPENAI_KEY` ou `OPENAI_SECRET_KEY`
- `OPENAI_MODEL` ou `OPENAI_RESPONSES_MODEL` ou `OPENAI_CHAT_MODEL`
- `OPENAI_BASE_URL` ou `OPENAI_API_BASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` ou `SUPABASE_ANON_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`

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
setx SUPABASE_URL "https://sszkrvxhlxfrutwywsko.supabase.co"
setx SUPABASE_PUBLISHABLE_KEY "sb_publishable_N1VpE-77jkMfRfoLncBO2w_fE2EAc6n"
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

## 5) Comportamento do agente (v3)

- Com `OPENAI_API_KEY`: usa OpenAI Responses API e retorna minuta estruturada.
- Sem `OPENAI_API_KEY`: entra em fallback local (nao interrompe o fluxo).
- Validacao CNJ e campos obrigatorios sempre ativa.
- O retorno inclui bloco `infra` com:
  - modelo configurado (`OPENAI_MODEL`)
  - provider/tabela de persistencia (`CONTESTACAO_DB_PROVIDER` e `CONTESTACAO_DB_TABLE`)
  - campo de status (`CONTESTACAO_DB_STATUS_FIELD`)
- A persistencia real fica no backend (`save_contestacao` na tabela `contestacoes`).

### Novidades v3 - Contexto historico e rotas

- **Busca de defesas anteriores**: antes de gerar a minuta, o workflow consulta ate 5 defesas concluidas (`status=ok`) do mesmo `tipo_acao` no Supabase via REST API.
- **Contexto de rotas injetado**: o system prompt agora inclui todas as rotas do backend, schema do banco e paginas do frontend para que o agente entenda a arquitetura.
- **Referencia sem copia**: o agente usa defesas anteriores como referencia de tese e estilo, mas nao copia literalmente.
- **Fallback enriquecido**: mesmo sem OpenAI, o fallback local incorpora teses de defesas anteriores quando disponiveis.
- **Auditoria expandida**: o retorno agora inclui `defesas_anteriores.consultadas` e `defesas_anteriores.status`.

### Bloco `defesas_anteriores` no retorno

```json
{
  "defesas_anteriores": {
    "consultadas": 3,
    "status": "sucesso"
  }
}
```

Status possiveis: `sucesso`, `sem_resultados`, `sem_credenciais`, `erro_http`, `erro_conexao`, `nao_executada`.

## 6) Diagnostico rapido (quando cair em fallback)

- Se vier `motivo: OPENAI_API_KEY_nao_configurada`:
  - confira `OPENAI_API_KEY` e `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`;
  - reinicie o `n8n.cmd start` no mesmo terminal.
- Se vier `motivo: OpenAI API falhou: You exceeded your current quota...`:
  - a chave esta sendo lida, mas a conta/projeto da OpenAI esta sem saldo/limite;
  - regularize em Billing/Usage da OpenAI para voltar ao provider `openai`.

## 7) Diagnostico da busca de defesas anteriores

- Se `defesas_anteriores.status` vier `sem_credenciais`:
  - confira `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` no ambiente do n8n;
  - reinicie o `n8n.cmd start` no mesmo terminal.
- Se vier `erro_http`:
  - verifique se a tabela `contestacoes` existe no Supabase;
  - verifique se Row Level Security (RLS) permite SELECT com a anon key.
- Se vier `sem_resultados`:
  - nao ha defesas concluidas (`status=ok`) do mesmo `tipo_acao` no banco;
  - normal para primeiros usos - o agente funciona sem contexto historico.
- Se vier `erro_conexao`:
  - verifique conectividade do servidor n8n com a internet;
  - confirme que a URL do Supabase esta correta.

## 8) Importar workflow v3 no n8n

1. Abra o n8n em `http://localhost:5678`.
2. Va em **Workflows** > **Import from file**.
3. Selecione `docs/n8n_workflow_contestacao_v3.json`.
4. Ative o workflow.
5. Teste com o comando do item 4 deste guia.
