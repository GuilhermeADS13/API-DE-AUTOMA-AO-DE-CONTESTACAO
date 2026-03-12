import React, { useMemo, useState } from "react";
import { Button, Modal } from "react-bootstrap";

import AppNavbar from "./components/AppNavbar";
import HeroSection from "./components/HeroSection";
import StatsSection from "./components/StatsSection";
import MainPanelSection from "./components/MainPanelSection";
import DashboardSection from "./components/DashboardSection";
import AppFooter from "./components/AppFooter";
import { historyItems } from "./data/mockData";

const DRAFT_STORAGE_KEY = "jurisflow:draft:v2";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx"];

function normalizeFileName(value) {
  return (value || "contestacao")
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

export default function App() {
  const [draftSeed] = useState(readDraftFromStorage);

  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const [lastCaseId, setLastCaseId] = useState(null);

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

  const completion = useMemo(() => {
    const fields = [...Object.values(form), uploadedFile ? "arquivo" : ""];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [form, uploadedFile]);

  const checklist = useMemo(
    () => ({
      pecaBase: Boolean(uploadedFile),
      dadosProcessuais: Boolean(form.processo.trim() && form.cliente.trim()),
      tesePrincipal: Boolean(form.tese.trim() && form.tipoAcao.trim()),
      revisaoHumana: reviewSent || submitted,
    }),
    [uploadedFile, form, reviewSent, submitted],
  );

  const previewParagraphs = useMemo(() => {
    const cliente = form.cliente.trim() || "a parte requerida";
    const tipoAcao = form.tipoAcao.trim() || "a demanda em analise";
    const tese = form.tese.trim() || "a tese principal definida";
    const observacoes = form.observacoes.trim();

    return [
      `No caso de ${tipoAcao.toLowerCase()}, ${cliente} apresenta contestacao e destaca ausencia de pressupostos para procedencia do pedido inicial.`,
      `O agente recomenda reforco argumentativo com base em ${tese.toLowerCase()}, mantendo linguagem juridica formal e estrutura definida pelo escritorio.`,
      observacoes
        ? `Observacoes relevantes para a equipe: ${observacoes}`
        : "O documento segue para revisao humana antes da exportacao final.",
    ];
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
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
    if (!form.tipoAcao.trim()) errors.tipoAcao = "Selecione o tipo de acao.";
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

  const handleSubmit = (e) => {
    e.preventDefault();
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
    setReviewSent(false);
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
        tipo: "Contestacao em processamento",
      },
      ...prev,
    ]);

    window.setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setShowModal(true);
      setAutomationStatus({ webhook: 100, ia: 86, validacao: 92 });
      setHistory((prev) =>
        prev.map((item) =>
          item.id === nextCaseId
            ? { ...item, status: "Concluida", tipo: "Contestacao editada" }
            : item,
        ),
      );
      setFeedback({
        variant: "success",
        text: "Automacao concluida. Documento pronto para revisao.",
      });
    }, 1500);
  };

  const buildDocumentText = () => {
    const lines = [
      "CONTESTACAO - MINUTA GERADA PELO SISTEMA",
      "",
      `Processo: ${form.processo || "-"}`,
      `Cliente/Parte: ${form.cliente || "-"}`,
      `Tipo de acao: ${form.tipoAcao || "-"}`,
      `Tese principal: ${form.tese || "-"}`,
      `Arquivo base: ${uploadedFile ? uploadedFile.name : "-"}`,
      "",
      "TRECHO EDITADO PELO AGENTE",
      ...previewParagraphs,
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
    const baseName = normalizeFileName(form.processo || lastCaseId || "contestacao");
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
          <title>Contestacao ${form.processo || ""}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; line-height: 1.6; color: #222; }
            h1 { font-size: 18px; margin-bottom: 16px; }
            p { margin: 0 0 12px 0; }
          </style>
        </head>
        <body>
          <h1>Contestacao - Minuta</h1>
          ${previewParagraphs.map((text) => `<p>${text}</p>`).join("")}
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

  const handleSendReview = () => {
    if (!lastCaseId) {
      setFeedback({
        variant: "warning",
        text: "Nenhum caso enviado para revisao ainda.",
      });
      return;
    }

    setReviewSent(true);
    setHistory((prev) =>
      prev.map((item) =>
        item.id === lastCaseId ? { ...item, status: "Aguardando revisao" } : item,
      ),
    );
    setFeedback({
      variant: "info",
      text: "Documento encaminhado para revisao humana.",
    });
  };

  return (
    <div className="app-shell min-vh-100">
      <AppNavbar />

      <HeroSection />

      <StatsSection />

      <MainPanelSection
        form={form}
        completion={completion}
        submitted={submitted}
        loading={loading}
        history={history}
        formErrors={formErrors}
        uploadError={uploadError}
        uploadedFile={uploadedFile}
        draftInfo={draftInfo}
        feedback={feedback}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onFileSelect={handleFileSelect}
        onRemoveFile={handleRemoveFile}
        onSaveDraft={handleSaveDraft}
      />

      <DashboardSection
        automationStatus={automationStatus}
        checklist={checklist}
        previewParagraphs={previewParagraphs}
        submitted={submitted}
        reviewSent={reviewSent}
        onDownloadDoc={handleDownloadDoc}
        onDownloadPdf={handleDownloadPdf}
        onSendReview={handleSendReview}
      />

      <AppFooter />

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Envio concluido</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Seu caso foi processado com sucesso. A minuta foi atualizada e ja pode
          ser baixada ou enviada para revisao humana.
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fechar
          </Button>

          <Button variant="dark" onClick={() => setShowModal(false)}>
            Ver fila
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
