/*
=========================================================
SETOR 1 — IMPORTAÇÃO DOS ÍCONES
Esses ícones são usados no pipeline do sistema.
=========================================================
*/

import {
  FileEarmarkText,
  Upload,
  Cpu,
  Search,
} from "react-bootstrap-icons"

/*
=========================================================
SETOR 2 — MÉTRICAS DO SISTEMA
Esses dados alimentam os cards da seção StatsSection.
=========================================================
*/

export const stats = [
  { label: "Peças editadas hoje", value: "128+" },
  { label: "Escritórios ativos", value: "32" },
  { label: "Teses disponíveis", value: "96" },
  { label: "Tempo médio poupado", value: "73%" },
]

/*
=========================================================
SETOR 3 — HISTÓRICO DE DOCUMENTOS
Esses dados aparecem na tabela do painel principal.
=========================================================
*/

export const historyItems = [
  {
    id: "CTR-2026-001",
    cliente: "Ação de cobrança",
    status: "Concluída",
    data: "10/03/2026",
    tipo: "Contestação editada",
  },
  {
    id: "CTR-2026-002",
    cliente: "Relação de consumo",
    status: "Em análise",
    data: "10/03/2026",
    tipo: "Revisão de fundamentação",
  },
  {
    id: "CTR-2026-003",
    cliente: "Responsabilidade civil",
    status: "Concluída",
    data: "09/03/2026",
    tipo: "Contestação editada",
  },
]

/*
=========================================================
SETOR 4 — ETAPAS DO FLUXO DO SISTEMA
Usado no painel para explicar o fluxo da automação.
=========================================================
*/

export const flowSteps = [
  "Recebimento no frontend",
  "Orquestração via n8n",
  "Classificação da ação",
  "Seleção de tese jurídica",
  "Edição da fundamentação",
  "Exportação final",
]

/*
=========================================================
SETOR 5 — CARDS DO PIPELINE N8N
Usados na seção WorkflowN8nSection.
=========================================================
*/

export const pipelineCards = [
  {
    icon: Upload,
    title: "Entrada",
    text: "Recebe os dados do processo e a peça base enviada pelo usuário.",
  },
  {
    icon: Search,
    title: "Análise",
    text: "Classifica o caso e identifica a melhor linha de atuação jurídica.",
  },
  {
    icon: Cpu,
    title: "IA",
    text: "Edita e complementa a fundamentação dentro das regras definidas.",
  },
  {
    icon: FileEarmarkText,
    title: "Saída",
    text: "Entrega o documento final para revisão, download e histórico.",
  },
]

/*
=========================================================
SETOR 6 — REGRAS DO AGENTE JURÍDICO
Essas regras aparecem no painel principal do sistema.
=========================================================
*/

export const agentRules = [
  "Não alterar dados do processo.",
  "Não inventar jurisprudência.",
  "Manter linguagem jurídica formal.",
  "Atuar sobre a peça base, sem reescrever tudo.",
]

/*
=========================================================
SETOR 7 — INDICADORES DO DASHBOARD
Usados na seção DashboardSection.
=========================================================
*/

export const dashboardCards = [
  { label: "Casos em fila", value: "07" },
  { label: "Em revisão humana", value: "14" },
  { label: "Prontas para download", value: "22" },
  { label: "Taxa de conformidade", value: "96%" },
]