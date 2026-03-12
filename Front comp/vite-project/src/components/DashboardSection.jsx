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
import { ChatQuote, Stars } from "react-bootstrap-icons";
import { dashboardCards } from "../data/mockData";

const testimonials = [
  {
    quote:
      "Conseguimos reduzir gargalos de redacao e manter o padrao tecnico em todo o time.",
    name: "Camila P.",
    role: "Coordenadora juridica",
  },
  {
    quote:
      "A equipe passou a focar na estrategia processual enquanto o fluxo cuida da parte repetitiva.",
    name: "Rafael M.",
    role: "Advogado contencioso",
  },
  {
    quote:
      "A integracao com n8n deixou o processo previsivel e muito mais facil de auditar.",
    name: "Marina L.",
    role: "Gestora de operacoes",
  },
];

const faqItems = [
  {
    title: "A plataforma gera a peca do zero?",
    text: "Nao. Ela edita uma peca base, aplica tese e complementa argumentos conforme regras do escritorio.",
  },
  {
    title: "Posso manter revisao humana obrigatoria?",
    text: "Sim. O fluxo foi desenhado para sempre permitir validacao final antes da entrega ao cliente.",
  },
  {
    title: "Como funciona a integracao com n8n?",
    text: "O frontend envia os dados para um webhook e o pipeline do n8n aciona as etapas de classificacao, IA e saida.",
  },
  {
    title: "Consigo adaptar para outras pecas juridicas?",
    text: "Sim. A estrutura permite criar trilhas por tipo de acao e reaproveitar componentes do fluxo.",
  },
];

export default function DashboardSection() {
  return (
    <section id="dashboard" className="py-5">
      <Container>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <Badge className="section-badge mb-2">Painel executivo</Badge>
            <h2 className="fw-bold mb-1">Visao de produtividade do escritorio</h2>
            <p className="text-secondary mb-0">
              Controle pipeline, documentos e conformidade em um unico lugar.
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
                <h3 className="h4 mb-3">Pre-visualizacao da contestacao</h3>

                <Card className="preview-document border-0">
                  <Card.Body className="p-4" style={{ minHeight: 330 }}>
                    <div className="text-secondary mb-3 small">
                      TRECHO EDITADO PELO AGENTE
                    </div>

                    <p className="mb-3">
                      A parte requerida apresenta contestacao e destaca ausencia
                      de pressupostos para procedencia do pedido inicial.
                    </p>

                    <p className="mb-3">
                      O agente sugere reforco argumentativo com base na tese
                      principal, mantendo linguagem formal e estrutura definida.
                    </p>

                    <p className="mb-0">
                      O documento segue para revisao humana antes da exportacao.
                    </p>
                  </Card.Body>
                </Card>

                <div className="d-flex flex-wrap gap-2 mt-3">
                  <Button variant="dark">Baixar DOCX</Button>
                  <Button variant="outline-dark">Baixar PDF</Button>
                  <Button variant="outline-secondary">Enviar revisao</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={5}>
            <div className="d-grid gap-4">
              <Card className="dashboard-card status-card border-0">
                <Card.Body className="p-4">
                  <h3 className="h5 mb-3">Status da automacao</h3>

                  <div className="d-grid gap-3">
                    <div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Recepcao do webhook</span>
                        <span>100%</span>
                      </div>
                      <ProgressBar now={100} />
                    </div>

                    <div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Processamento da IA</span>
                        <span>86%</span>
                      </div>
                      <ProgressBar now={86} />
                    </div>

                    <div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Validacao de saida</span>
                        <span>92%</span>
                      </div>
                      <ProgressBar now={92} />
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card className="dashboard-card border-0">
                <Card.Body className="p-4">
                  <h3 className="h5 mb-3">Checklist de seguranca</h3>

                  <ul className="mb-0 text-secondary">
                    <li>Peca base anexada</li>
                    <li>Dados processuais conferidos</li>
                    <li>Tese principal definida</li>
                    <li>Revisao humana habilitada</li>
                  </ul>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>

        <div id="prova-social" className="mt-5">
          <div className="section-heading text-center mb-4">
            <Badge className="section-badge mb-2">Prova social</Badge>
            <h3 className="fw-bold mb-2">Quem usa recomenda</h3>
            <p className="text-secondary mb-0">
              Times juridicos reportam ganho real de velocidade e consistencia.
            </p>
          </div>

          <Row className="g-4">
            {testimonials.map((item) => (
              <Col md={6} lg={4} key={item.name}>
                <Card className="testimonial-card border-0 h-100">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-2 mb-3 text-warning">
                      <Stars />
                      <span className="small fw-semibold text-dark">Avaliacao positiva</span>
                    </div>

                    <blockquote>"{item.quote}"</blockquote>

                    <div className="mt-3 small text-secondary d-flex align-items-center gap-2">
                      <ChatQuote />
                      <span>
                        {item.name} - {item.role}
                      </span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

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
