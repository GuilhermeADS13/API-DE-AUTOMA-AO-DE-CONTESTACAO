import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal } from "react-bootstrap";

import AppNavbar from "./components/AppNavbar";
import AuthModal from "./components/AuthModal";
import HeroSection from "./components/HeroSection";
import StatsSection from "./components/StatsSection";
import MainPanelSection from "./components/MainPanelSection";
import DashboardSection from "./components/DashboardSection";
import AppFooter from "./components/AppFooter";
import {
  AGENT_API_URL,
  AUTH_LOGIN_API_URL,
  AUTH_LOGOUT_API_URL,
  AUTH_SESSION_API_URL,
  AUTH_SIGNUP_API_URL,
} from "./config/api";
import { historyItems } from "./data/mockData";
import { generateCaseId } from "./utils/cases";
import { normalizeFileName, readFileAsBase64, validateFile } from "./utils/files";
import { escapeHtml } from "./utils/html";
import {
  clearSession,
  persistDraft,
  persistSession,
  readDraftFromStorage,
  readStoredSession,
} from "./utils/storage";
import {
  getApiErrorMessage,
  getPasswordChecks,
  isValidEmail,
  isValidNumeroProcesso,
  normalizeEmail,
  validateAuthField,
} from "./utils/validators";

function readValidSession() {
  const session = readStoredSession();
  if (!session?.email) return null;
  const normalizedEmail = normalizeEmail(session.email);
  if (!isValidEmail(normalizedEmail)) {
    clearSession();
    return null;
  }

  return {
    id: session.id || "",
    name: session.name || "Conta",
    email: normalizedEmail,
  };
}

