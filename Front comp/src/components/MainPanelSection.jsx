/*
=========================================================
SETOR 1 — PAINEL PRINCIPAL
Formulário, regras do agente e histórico.
=========================================================
*/

import React from 'react'
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
} from 'react-bootstrap'
import { CheckCircle, ClockHistory, Upload } from 'react-bootstrap-icons'
import { agentRules, flowSteps, historyItems } from '../data/mockData'
import StatusBadge from './ui/StatusBadge'

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
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body className="p-4 p-lg-5">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h2 className="h3 mb-1">Painel de edição da contestação</h2>
                      <p className="text-secondary mb-0">
                        Envie os dados essenciais para o fluxo automatizado no n8n.
                      </p>
                    </div>

                    <Badge bg="info">
                      Etapa {completion > 0 ? 'em andamento' : 'inicial'}
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
                      <CheckCircle /> Caso enviado com sucesso para análise do agente.
                    </Alert>
                  )}

                  <Form onSubmit={onSubmit}>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Número do processo</Form.Label>
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
                          <Form.Label>Cliente / Parte</Form.Label>
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
                          <Form.Label>Tipo de ação</Form.Label>
                          <Form.Select
                            name="tipoAcao"
                            value={form.tipoAcao}
                            onChange={onChange}
                          >
                            <option value="">Selecione</option>
                            <option>Ação de cobrança</option>
                            <option>Relação de consumo</option>
                            <option>Responsabilidade civil</option>
                            <option>Execução</option>
                            <option>Obrigações contratuais</option>
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
                            placeholder="Ex.: ausência de responsabilidade"
                          />
                        </Form.Group>
                      </Col>

                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Observações para o agente</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={5}
                            name="observacoes"
                            value={form.observacoes}
                            onChange={onChange}
                            placeholder="Informe contexto do caso, limites de edição e observações relevantes."
                          />
                        </Form.Group>
                      </Col>

                      <Col xs={12}>
                        <Card className="bg-light border-0 rounded-4">
                          <Card.Body>
                            <div className="fw-semibold mb-2">Upload da peça base</div>

                            <div className="upload-box">
                              <Upload size={28} className="mb-2 text-secondary" />
                              <div className="fw-medium">Arraste o arquivo ou clique para anexar</div>
                              <div className="small text-secondary">Formatos aceitos: DOCX, PDF</div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    <div className="d-flex flex-wrap gap-2 mt-4">
                      <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Processando...' : 'Enviar para o agente'}
                      </Button>

                      <Button type="button" variant="outline-secondary">
                        Salvar rascunho
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={5}>
              <div className="d-grid gap-4">
                <Card className="border-0 shadow-sm rounded-4">
                  <Card.Body className="p-4">
                    <h3 className="h5 mb-3">Regras do agente</h3>

                    <ul className="mb-0 text-secondary">
                      {agentRules.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm rounded-4">
                  <Card.Body className="p-4">
                    <h3 className="h5 mb-3">Etapas do fluxo</h3>

                    <div className="d-grid gap-3">
                      {flowSteps.map((step, index) => (
                        <div className="d-flex align-items-center gap-3" key={step}>
                          <div
                            className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center"
                            style={{ width: 32, height: 32, minWidth: 32 }}
                          >
                            {index + 1}
                          </div>
                          <div>{step}</div>
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

      <section className="py-5">
        <Container>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h2 className="h4 mb-1">Histórico de documentos</h2>
                  <p className="text-secondary mb-0">
                    Acompanhe peças editadas e revisões em andamento.
                  </p>
                </div>

                <ClockHistory size={22} />
              </div>

              <div className="table-responsive">
                <Table hover align="middle" className="mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Área</th>
                      <th>Tipo</th>
                      <th>Data</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {historyItems.map((item) => (
                      <tr key={item.id}>
                        <td className="fw-semibold">{item.id}</td>
                        <td>{item.cliente}</td>
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
  )
}