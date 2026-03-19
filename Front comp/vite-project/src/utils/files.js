/**
 * Limite maximo do arquivo para evitar payload excessivo.
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Extensoes aceitas para peca base.
 */
export const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx"];

/**
 * Normaliza nome para exportacao local de arquivo.
 */
export function normalizeFileName(value) {
  return (value || "defesa")
    .toLowerCase()
    .replace(/[^\w-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Valida arquivo do input antes do envio.
 */
export function validateFile(file) {
  if (!file) return "Selecione um arquivo DOCX, DOC ou PDF.";

  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return "Formato invalido. Envie apenas DOCX, DOC ou PDF.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Arquivo muito grande. Limite de 10MB.";
  }

  return "";
}

/**
 * Converte File do navegador para base64 puro (sem prefixo data:).
 */
export async function readFileAsBase64(file) {
  if (!file) return "";

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === "string" ? reader.result : "";
      const base64 = raw.includes(",") ? raw.split(",")[1] : raw;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Falha ao ler arquivo no navegador."));
    reader.readAsDataURL(file);
  });
}
