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
$env:OPENAI_MAX_OUTPUT_TOKENS="2200"
$env:OPENAI_TEMPERATURE="0.15"
$env:OPENAI_TIMEOUT_MS="35000"
```

Se quiser salvar no Windows para abrir depois:

```powershell
setx OPENAI_API_KEY "sua_openai_api_key"
setx OPENAI_MODEL "gpt-5.3-codex"
setx OPENAI_BASE_URL "https://api.openai.com/v1"
setx OPENAI_MAX_OUTPUT_TOKENS "2200"
setx OPENAI_TEMPERATURE "0.15"
setx OPENAI_TIMEOUT_MS "35000"
```

## 3) Iniciar servicos

Terminal 1 (backend):

```powershell
cd "C:\Users\lakil\Downloads\FRONTEND AUTOJURI\API-DE-AUTOMA-AO-DE-CONTESTACAO\Backend"
.\.venv\Scripts\activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000
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

