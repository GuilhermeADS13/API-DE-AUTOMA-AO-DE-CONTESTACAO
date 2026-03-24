# Frontend (React + Vite)

Interface do sistema de automacao de contestacao.

## Rodar localmente

```bash
cd "Front comp/vite-project"
npm install
npm run dev
```

## Scripts

- `npm run dev` - ambiente de desenvolvimento
- `npm run build` - build de producao
- `npm run preview` - preview local do build
- `npm run lint` - validacao eslint
- `npm run test` - executa testes unitarios (Vitest)
- `npm run test:watch` - modo watch de testes

## Variaveis de ambiente

Crie um `.env` (ou `.env.local`) em `vite-project` quando precisar sobrescrever:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_IA_ENDPOINT=http://localhost:8000/api/gerar-contestacao
VITE_SUPPORT_CONTACT_ENDPOINT=http://localhost:8000/api/suporte/contato
```

## Notas de arquitetura

- Sessao usa cookie HTTPOnly no backend (`credentials: include`) e guarda apenas perfil em `localStorage`.
- Envio do caso inclui metadados + conteudo base64 do arquivo base.
- Validacao de numero de processo no front segue regex CNJ do backend.
