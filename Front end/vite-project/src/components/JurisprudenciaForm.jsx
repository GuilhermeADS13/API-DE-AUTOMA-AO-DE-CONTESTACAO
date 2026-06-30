// PR22 - Formulario admin pra cadastrar jurisprudencia paradigma manualmente
// (sem scraping). Backend valida `_is_admin()` em /api/admin/jurisprudencia/criar.
// Frontend so esconde menu por UX; a autoridade real e backend.
import React, { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";
import { JURISPRUDENCIA_CRIAR_URL, jurisprudenciaIdUrl } from "../config/api";

const TRIBUNAIS = [
  "STF",
  "STJ",
  "TST",
  "TJ-PE",
  "TJ-SP",
  "TJ-RJ",
  "TJ-MG",
  "TJ-RS",
  "TRT-6",
  "TRT-1",
  "TRT-2",
  "TRT-3",
];

const TIPOS_DECISAO = [
  "Acordao",
  "Sumula",
  "Sumula Vinculante",
  "Repercussao Geral",
  "Repetitivo",
  "IRR",
  "OJ-SDI",
  "OJ-Tribunal Pleno",
];

const AREAS = [
  "trabalhista",
  "civel",
  "consumidor",
  "bancario",
  "previdenciario",
];

const ESTADO_INICIAL = {
  tribunal: "TST",
  tipo_decisao: "Acordao",
  numero_processo: "",
  relator: "",
  data_julgamento: "",
  ementa: "",
  tese_firmada: "",
  area_juridica: "trabalhista",
  peso_relevancia: 5,
  fonte_url: "",
};

function validar(form) {
  const erros = {};
  if (!form.tribunal?.trim()) erros.tribunal = "Selecione um tribunal";
  if (!form.numero_processo?.trim()) {
    erros.numero_processo = "Numero do processo e obrigatorio";
  }
  if (!form.ementa || form.ementa.trim().length < 20) {
    erros.ementa = "Ementa deve ter pelo menos 20 caracteres";
  }
  if (form.data_julgamento && !/^\d{4}-\d{2}-\d{2}$/.test(form.data_julgamento)) {
    erros.data_julgamento = "Use formato YYYY-MM-DD (ou deixe vazio)";
  }
  if (
    form.peso_relevancia &&
    (form.peso_relevancia < 1 || form.peso_relevancia > 10)
  ) {
    erros.peso_relevancia = "Peso deve estar entre 1 e 10";
  }
  return erros;
}

/**
 * Form admin de jurisprudencia (PR22 cadastrar + PR23 editar).
 *
 * Props:
 *  - getAccessToken: () => Promise<string|null> — extrai JWT da sessao Supabase.
 *  - editingItem?: object — se passado, modo edicao (PATCH em vez de POST).
 *    Espera shape: {id, tribunal, numero_processo, ementa, ...} igual ao backend.
 *  - onSaved?: (resultadoBackend) => void — callback apos sucesso, util pra
 *    lista de pais atualizar sem fetch extra.
 *  - compact?: boolean — versao mais densa (uso em modal, sem Card wrapper).
 */
export default function JurisprudenciaForm({
  getAccessToken,
  editingItem = null,
  onSaved,
  compact = false,
}) {
  const isEditMode = Boolean(editingItem?.id);
  const [form, setForm] = useState(() => {
    if (!editingItem) return ESTADO_INICIAL;
    return {
      tribunal: editingItem.tribunal || "TST",
      tipo_decisao: editingItem.tipo_decisao || "Acordao",
      numero_processo: editingItem.numero_processo || "",
      relator: editingItem.relator || "",
      data_julgamento: editingItem.data_julgamento || "",
      ementa: editingItem.ementa || "",
      tese_firmada: editingItem.tese_firmada || "",
      area_juridica: editingItem.area_juridica || "trabalhista",
      peso_relevancia: editingItem.peso_relevancia ?? 5,
      fonte_url: editingItem.fonte_url || "",
    };
  });
  const [erros, setErros] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (campo) => (e) => {
    const valor = e.target.type === "number"
      ? Number(e.target.value)
      : e.target.value;
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (erros[campo]) {
      setErros((prev) => {
        const next = { ...prev };
        delete next[campo];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errosValidacao = validar(form);
    if (Object.keys(errosValidacao).length > 0) {
      setErros(errosValidacao);
      setFeedback({
        variant: "danger",
        text: "Corrija os campos destacados antes de salvar.",
      });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setFeedback({
          variant: "danger",
          text: "Sessao expirada. Faca login novamente.",
        });
        setLoading(false);
        return;
      }

      // Normaliza payload: strings vazias viram null em campos opcionais
      const payload = {
        tribunal: form.tribunal,
        tipo_decisao: form.tipo_decisao,
        numero_processo: form.numero_processo.trim(),
        ementa: form.ementa.trim(),
        peso_relevancia: Number(form.peso_relevancia) || 5,
      };
      if (form.relator?.trim()) payload.relator = form.relator.trim();
      if (form.data_julgamento) payload.data_julgamento = form.data_julgamento;
      if (form.tese_firmada?.trim()) payload.tese_firmada = form.tese_firmada.trim();
      if (form.area_juridica) payload.area_juridica = form.area_juridica;
      if (form.fonte_url?.trim()) payload.fonte_url = form.fonte_url.trim();

      const url = isEditMode
        ? jurisprudenciaIdUrl(editingItem.id)
        : JURISPRUDENCIA_CRIAR_URL;
      const resp = await fetch(url, {
        method: isEditMode ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (resp.status === 403) {
        setFeedback({
          variant: "danger",
          text: "Acesso negado: seu email nao esta na lista ADMIN_EMAILS do backend.",
        });
      } else if (resp.status === 422) {
        const data = await resp.json().catch(() => ({}));
        setFeedback({
          variant: "danger",
          text: `Payload invalido: ${JSON.stringify(data.detail || data).slice(0, 200)}`,
        });
      } else if (!resp.ok) {
        const txt = await resp.text();
        setFeedback({
          variant: "danger",
          text: `Erro ${resp.status}: ${txt.slice(0, 200)}`,
        });
      } else {
        const data = await resp.json();
        setFeedback({
          variant: "success",
          text:
            data.mensagem
            || `${payload.tribunal} ${payload.numero_processo} salvo com sucesso.`,
        });
        if (!isEditMode) {
          setForm(ESTADO_INICIAL);
        }
        if (typeof onSaved === "function") {
          onSaved(data);
        }
      }
    } catch (err) {
      setFeedback({
        variant: "danger",
        text: `Falha de rede: ${err.message || err}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const corpo = (
    <>
      {!compact && (
        <>
          <div className="d-flex align-items-center gap-2 mb-3">
            <h4 className="mb-0">
              {isEditMode ? "Editar Jurisprudencia" : "Adicionar Jurisprudencia"}
            </h4>
            <Badge bg="warning" text="dark">Admin</Badge>
            {isEditMode && (
              <Badge bg="info">id={editingItem.id}</Badge>
            )}
          </div>
          <p className="text-muted">
            {isEditMode
              ? "Edite os campos abaixo. Embedding sera regenerado automaticamente."
              : "Cadastre acordaos paradigma que o RAG vai citar nas defesas. A ementa entra completa, com embedding gerado automaticamente. Idempotente: re-submeter mesmo (tribunal, numero) atualiza o registro existente."}
          </p>
        </>
      )}

          {feedback && (
            <Alert
              variant={feedback.variant}
              onClose={() => setFeedback(null)}
              dismissible
            >
              {feedback.text}
            </Alert>
          )}

          <Form onSubmit={handleSubmit} noValidate>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Tribunal *</Form.Label>
                  <Form.Select
                    value={form.tribunal}
                    onChange={handleChange("tribunal")}
                    isInvalid={!!erros.tribunal}
                  >
                    {TRIBUNAIS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {erros.tribunal}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Tipo de Decisao</Form.Label>
                  <Form.Select
                    value={form.tipo_decisao}
                    onChange={handleChange("tipo_decisao")}
                  >
                    {TIPOS_DECISAO.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Peso Relevancia (1-10)</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    max={10}
                    value={form.peso_relevancia}
                    onChange={handleChange("peso_relevancia")}
                    isInvalid={!!erros.peso_relevancia}
                  />
                  <Form.Control.Feedback type="invalid">
                    {erros.peso_relevancia}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Sumula/IRR: 8-10; Acordao comum: 5-7
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={8}>
                <Form.Group>
                  <Form.Label>Numero do Processo *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ex: REsp 1.234.567/SP, Sumula 437 TST, AgInt 9999/MG"
                    value={form.numero_processo}
                    onChange={handleChange("numero_processo")}
                    isInvalid={!!erros.numero_processo}
                  />
                  <Form.Control.Feedback type="invalid">
                    {erros.numero_processo}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Data Julgamento</Form.Label>
                  <Form.Control
                    type="date"
                    value={form.data_julgamento}
                    onChange={handleChange("data_julgamento")}
                    isInvalid={!!erros.data_julgamento}
                  />
                  <Form.Control.Feedback type="invalid">
                    {erros.data_julgamento}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={8}>
                <Form.Group>
                  <Form.Label>Relator</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ex: Min. Mauricio Godinho Delgado"
                    value={form.relator}
                    onChange={handleChange("relator")}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Area Juridica</Form.Label>
                  <Form.Select
                    value={form.area_juridica}
                    onChange={handleChange("area_juridica")}
                  >
                    {AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Ementa * (texto integral do paradigma)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={8}
                    placeholder="Cole a ementa oficial completa..."
                    value={form.ementa}
                    onChange={handleChange("ementa")}
                    isInvalid={!!erros.ementa}
                  />
                  <Form.Control.Feedback type="invalid">
                    {erros.ementa}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Minimo 20 caracteres. Quanto mais completa, melhor o RAG cita.
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col xs={12}>
                <Form.Group>
                  <Form.Label>Tese Firmada (resumo 1 frase, opcional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Ex: Intervalo intrajornada suprimido implica pagamento integral + 50%, natureza salarial."
                    value={form.tese_firmada}
                    onChange={handleChange("tese_firmada")}
                  />
                  <Form.Text className="text-muted">
                    Usada como destaque no prompt do Gerador. Deixe vazia se a
                    ementa ja for sucinta.
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col xs={12}>
                <Form.Group>
                  <Form.Label>URL da Fonte Oficial</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://www3.tst.jus.br/jurisprudencia/Sumulas..."
                    value={form.fonte_url}
                    onChange={handleChange("fonte_url")}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end mt-4 gap-2">
              <Button
                variant="outline-secondary"
                type="button"
                onClick={() => {
                  setForm(ESTADO_INICIAL);
                  setErros({});
                  setFeedback(null);
                }}
                disabled={loading}
              >
                Limpar
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" />
                    Salvando...
                  </>
                ) : (
                  isEditMode ? "Salvar alteracoes" : "Salvar paradigma"
                )}
              </Button>
            </div>
          </Form>
    </>
  );

  if (compact) {
    return <div>{corpo}</div>;
  }

  return (
    <Container fluid className="py-4" style={{ maxWidth: 960 }}>
      <Card className="shadow-sm">
        <Card.Body>{corpo}</Card.Body>
      </Card>
    </Container>
  );
}
