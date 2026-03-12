import React from "react";
import {
  Accordion,
  Badge,
  Button,
  Card,
  Col,
  Container,
  ProgressBar,
  Row,
} from "react-bootstrap";
import { CheckCircleFill, ClockHistory } from "react-bootstrap-icons";
import { dashboardCards } from "../data/mockData";

const faqItems = [
  {
    title: "A plataforma gera a peça do zero?",
    text: "Não. Ela edita uma peça base, aplica a tese e complementa argumentos conforme as regras do escritório.",
  },
  {
    title: "Posso manter revisão humana obrigatória?",
    text: "Sim. A validação final pode permanecer obrigatória antes da entrega ao cliente.",
  },
  {
    title: "Como funciona a integração com n8n?",
    text: "O frontend envia os dados para um webhook e o n8n executa a automação com rastreabilidade.",
  },
  {
    title: "Consigo adaptar para outras peças jurídicas?",
    text: "Sim. A estrutura permite criar variações por tipo de ação e reaproveitar os componentes principais.",
  },
];

export default function DashboardSection({
  automationStatus,
  checklist,
  previewParagraphs,
  submitted,
  reviewSent,
  onDownloadDoc,
  onDownloadPdf,
  onSendReview,
}) {
  const checklistItems = [
    { label: "Peça base anexada", done: checklist.pecaBase },
    { label: "Dados processuais conferidos", done: checklist.dadosProcessuais },
    { label: "Tese principal definida", done: checklist.tesePrincipal },
    { label: "Revisão humana habilitada", done: checklist.revisaoHumana },
  ];

  const canExport = submitted;

  return (
    <section id="dashboard" className="py-5">
      <Container>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <Badge className="section-badge mb-2">Painel executivo</Badge>
            <h2 className="fw-bold mb-1">Visão de produtividade do escritório</h2>
            <p className="text-secondary mb-0">
              Controle documentos, status e conformidade em um único lugar.
            </p>
          </div>

          <Button variant="dark">Novo caso</Button>
        </div>

        <Row className="g-4 mb-4">
          {dashboardCards.map((card) => (
            <Col md={6} lg={3} key={card.label}>
              <Card className="dashboard-card border-0 h-100">
                <Card.Body>
                  <div className="text-secondary small">{card.label}</div>
                  <div className="stat-value mt-1">{card.value}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Row className="g-4">
          <Col lg={7}>
            <Card className="dashboard-card border-0 h-100">
              <Card.Body className="p-4">
                <h3 className="h4 mb-3">Pré-visualização da contestação</h3>

                <Card className="preview-document border-0">
                  <Card.Body className="p-4" style={{ minHeight: 330 }}>
                    <div className="text-secondary mb-3 small d-flex align-items-center gap-2">
                      <ClockHistory />
                      TRECHO EDITADO PELO AGENTE
                    </div>

                    {previewParagraphs.map((text) => (
                      <p key={text} className="mb-3">
                        {text}
                      </p>
                    ))}
                  </Card.Body>
                </Card>

                <div className="d-flex flex-wrap gap-2 mt-3">
                  <Button variant="dark" onClick={onDownloadDoc} disabled={!canExport}>
                    Baixar DOCX
                  </Button>
                  <Button variant="outline-dark" onClick={onDownloadPdf} disabled={!canExport}>
                    Baixar PDF
                  </Button>
                  <Button
                    variant={reviewSent ? "success" : "outline-secondary"}
                    onClick={onSendReview}
                    disabled={!canExport}
                  >
                    {reviewSent ? "Revisão enviada" : "Enviar revisão"}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={5}>
            <div className="d-grid gap-4">
              <Card className="dashboard-card status-card border-0">
                <Card.Body className="p-4">
                  <h3 className="h5 mb-3">Status da automação</h3>

                  <div className="d-grid gap-3">
                    <div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Recepção do webhook</span>
                        <span>{automationStatus.webhook}%</span>
                      </div>
                      <ProgressBar now={automationStatus.webhook} />
                    </div>

                    <div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Processamento da IA</span>
                        <span>{automationStatus.ia}%</span>
                      </div>
                      <ProgressBar now={automationStatus.ia} />
                    </div>

                    <div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Validação de saída</span>
                        <span>{automationStatus.validacao}%</span>
                      </div>
                      <ProgressBar now={automationStatus.validacao} />
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card className="dashboard-card border-0">
                <Card.Body className="p-4">
                  <h3 className="h5 mb-3">Checklist de segurança</h3>

                  <ul className="mb-0 text-secondary checklist-list">
                    {checklistItems.map((item) => (
                      <li key={item.label} className={item.done ? "check-ok" : "check-pending"}>
                        <CheckCircleFill />
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>

        <div id="faq" className="mt-5">
          <Row className="justify-content-center">
            <Col lg={10}>
              <Card className="faq-card border-0">
                <Card.Body className="p-4 p-lg-5">
                  <div className="section-heading text-center mb-4">
                    <Badge className="section-badge mb-2">Perguntas e respostas</Badge>
                    <h3 className="fw-bold mb-1">FAQ</h3>
                  </div>

                  <Accordion flush className="faq-accordion">
                    {faqItems.map((item, index) => (
                      <Accordion.Item eventKey={String(index)} key={item.title}>
                        <Accordion.Header>{item.title}</Accordion.Header>
                        <Accordion.Body>{item.text}</Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </Container>
    </section>
  );
}
