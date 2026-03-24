# Guia de Variaveis e Funcoes (Front + Back)

Este guia descreve o que cada parte principal faz e aponta melhorias futuras.

## Frontend

### `src/config/api.js`
- `API_BASE_URL`: base da API.
- `AGENT_API_URL`: endpoint de envio da contestacao.
- `DASHBOARD_SUMMARY_API_URL`: endpoint de cards e historico reais do dashboard.
- `SUPPORT_CONTACT_API_URL`: endpoint de envio da reclamacao para suporte.

Melhorias futuras:
- Adicionar ambientes `staging` e `production` com `.env`.

### `src/utils/storage.js`
- `DRAFT_STORAGE_KEY`: chave do rascunho no browser.
- `AUTH_SESSION_STORAGE_KEY`: chave do perfil local (sem token).
- `readDraftFromStorage()`: recupera rascunho.
- `persistDraft(payload)`: salva rascunho.
- `readStoredSession()`: recupera perfil local.
- `persistSession(session)`: salva perfil local.
- `clearSession()`: remove perfil local.

Melhorias futuras:
- Versionar schema do rascunho para migracoes de campos.

### `src/utils/validators.js`
- `EMAIL_REGEX`: validacao basica de e-mail.
- `PROCESSO_REGEX`: validacao CNJ no frontend.
- `PASSWORD_MIN_LENGTH`, `PASSWORD_MAX_LENGTH`: limites da senha.
- `normalizeEmail(value)`: normaliza e-mail.
- `isValidEmail(value)`: verifica formato de e-mail.
- `getApiErrorMessage(response, fallbackMessage)`: extrai mensagem amigavel do backend.
- `getPasswordChecks(value)`: checks visuais da senha.
- `validateAuthField(name, value, mode)`: regra de validacao por campo.
- `isValidNumeroProcesso(value)`: valida numero CNJ.

Melhorias futuras:
- Centralizar mensagens para i18n.

### `src/utils/files.js`
- `MAX_FILE_SIZE_BYTES`: limite maximo do arquivo.
- `ALLOWED_EXTENSIONS`: extensoes aceitas.
- `normalizeFileName(value)`: padroniza nome de exportacao.
- `validateFile(file)`: valida extensao e tamanho.
- `readFileAsBase64(file)`: converte arquivo para base64.

Melhorias futuras:
- Hash do arquivo no cliente para deduplicacao.

### `src/utils/html.js`
- `escapeHtml(value)`: evita injecao de HTML na visualizacao de exportacao.

Melhorias futuras:
- Trocar janela de impressao por geracao de PDF server-side.

### `src/utils/cases.js`
- `generateCaseId(currentHistory)`: gera ID incremental por ano.

Melhorias futuras:
- Delegar geracao do ID para backend.

### `src/App.jsx`
- `readValidSession()`: valida perfil salvo localmente.
- `handleAuthSubmit()`: login/cadastro via Supabase Auth.
- `handleLogout()`: encerra sessao no Supabase e limpa sessao local.
- `validateForm()`: valida campos obrigatorios e numero CNJ.
- `handleSubmit()`: serializa arquivo base64 e envia payload autenticado.
- `loadDashboardData()`: sincroniza cards + historico reais no PostgreSQL.
- `handleSaveDraft()`: salva rascunho.
- `handleDownloadDoc()`, `handleDownloadPdf()`: exporta minuta.

Melhorias futuras:
- Extrair hooks (`useAuth`, `useContestacaoForm`) para reduzir complexidade.

## Backend

