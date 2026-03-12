import React from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  ProgressBar,
  Row,
  Table,
} from "react-bootstrap";
import { CheckCircle, ClockHistory, Upload } from "react-bootstrap-icons";
import { agentRules, flowSteps, historyItems } from "../data/mockData";
import StatusBadge from "./ui/StatusBadge";

export default function MainPanelSection({
  form,
  completion,
  submitted,
  loading,
  onChange,
  onSubmit,
}) {
  return (
    <>
      <section id="painel" className="py-5">
        <Container>
          <Row className="g-4">
            <Col lg={7}>
              <Card className="panel-card border-0 h-100">
                <Card.Body className="p-4 p-lg-5">
                  <div className="d-flex justify-content-between align-items-center mb-3 gap-3 flex-wrap">
                    <div>
                      <h2 className="h3 mb-1">Envie sua peca e execute o fluxo</h2>
                      <p className="text-secondary mb-0">
                        Configure o caso e envie para processamento assistido.
                      </p>
                    </div>

                    <Badge className="panel-badge">
                      {completion > 0 ? "Fluxo em andamento" : "Pronto para iniciar"}
                    </Badge>
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between small text-secondary mb-2">
                      <span>Preenchimento do caso</span>
                      <span>{completion}%</span>
                    </div>
                    <ProgressBar now={completion} />
                  </div>

                  {submitted && (
                    <Alert variant="success" className="d-flex align-items-center gap-2">
                      <CheckCircle /> Caso enviado com sucesso para o agente juridico.
                    </Alert>
                  )}

                  <Form onSubmit={onSubmit}>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Numero do processo</Form.Label>
                          <Form.Control
                            name="processo"
                            value={form.processo}
                            onChange={onChange}
                            placeholder="0001234-56.2026.8.00.0000"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Cliente ou parte</Form.Label>
                          <Form.Control
                            name="cliente"
                            value={form.cliente}
                            onChange={onChange}
                            placeholder="Nome da parte"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Tipo de acao</Form.Label>
                          <Form.Select name="tipoAcao" value={form.tipoAcao} onChange={onChange}>
                            <option value="">Selecione</option>
                            <option>Acao de cobranca</option>
                            <option>Relacao de consumo</option>
                            <option>Responsabilidade civil</option>
                            <option>Execucao</option>
                            <option>Obrigacoes contratuais</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Tese principal</Form.Label>
                          <Form.Control
                            name="tese"
                            value={form.tese}
                            onChange={onChange}
                            placeholder="Ex.: ausencia de responsabilidade"
                          />
                        </Form.Group>
                      </Col>

                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Observacoes para o agente</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            name="observacoes"
                            value={form.observacoes}
                            onChange={onChange}
                            placeholder="Contexto do caso, limites da edicao e pontos de atencao."
                          />
                        </Form.Group>
                      </Col>

                      <Col xs={12}>
                        <div className="upload-box">
                          <Upload size={28} className="mb-2" />
                          <div className="fw-semibold">Upload da peca base</div>
                          <small className="text-secondary">
                            Arraste ou clique para anexar DOCX/PDF.
                          </small>
                        </div>
                      </Col>
                    </Row>

                    <div className="d-flex flex-wrap gap-2 mt-4">
                      <Button type="submit" variant="dark" disabled={loading}>
                        {loading ? "Processando..." : "Enviar para automacao"}
                      </Button>

                      <Button type="button" variant="outline-dark">
                        Salvar rascunho
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={5}>
              <div className="d-grid gap-4 h-100">
                <Card className="side-info-card border-0">
                  <Card.Body className="p-4">
                    <h3 className="h5 mb-3">Regras da IA juridica</h3>
                    <ul className="mb-0 text-secondary">
                      {agentRules.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>

                <Card className="side-info-card border-0">
                  <Card.Body className="p-4">
                    <h3 className="h5 mb-3">Fluxo de execucao</h3>

                    <div className="d-grid gap-3">
                      {flowSteps.map((step, index) => (
                        <div className="flow-row" key={step}>
                          <span className="step-index">{index + 1}</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="pb-5">
        <Container>
          <Card className="history-card border-0">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h2 className="h4 mb-1">Historico de documentos</h2>
                      <p className="text-secondary mb-0">
                        Visao rapida dos casos recentes e seus status de revisao.
                      </p>
                    </div>

                <ClockHistory size={20} />
              </div>

              <div className="table-responsive">
                <Table hover align="middle" className="mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Natureza do caso</th>
                      <th>Tipo</th>
                      <th>Data</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {historyItems.map((item) => (
                      <tr key={item.id}>
                        <td className="fw-semibold">{item.id}</td>
                        <td>{item.naturezaCaso}</td>
                        <td>{item.tipo}</td>
                        <td>{item.data}</td>
                        <td>
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </section>
    </>
  );
}
