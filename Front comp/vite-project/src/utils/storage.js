/**
 * Chave do rascunho local.
 * Mantem campos do formulario para recuperar trabalho nao enviado.
 */
export const DRAFT_STORAGE_KEY = "jurisflow:draft:v2";

/**
 * Chave da sessao local (somente dados de perfil, sem token sensivel).
 */
export const AUTH_SESSION_STORAGE_KEY = "jurisflow:auth:session:v2";
/**
 * Le o rascunho salvo no navegador.
 */
export function readDraftFromStorage() {
  if (typeof window === "undefined") {
    return { form: null, info: "" };
  }

  try {
    const saved = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!saved) return { form: null, info: "" };

    const parsed = JSON.parse(saved);
    return {
      form: parsed.form || null,
      info: parsed.savedAt ? `Rascunho recuperado: ${parsed.savedAt}` : "",
    };
  } catch {
    return {
      form: null,
      info: "Nao foi possivel recuperar o rascunho salvo.",
    };
  }
}

/**
 * Persiste rascunho da tela principal.
 */
export function persistDraft(payload) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
}

/**
 * Le sessao local (perfil), sem depender de token no navegador.
 */
export function readStoredSession() {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

/**
 * Salva dados nao sensiveis da conta no browser.
 */
export function persistSession(session) {
  if (typeof window === "undefined") return;
  const safeSession = {
    id: session?.id || "",
    name: session?.name || "Conta",
    email: session?.email || "",
  };
  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(safeSession));
}

/**
 * Remove sessao local ao sair da conta.
 */
export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}

