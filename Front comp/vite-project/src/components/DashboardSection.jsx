import React from "react";
import { Button, Card, Col, Container, ProgressBar, Row } from "react-bootstrap";
import { dashboardCards } from "../data/mockData";

export default function DashboardSection() {
  return (
    <section id="dashboard" className="py-5">
      <Container>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1">Dashboard do advogado</h2>
            <p className="text-secondary mb-0">
              Acompanhe produtividade, casos recentes e status do agente.
            </p>
          </div>

          <Button variant="dark">Novo caso</Button>
        </div>

        {/* CARDS DE INDICADORES */}

        <Row className="g-4 mb-4">
          {dashboardCards.map((card) => (
            <Col md={6} lg={3} key={card.label}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body>
                  <div className="text-secondary small">{card.label}</div>
                  <div className="fs-2 fw-bold">{card.value}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Row className="g-4">
          <Col lg={7}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-4">
                <h3 className="h4 mb-3">Pré-visualização da contestação editada</h3>

                <Card className="preview-document border-0 rounded-4">
                  <Card.Body className="p-4" style={{ minHeight: 360 }}>
                    <div className="text-center text-secondary mb-4">
                      CONTESTAÇÃO — TRECHO EDITADO PELO AGENTE
                    </div>

                    <p className="mb-3">
                      A parte requerida apresenta contestação nos autos, arguindo preliminarmente a ausência
                      dos pressupostos necessários ao acolhimento do pedido inicial.
                    </p>

                    <p className="mb-3">
                      Após análise do contexto processual, o agente sugeriu complementação da fundamentação
                      com foco em inexistência de responsabilidade e reforço da tese principal.
                    </p>

                    <p className="mb-0">
                      O texto final permanece subordinado à revisão humana.
                    </p>
                  </Card.Body>
                </Card>

                <div className="d-flex flex-wrap gap-2 mt-3">
                  <Button variant="primary">Baixar DOCX</Button>
                  <Button variant="outline-secondary">Baixar PDF</Button>
                  <Button variant="outline-dark">Enviar para revisão</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* STATUS DA AUTOMAÇÃO */}

          <Col lg={5}>
            <div className="d-grid gap-4">
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">
                  <h3 className="h5 mb-3">Status da automação</h3>

                  <div className="d-grid gap-3">
                    <div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Recepção do webhook</span>
                        <span>100%</span>
                      </div>

                      <ProgressBar now={100} />
                    </div>

                    <div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Processamento do agente</span>
                        <span>84%</span>
                      </div>

                      <ProgressBar now={84} />
                    </div>

                    <div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Validação de saída</span>
                        <span>91%</span>
                      </div>

                      <ProgressBar now={91} />
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* CHECKLIST */}

              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">
                  <h3 className="h5 mb-3">Checklist antes do envio</h3>

                  <ul className="mb-0 text-secondary">
                    <li>Peça base anexada</li>
                    <li>Número do processo informado</li>
                    <li>Tese principal definida</li>
                    <li>Observações revisadas</li>
                    <li>Validação humana prevista</li>
                  </ul>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}