export default function App() {
  // `draftSeed`: snapshot inicial do rascunho recuperado do navegador.
  const [draftSeed] = useState(readDraftFromStorage);
  // `currentPage`: controla navegacao entre Inicio, Painel e Dashboard.
  const [currentPage, setCurrentPage] = useState("inicio");

  // Estados de UI global (modais, loading e ultimo caso gerado).
  const [showResultModal, setShowResultModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastCaseId, setLastCaseId] = useState(null);
  // `authUser`: perfil autenticado em memoria + storage local seguro (sem token).
  const [authUser, setAuthUser] = useState(readValidSession);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authTouched, setAuthTouched] = useState({});
  const [authErrors, setAuthErrors] = useState({});
  const [authFeedback, setAuthFeedback] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [form, setForm] = useState(() => ({
    processo: "",
    cliente: "",
    tipoAcao: "",
    tese: "",
    observacoes: "",
    ...(draftSeed.form || {}),
  }));

  const [history, setHistory] = useState(() => [...historyItems]);
  // `uploadedFile`: arquivo base selecionado pelo usuario para envio ao backend.
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

  const authPasswordChecks = useMemo(
    () => getPasswordChecks(authForm.password),
    [authForm.password],
  );

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

  useEffect(() => {
    let isActive = true;

    const syncSession = async () => {
      try {
        const response = await fetch(AUTH_SESSION_API_URL, {
          method: "GET",
          credentials: "include",
        });

        if (!isActive) return;

        if (!response.ok) {
          if (response.status === 401) {
            clearSession();
            setAuthUser(null);
          }
          return;
        }

        const data = await response.json();
        const usuario = data?.usuario || {};
        const session = {
          id: usuario.id || "",
          name: usuario.nome || "Conta",
          email: normalizeEmail(usuario.email || ""),
        };
        if (!session.email) return;

        persistSession(session);
        setAuthUser(session);
      } catch {
        // Mantem sessao local quando backend nao estiver acessivel.
      }
    };

    syncSession();
    return () => {
      isActive = false;
    };
  }, []);

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
    setAuthTouched({});
    setAuthErrors({});
    setAuthFeedback(null);
    setAuthLoading(false);
    setAuthForm({
      name: "",
      email: "",
      password: "",
    });
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthTouched({});
    setAuthErrors({});
    setAuthFeedback(null);
    setAuthLoading(false);
  };

  const handleAuthModeChange = (mode) => {
    setAuthMode(mode);
    setAuthTouched({});
    setAuthErrors({});
    setAuthFeedback(null);
    setAuthLoading(false);
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
      if (!authTouched[name]) {
        delete next[name];
        return next;
      }

      const fieldError = validateAuthField(name, value, authMode);
      if (fieldError) {
        next[name] = fieldError;
      } else {
        delete next[name];
      }

      return next;
    });
  };

  const handleAuthFieldBlur = (event) => {
    const { name, value } = event.target;
    setAuthTouched((prev) => ({ ...prev, [name]: true }));
    setAuthErrors((prev) => {
      const next = { ...prev };
      const fieldError = validateAuthField(name, value, authMode);
      if (fieldError) {
        next[name] = fieldError;
      } else {
        delete next[name];
      }
      return next;
    });
  };

  const validateAuthForm = () => {
    const fields = authMode === "signup" ? ["name", "email", "password"] : ["email", "password"];
    return fields.reduce((accumulator, fieldName) => {
      const fieldError = validateAuthField(fieldName, authForm[fieldName], authMode);
      if (fieldError) {
        accumulator[fieldName] = fieldError;
      }
      return accumulator;
    }, {});
  };

  const handleAuthSubmit = async (event) => {
    // Faz cadastro/login e recebe cookie HTTPOnly de sessao via backend.
    event.preventDefault();
    if (authLoading) return;

    setAuthTouched(
      authMode === "signup"
        ? { name: true, email: true, password: true }
        : { email: true, password: true },
    );

    const errors = validateAuthForm();

    if (Object.keys(errors).length) {
      setAuthErrors(errors);
      setAuthFeedback({
        variant: "danger",
        text: "Revise os dados de acesso antes de continuar.",
      });
      return;
    }

    setAuthLoading(true);
    setAuthFeedback(null);

    try {
      if (authMode === "signup") {
        const response = await fetch(AUTH_SIGNUP_API_URL, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: authForm.name.trim(),
            email: normalizeEmail(authForm.email),
            password: authForm.password,
          }),
        });

        if (!response.ok) {
          const errorMessage = await getApiErrorMessage(
            response,
            "Nao foi possivel criar sua conta agora.",
          );

          if (response.status === 409) {
            setAuthErrors({ email: "Ja existe uma conta com este e-mail." });
          }

          setAuthFeedback({
            variant: "danger",
            text: errorMessage,
          });
          return;
        }

        const data = await response.json();
        const usuario = data?.usuario || {};
        const session = {
          id: usuario.id || "",
          name: usuario.nome || authForm.name.trim(),
          email: normalizeEmail(usuario.email || authForm.email),
        };

        persistSession(session);
        setAuthUser(session);
        setShowAuthModal(false);
        setFeedback({
          variant: "success",
          text: `Conta criada com sucesso. Bem-vindo ao workspace, ${session.name}.`,
        });
        return;
      }

      const response = await fetch(AUTH_LOGIN_API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizeEmail(authForm.email),
          password: authForm.password,
        }),
      });

      if (!response.ok) {
        const errorMessage = await getApiErrorMessage(
          response,
          "Nao encontramos uma conta com esse e-mail e senha.",
        );

        if (response.status === 401) {
          setAuthErrors({
            email: "Verifique o e-mail informado.",
            password: "Verifique a senha informada.",
          });
        }

        setAuthFeedback({
          variant: "danger",
          text: errorMessage,
        });
        return;
      }

      const data = await response.json();
      const usuario = data?.usuario || {};
      const session = {
        id: usuario.id || "",
        name: usuario.nome || "Conta",
        email: normalizeEmail(usuario.email || authForm.email),
      };

      persistSession(session);
      setAuthUser(session);
      setShowAuthModal(false);
      setFeedback({
        variant: "success",
        text: `Acesso liberado. Bem-vindo de volta, ${session.name}.`,
      });
    } catch {
      setAuthFeedback({
        variant: "danger",
        text: "Nao foi possivel conectar com o backend de autenticacao.",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    let remoteLogoutFailed = false;

    try {
      const response = await fetch(AUTH_LOGOUT_API_URL, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        remoteLogoutFailed = true;
      }
    } catch {
      remoteLogoutFailed = true;
    }

    clearSession();
    setAuthUser(null);
    setFeedback({
      variant: remoteLogoutFailed ? "warning" : "info",
      text: remoteLogoutFailed
        ? "Sessao local encerrada, mas nao foi possivel confirmar logout no servidor."
        : "Sessao encerrada com sucesso.",
    });
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
    if (form.processo.trim() && !isValidNumeroProcesso(form.processo)) {
      errors.processo = "Use o formato 0001234-56.2026.8.00.0000.";
    }
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
      persistDraft(payload);
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
    // Valida formulario, serializa arquivo em base64 e envia payload completo ao backend.
    event.preventDefault();

    if (!authUser) {
      setFeedback({
        variant: "warning",
        text: "Faca login para enviar casos ao backend.",
      });
      openAuthModal("login");
      return;
    }

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

    try {
      const arquivoConteudoBase64 = await readFileAsBase64(uploadedFile);
      const payload = {
        numero_processo: form.processo.trim(),
        autor: form.cliente.trim(),
        reu: "Nao informado",
        tipo_acao: form.tipoAcao.trim(),
        fatos: form.observacoes.trim(),
        pedido_autor: form.tese.trim(),
        arquivo_base: uploadedFile?.name || "",
        arquivo_base_nome: uploadedFile?.name || "",
        arquivo_base_mime_type: uploadedFile?.type || "application/octet-stream",
        arquivo_base_tamanho_bytes: uploadedFile?.size || 0,
        arquivo_base_conteudo_base64: arquivoConteudoBase64,
        texto_editado_ao_vivo: (liveDraft.trim() || generatedDraftText).trim(),
      };

      const response = await fetch(AGENT_API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorMessage = await getApiErrorMessage(
          response,
          `Falha HTTP ${response.status}.`,
        );

        if (response.status === 401) {
          clearSession();
          setAuthUser(null);
          openAuthModal("login");
        }
        throw new Error(errorMessage);
      }

      await response.json().catch(() => ({}));
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
    } catch (error) {
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
        text:
          error instanceof Error
            ? error.message
            : "Nao foi possivel enviar para o agente de IA. Verifique backend e autenticacao.",
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

    const safeProcesso = escapeHtml(form.processo || "");
    const safeDraft = escapeHtml(liveDraft.trim() || generatedDraftText).replace(/\n/g, "<br/>");
    const printable = `
      <html>
        <head>
          <title>Defesa ${safeProcesso}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; line-height: 1.6; color: #222; }
            h1 { font-size: 18px; margin-bottom: 16px; }
            p { margin: 0 0 12px 0; white-space: pre-line; }
          </style>
        </head>
        <body>
          <h1>Defesa - Minuta</h1>
          <p>${safeDraft}</p>
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
        loading={authLoading}
        passwordChecks={authPasswordChecks}
        onHide={closeAuthModal}
        onModeChange={handleAuthModeChange}
        onFieldChange={handleAuthFieldChange}
        onFieldBlur={handleAuthFieldBlur}
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
