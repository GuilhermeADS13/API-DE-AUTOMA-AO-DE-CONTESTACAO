/**
 * Enderecos centralizados da API.
 * Facilita mudanca de ambientes sem alterar varios arquivos.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
export const AGENT_API_URL = import.meta.env.VITE_IA_ENDPOINT || `${API_BASE_URL}/gerar-contestacao`;
export const AUTH_SIGNUP_API_URL = `${API_BASE_URL}/usuarios/cadastro`;
export const AUTH_LOGIN_API_URL = `${API_BASE_URL}/usuarios/login`;
export const AUTH_LOGOUT_API_URL = `${API_BASE_URL}/usuarios/logout`;
export const AUTH_SESSION_API_URL = `${API_BASE_URL}/usuarios/sessao`;
