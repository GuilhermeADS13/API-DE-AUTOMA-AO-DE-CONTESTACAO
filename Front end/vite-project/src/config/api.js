/**
 * Enderecos centralizados da API.
 * Facilita mudanca de ambientes sem alterar varios arquivos.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
export const AGENT_API_URL = import.meta.env.VITE_IA_ENDPOINT || `${API_BASE_URL}/gerar-contestacao`;
export const SUPPORT_CONTACT_API_URL =
  import.meta.env.VITE_SUPPORT_CONTACT_ENDPOINT || `${API_BASE_URL}/suporte/contato`;
export const DASHBOARD_SUMMARY_API_URL =
  import.meta.env.VITE_DASHBOARD_SUMMARY_ENDPOINT || `${API_BASE_URL}/contestacoes/resumo`;
export const PETICAO_API_URL =
  import.meta.env.VITE_PETICAO_ENDPOINT || `${API_BASE_URL}/contestar-por-peticao`;
// PR22 - cadastro manual de jurisprudencia paradigma (admin)
export const JURISPRUDENCIA_CRIAR_URL =
  import.meta.env.VITE_JURISPRUDENCIA_CRIAR_ENDPOINT
  || `${API_BASE_URL}/admin/jurisprudencia/criar`;
// PR23 - CRUD admin (listar/edit/delete)
export const JURISPRUDENCIA_LISTAR_URL = `${API_BASE_URL}/admin/jurisprudencia/listar`;
export function jurisprudenciaIdUrl(id) {
  return `${API_BASE_URL}/admin/jurisprudencia/${encodeURIComponent(id)}`;
}
// PR27 (finding #10): backend endpoint pra checar se usuario e admin.
// Substitui ADMIN_EMAILS_FRONTEND (env var vazava lista no bundle JS).
export const USER_IS_ADMIN_URL = `${API_BASE_URL}/usuarios/is_admin`;

// PR5 (Guia Tecnico v3) — HiL e Observabilidade
export function confirmarExtracaoUrl(contestacaoId) {
  return `${API_BASE_URL}/contestacoes/${encodeURIComponent(contestacaoId)}/confirmar-extracao`;
}

export function patchMinutaUrl(contestacaoId) {
  return `${API_BASE_URL}/contestacoes/${encodeURIComponent(contestacaoId)}/minuta`;
}
