import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal } from "react-bootstrap";

import AppNavbar from "./components/AppNavbar";
import AuthModal from "./components/AuthModal";
import HeroSection from "./components/HeroSection";
import StatsSection from "./components/StatsSection";
import MainPanelSection from "./components/MainPanelSection";
import DashboardSection from "./components/DashboardSection";
import AppFooter from "./components/AppFooter";
import { historyItems } from "./data/mockData";

const DRAFT_STORAGE_KEY = "jurisflow:draft:v2";
const AUTH_USERS_STORAGE_KEY = "jurisflow:auth:users:v1";
const AUTH_SESSION_STORAGE_KEY = "jurisflow:auth:session:v1";
const AGENT_API_URL = import.meta.env.VITE_IA_ENDPOINT || "http://localhost:8000/api/gerar-contestacao";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx"];

function normalizeFileName(value) {
  return (value || "defesa")
    .toLowerCase()
    .replace(/[^\w-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateCaseId(currentHistory) {
  const year = new Date().getFullYear();
  const existing = currentHistory
    .map((item) => Number(item.id.split("-")[2]))
    .filter((value) => Number.isFinite(value));
  const next = (existing.length ? Math.max(...existing) : 0) + 1;
  return `CTR-${year}-${String(next).padStart(3, "0")}`;
}

function readDraftFromStorage() {
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

function readStoredUsers() {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(AUTH_USERS_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readStoredSession() {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function persistUsers(users) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(users));
}

function persistSession(session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim());
}

function readValidSession() {
  const session = readStoredSession();
  if (!session?.email) return null;

  const users = readStoredUsers();
  const hasUser = users.some((user) => user.email === session.email);
  if (!hasUser) {
    clearSession();
    return null;
  }

  return {
    name: session.name || "Conta",
    email: session.email,
  };
}

export default function App() {
  const [draftSeed] = useState(readDraftFromStorage);
  const [currentPage, setCurrentPage] = useState("inicio");

  const [showResultModal, setShowResultModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastCaseId, setLastCaseId] = useState(null);
  const [authUser, setAuthUser] = useState(readValidSession);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authErrors, setAuthErrors] = useState({});
  const [authFeedback, setAuthFeedback] = useState(null);

  const [form, setForm] = useState(() => ({
    processo: "",
    cliente: "",
    tipoAcao: "",
    tese: "",
    observacoes: "",
    ...(draftSeed.form || {}),
  }));

  const [history, setHistory] = useState(() => [...historyItems]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [draftInfo, setDraftInfo] = useState(() => draftSeed.info);
  const [feedback, setFeedback] = useState(null);
  const [automationStatus, setAutomationStatus] = useState({
    webhook: 100,
    ia: 86,
    validacao: 92,
  });

  const [liveDraft, setLiveDraft] = useState("");
  const [liveDraftTouched, setLiveDraftTouched] = useState(false);

  const completion = useMemo(() => {
    const fields = [...Object.values(form), uploadedFile ? "arquivo" : ""];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [form, uploadedFile]);

  const generatedPreviewParagraphs = useMemo(() => {
    const cliente = form.cliente.trim() || "a parte requerida";
    const tipoAcao = form.tipoAcao.trim() || "ramo juridico ainda nao definido";
    const tese = form.tese.trim() || "a tese principal definida";
    const observacoes = form.observacoes.trim();

    return [
      `No ambito de ${tipoAcao.toLowerCase()}, ${cliente} apresenta defesa e destaca ausencia de pressupostos para procedencia do pedido inicial.`,
      `O agente recomenda reforco argumentativo com base em ${tese.toLowerCase()}, mantendo linguagem juridica formal e estrutura definida pelo escritorio.`,
      observacoes
        ? `Observacoes relevantes para a equipe: ${observacoes}`
        : "O documento segue para revisao humana antes da exportacao final.",
    ];
  }, [form]);

  const generatedDraftText = useMemo(
    () => generatedPreviewParagraphs.join("\n\n"),
    [generatedPreviewParagraphs],
  );

  useEffect(() => {
    if (!liveDraftTouched) {
      setLiveDraft(generatedDraftText);
    }
  }, [generatedDraftText, liveDraftTouched]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleLiveDraftChange = (event) => {
    setLiveDraftTouched(true);
    setLiveDraft(event.target.value);
  };

  const handleResetLiveDraft = () => {
    setLiveDraft(generatedDraftText);
    setLiveDraftTouched(false);
  };

  const openAuthModal = (mode = "login") => {
    setAuthMode(mode);
    setAuthErrors({});
    setAuthFeedback(null);
    setAuthForm({
      name: "",
      email: "",
      password: "",
    });
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthErrors({});
    setAuthFeedback(null);
  };

  const handleAuthModeChange = (mode) => {
    setAuthMode(mode);
    setAuthErrors({});
    setAuthFeedback(null);
    setAuthForm({
      name: "",
      email: "",
      password: "",
    });
  };

  const handleAuthFieldChange = (event) => {
    const { name, value } = event.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
    setAuthErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validateAuthForm = () => {
    const errors = {};

    if (authMode === "signup" && !authForm.name.trim()) {
      errors.name = "Informe o nome para criar a conta.";
    }
    if (!isValidEmail(authForm.email)) {
      errors.email = "Informe um e-mail valido.";
    }
    if (authForm.password.trim().length < 6) {
      errors.password = "Use uma senha com pelo menos 6 caracteres.";
    }

    return errors;
  };

  const handleAuthSubmit = (event) => {
    event.preventDefault();
    const errors = validateAuthForm();

    if (Object.keys(errors).length) {
      setAuthErrors(errors);
      setAuthFeedback({
        variant: "danger",
        text: "Revise os dados de acesso antes de continuar.",
      });
      return;
    }

    const email = authForm.email.trim().toLowerCase();
    const users = readStoredUsers();

    if (authMode === "signup") {
      const alreadyExists = users.some((user) => user.email === email);
      if (alreadyExists) {
        setAuthErrors({ email: "Ja existe uma conta com este e-mail." });
        setAuthFeedback({
          variant: "danger",
          text: "Este e-mail ja esta cadastrado. Entre com sua conta ou use outro e-mail.",
        });
        return;
      }

      const newUser = {
        id: `USR-${Date.now()}`,
        name: authForm.name.trim(),
        email,
        password: authForm.password,
      };

      persistUsers([...users, newUser]);
      const session = {
        name: newUser.name,
        email: newUser.email,
      };

      persistSession(session);
      setAuthUser(session);
      setShowAuthModal(false);
      setFeedback({
        variant: "success",
        text: `Conta criada com sucesso. Bem-vindo ao workspace, ${newUser.name}.`,
      });
      return;
    }

    const matchedUser = users.find(
      (user) => user.email === email && user.password === authForm.password,
    );

    if (!matchedUser) {
      setAuthErrors({
        email: "Verifique o e-mail informado.",
        password: "Verifique a senha informada.",
      });
      setAuthFeedback({
        variant: "danger",
        text: "Nao encontramos uma conta com esse e-mail e senha.",
      });
      return;
    }

    const session = {
      name: matchedUser.name,
      email: matchedUser.email,
    };

    persistSession(session);
    setAuthUser(session);
    setShowAuthModal(false);
    setFeedback({
      variant: "success",
      text: `Acesso liberado. Bem-vindo de volta, ${matchedUser.name}.`,
    });
  };

  const handleLogout = () => {
    clearSession();
    setAuthUser(null);
    setFeedback({
      variant: "info",
      text: "Sessao encerrada com sucesso.",
    });
  };

  const validateFile = (file) => {
    if (!file) return "Selecione um arquivo DOCX, DOC ou PDF.";

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return "Formato invalido. Envie apenas DOCX, DOC ou PDF.";
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return "Arquivo acima de 10 MB. Reduza o tamanho e tente novamente.";
    }

    return "";
  };

  const handleFileSelect = (file) => {
    const error = validateFile(file);
    if (error) {
      setUploadedFile(null);
      setUploadError(error);
      return;
    }

    setUploadedFile(file);
    setUploadError("");
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.upload;
      return next;
    });
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadError("");
  };

  const validateForm = () => {
    const errors = {};

    if (!form.processo.trim()) errors.processo = "Informe o numero do processo.";
    if (!form.cliente.trim()) errors.cliente = "Informe o cliente ou parte.";
    if (!form.tipoAcao.trim()) errors.tipoAcao = "Selecione o ramo do direito.";
    if (!form.tese.trim()) errors.tese = "Informe a tese principal.";
    if (!form.observacoes.trim()) errors.observacoes = "Adicione orientacoes para o agente.";
    if (!uploadedFile) errors.upload = "Anexe a peca base para continuar.";

    return errors;
  };

  const handleSaveDraft = () => {
    const savedAt = new Date().toLocaleString("pt-BR");
    const payload = {
      form,
      fileName: uploadedFile ? uploadedFile.name : null,
      savedAt,
    };

    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      setDraftInfo(`Ultimo rascunho salvo em ${savedAt}`);
      setFeedback({
        variant: "success",
        text: "Rascunho salvo com sucesso.",
      });
    } catch {
      setFeedback({
        variant: "danger",
        text: "Nao foi possivel salvar o rascunho no navegador.",
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validateForm();

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      setSubmitted(false);
      setFeedback({
        variant: "danger",
        text: "Revise os campos obrigatorios antes de enviar.",
      });
      return;
    }

    setLoading(true);
    setSubmitted(false);
    setFeedback(null);
    setAutomationStatus({ webhook: 100, ia: 32, validacao: 18 });

    const nextCaseId = generateCaseId(history);
    const today = new Date().toLocaleDateString("pt-BR");
    setLastCaseId(nextCaseId);
    setHistory((prev) => [
      {
        id: nextCaseId,
        naturezaCaso: form.tipoAcao,
        status: "Em analise",
        data: today,
        tipo: "Defesa em processamento",
      },
      ...prev,
    ]);

    const payload = {
      numero_processo: form.processo.trim(),
      autor: form.cliente.trim(),
      reu: "Nao informado",
      tipo_acao: form.tipoAcao.trim(),
      fatos: form.observacoes.trim(),
      pedido_autor: form.tese.trim(),
      arquivo_base: uploadedFile?.name || "",
      texto_editado_ao_vivo: (liveDraft.trim() || generatedDraftText).trim(),
    };

    try {
      const response = await fetch(AGENT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Falha HTTP ${response.status}`);
      }

      setLoading(false);
      setSubmitted(true);
      setShowResultModal(true);
      setAutomationStatus({ webhook: 100, ia: 86, validacao: 92 });
      setHistory((prev) =>
        prev.map((item) =>
          item.id === nextCaseId
            ? { ...item, status: "Concluida", tipo: "Defesa editada" }
            : item,
        ),
      );
      setFeedback({
        variant: "success",
        text: "Caso enviado ao agente de IA com sucesso. Defesa pronta para revisao.",
      });
      setCurrentPage("dashboard");
    } catch {
      setLoading(false);
      setAutomationStatus({ webhook: 42, ia: 0, validacao: 0 });
      setHistory((prev) =>
        prev.map((item) =>
          item.id === nextCaseId
            ? { ...item, status: "Falha no envio", tipo: "Erro de integracao" }
            : item,
        ),
      );
      setFeedback({
        variant: "danger",
        text: "Nao foi possivel enviar para o agente de IA. Verifique se o backend esta ativo em http://localhost:8000.",
      });
    }
  };

  const buildDocumentText = () => {
    const lines = [
      "DEFESA - MINUTA GERADA PELO SISTEMA",
      "",
      `Processo: ${form.processo || "-"}`,
      `Cliente/Parte: ${form.cliente || "-"}`,
      `Ramo do direito: ${form.tipoAcao || "-"}`,
      `Tese principal: ${form.tese || "-"}`,
      `Arquivo base: ${uploadedFile ? uploadedFile.name : "-"}`,
      "",
      "EDICAO AO VIVO",
      liveDraft.trim() || generatedDraftText,
    ];
    return lines.join("\n");
  };

  const handleDownloadDoc = () => {
    if (!submitted) {
      setFeedback({
        variant: "warning",
        text: "Envie o caso para automacao antes de baixar o documento.",
      });
      return;
    }

    const blob = new Blob([buildDocumentText()], {
      type: "application/msword;charset=utf-8",
    });
    const baseName = normalizeFileName(form.processo || lastCaseId || "defesa");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${baseName}.doc`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleDownloadPdf = () => {
    if (!submitted) {
      setFeedback({
        variant: "warning",
        text: "Envie o caso para automacao antes de gerar o PDF.",
      });
      return;
    }

    const printable = `
      <html>
        <head>
          <title>Defesa ${form.processo || ""}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; line-height: 1.6; color: #222; }
            h1 { font-size: 18px; margin-bottom: 16px; }
            p { margin: 0 0 12px 0; white-space: pre-line; }
          </style>
        </head>
        <body>
          <h1>Defesa - Minuta</h1>
          <p>${(liveDraft.trim() || generatedDraftText).replace(/\n/g, "<br/>")}</p>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      setFeedback({
        variant: "danger",
        text: "Nao foi possivel abrir a janela para gerar o PDF.",
      });
      return;
    }

    printWindow.document.write(printable);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleNavigate = (pageId) => {
    setCurrentPage(pageId);
  };

  return (
    <div className="app-shell min-vh-100">
      <AppNavbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        authUser={authUser}
        onOpenLogin={openAuthModal}
        onOpenSignup={openAuthModal}
        onLogout={handleLogout}
      />

      {currentPage === "inicio" && (
        <>
          <HeroSection onNavigate={handleNavigate} />
          <StatsSection />
        </>
      )}

      {currentPage === "painel" && (
        <MainPanelSection
          form={form}
          completion={completion}
          submitted={submitted}
          loading={loading}
          formErrors={formErrors}
          uploadError={uploadError}
          uploadedFile={uploadedFile}
          draftInfo={draftInfo}
          feedback={feedback}
          liveDraft={liveDraft}
          liveDraftTouched={liveDraftTouched}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onFileSelect={handleFileSelect}
          onRemoveFile={handleRemoveFile}
          onSaveDraft={handleSaveDraft}
          onLiveDraftChange={handleLiveDraftChange}
          onResetLiveDraft={handleResetLiveDraft}
        />
      )}

      {currentPage === "dashboard" && (
        <>
          <DashboardSection history={history} automationStatus={automationStatus} />
          <section className="pb-5">
            <div className="container">
              <div className="d-flex flex-wrap gap-2">
                <Button variant="dark" onClick={handleDownloadDoc} disabled={!submitted}>
                  Baixar DOCX
                </Button>
                <Button variant="outline-dark" onClick={handleDownloadPdf} disabled={!submitted}>
                  Baixar PDF
                </Button>
                <Button variant="outline-secondary" onClick={() => handleNavigate("painel")}>
                  Voltar para edicao
                </Button>
              </div>
            </div>
          </section>
        </>
      )}

      <AppFooter />

      <AuthModal
        show={showAuthModal}
        mode={authMode}
        form={authForm}
        errors={authErrors}
        feedback={authFeedback}
        onHide={closeAuthModal}
        onModeChange={handleAuthModeChange}
        onFieldChange={handleAuthFieldChange}
        onSubmit={handleAuthSubmit}
      />

      <Modal
        show={showResultModal}
        onHide={() => setShowResultModal(false)}
        centered
        dialogClassName="platform-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Envio concluido</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Sua defesa foi processada com sucesso. O texto esta disponivel na
          pagina de dashboard para revisao e exportacao.
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResultModal(false)}>
            Fechar
          </Button>

          <Button
            variant="dark"
            onClick={() => {
              setShowResultModal(false);
              handleNavigate("dashboard");
            }}
          >
            Ir para dashboard
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