### `Backend/App/database.py`
- `_safe_int(...)`: parser seguro de inteiros.
- `_build_database_url_from_parts()`: monta URL do banco quando `DATABASE_URL` nao existe.
- `_normalize_database_url(...)`: corrige URL legado `postgres://`.
- `_mask_database_url(...)`: mascara senha para logs.
- `_get_database_url()`: escolhe estrategia de conexao.
- `_get_session_ttl_seconds()`: converte TTL da sessao em segundos.
- `_connect()`: abre conexao PostgreSQL.
- `ping_database()`: healthcheck do banco.
- `init_db()`: cria/atualiza schema e indices.
- `_ensure_db_initialized()`: garante schema pronto antes de queries.
- `cleanup_sessoes_expiradas()`: remove sessoes vencidas.
- `create_usuario(...)`: insere usuario.
- `get_usuario_por_email(...)`: busca usuario para login.
- `create_sessao_usuario(...)`: cria sessao e retorna token.
- `get_sessao_ativa(...)`: valida sessao por token + TTL.
- `revoke_sessao(token)`: revoga sessao.
- `save_contestacao(payload, status, n8n_resposta)`: persiste rastreio da contestacao.

Melhorias futuras:
- Migrar para Alembic (migracoes versionadas).
- Adicionar pool de conexoes.

### `Backend/App/security.py`
- `SESSION_COOKIE_NAME`: nome do cookie de sessao.
- `SESSION_COOKIE_SAMESITE`, `SESSION_COOKIE_SECURE`: endurecimento do cookie.
- `_extract_bearer_token(...)`: extrai token do header.
- `extract_session_token(request, authorization)`: prioriza Bearer e fallback para cookie.
- `apply_session_cookie(response, token)`: seta cookie HTTPOnly.
- `clear_session_cookie(response)`: remove cookie.
- `get_authenticated_user(...)`: dependencia FastAPI para exigir sessao valida.

Melhorias futuras:
- Assinar token com metadados de dispositivo/IP.

### `Backend/App/services/n8n_service.py`
- `get_n8n_webhook_url()`: resolve URL do webhook.
- `enviar_para_n8n(dados)`: envia payload assincronamente e normaliza resposta.

Melhorias futuras:
- Retry exponencial e circuit breaker.

### `Backend/App/services/suporte_email_service.py`
- `enviar_reclamacao_por_email(payload)`: encaminha reclamacao para o e-mail de suporte via SMTP.
- `SupportEmailConfigError`: erro de configuracao SMTP.
- `SupportEmailServiceError`: erro de envio SMTP.

Melhorias futuras:
- Suportar fallback com fila e retry para indisponibilidade temporaria de SMTP.

### `Backend/App/models/processo.py`
- `PROCESSO_REGEX`: formato CNJ.
- `ALLOWED_BASE_FILE_EXTENSIONS`: extensoes aceitas.
- `MAX_FILE_SIZE_BYTES`: limite de upload.
- `Processo`: schema principal de entrada.
- `validar_numero_processo(...)`: valida CNJ.
- `limpar_texto(...)`: saneia texto obrigatorio.
- `validar_nome_arquivo(...)`: valida extensao do arquivo.
- `validar_arquivo_base64(...)`: valida base64.
- `validar_tamanho_informado(...)`: valida tamanho informado.
- `normalizar_texto_editado(...)`: normaliza texto livre.
- `validar_consistencia_arquivo(...)`: valida consistencia entre nome e conteudo.

Melhorias futuras:
- Antivírus/scan de documento no backend.

### `Backend/App/routes/contestacao.py`
- `gerar_contestacao(...)`: rota autenticada para envio ao n8n e persistencia.
- `obter_resumo_contestacoes(...)`: cards e historico reais para o dashboard.

Melhorias futuras:
- Enfileirar processamento assíncrono (fila + worker).

### `Backend/App/routes/usuario.py`
- `cadastrar_usuario(...)`: cria conta + sessao.
- `login_usuario(...)`: autentica e cria sessao.
- `logout_usuario(...)`: revoga sessao + remove cookie.
- `obter_sessao(...)`: valida sessao atual.

### `Backend/App/routes/suporte.py`
- `enviar_contato(...)`: recebe reclamacao, gera protocolo e envia para e-mail de suporte.

Melhorias futuras:
- Limite de tentativas de login e auditoria.
