import { FileEarmarkText, Upload, Cpu, Search } from "react-bootstrap-icons";

export const stats = [
  {
    label: "Tempo economizado por caso",
    value: "-78%",
    detail: "Media em operacoes repetitivas",
  },
  {
    label: "Produtividade da equipe",
    value: "+3.4x",
    detail: "Mais pecas finalizadas por dia",
  },
  {
    label: "Conformidade juridica",
    value: "96%",
    detail: "Saidas dentro do padrao definido",
  },
  {
    label: "Escritorios ativos",
    value: "32",
    detail: "Uso recorrente do fluxo automatizado",
  },
];

export const historyItems = [
  {
    id: "CTR-2026-001",
    naturezaCaso: "Acao de cobranca",
    status: "Concluida",
    data: "10/03/2026",
    tipo: "Contestacao editada",
  },
  {
    id: "CTR-2026-002",
    naturezaCaso: "Relacao de consumo",
    status: "Em analise",
    data: "10/03/2026",
    tipo: "Revisao de fundamentacao",
  },
  {
    id: "CTR-2026-003",
    naturezaCaso: "Responsabilidade civil",
    status: "Aguardando revisao",
    data: "09/03/2026",
    tipo: "Contestacao editada",
  },
];

export const flowSteps = [
  "Recebimento dos dados no frontend",
  "Disparo do webhook para n8n",
  "Classificacao da acao e da tese",
  "Edicao assistida da fundamentacao",
  "Validacao das regras juridicas",
  "Exportacao para revisao final",
];

export const pipelineCards = [
  {
    icon: Upload,
    title: "Entrada",
    text: "Recebe dados do processo e a peca base com validacoes iniciais.",
  },
  {
    icon: Search,
    title: "Analise",
    text: "Interpreta o caso e define a melhor linha juridica para resposta.",
  },
  {
    icon: Cpu,
    title: "IA",
    text: "Complementa argumentos com linguagem formal e padrao do escritorio.",
  },
  {
    icon: FileEarmarkText,
    title: "Saida",
    text: "Entrega documento estruturado, pronto para revisao e download.",
  },
];

export const agentRules = [
  "Nao alterar dados processuais sensiveis.",
  "Nao inventar jurisprudencia nem citacoes.",
  "Manter linguagem juridica formal e objetiva.",
  "Atuar apenas na edicao da peca base.",
];

export const dashboardCards = [
  { label: "Casos em fila", value: "07" },
  { label: "Em revisao humana", value: "14" },
  { label: "Prontas para download", value: "22" },
  { label: "Taxa de conformidade", value: "96%" },
];
