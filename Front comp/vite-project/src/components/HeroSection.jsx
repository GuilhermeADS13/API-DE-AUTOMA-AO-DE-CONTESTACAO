import React from "react";
import { Badge, Button, Card, Col, Container, Row } from "react-bootstrap";
import {
  ArrowRight,
  ClockHistory,
  Cpu,
  FileEarmarkCheck,
  ShieldLock,
} from "react-bootstrap-icons";

export default function HeroSection() {
  return (
    <section id="inicio" className="hero-section py-5">
      <Container>
        <Row className="align-items-center g-4 g-lg-5">
          <Col lg={7} className="hero-copy">
            <Badge className="hero-kicker mb-3">Plataforma de IA para advocacia</Badge>

            <h1 className="hero-title mb-3">
              Um dia de trabalho jurídico, resolvido em menos de um minuto.
            </h1>

            <p className="hero-lead mb-4">
              O agente jurídico analisa o caso, identifica a tese principal,
              aprimora a fundamentação e entrega a minuta pronta para revisão
              humana com padrão técnico do seu escritório.
            </p>

            <div className="d-flex flex-wrap gap-2 mb-4">
              <Button variant="dark" size="lg" href="#painel">
                Quero testar agora
              </Button>

              <Button variant="outline-dark" size="lg" href="#dashboard">
                Ver painel
              </Button>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <span className="trust-pill">IA treinada no direito brasileiro</span>
              <span className="trust-pill">Processo padronizado por escritório</span>
              <span className="trust-pill">Revisão final sempre humana</span>
            </div>
          </Col>

          <Col lg={5}>
            <Card className="hero-console border-0">
              <Card.Body className="p-4 p-lg-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <small className="text-secondary d-block">Painel ao vivo</small>
                    <h2 className="h5 mb-0">Fluxo inteligente de contestacao</h2>
                  </div>
                  <span className="live-chip">ativo</span>
                </div>

                <div className="d-grid gap-2">
                  <div className="feature-row">
                    <ClockHistory />
                    <div>
                      <div className="fw-semibold">Tempo médio por caso</div>
                      <small className="text-secondary">De horas para minutos</small>
                    </div>
                  </div>

                  <div className="feature-row">
                    <Cpu />
                    <div>
                      <div className="fw-semibold">Agente jurídico especializado</div>
                      <small className="text-secondary">
                        Classifica ação, tese e argumentos
                      </small>
                    </div>
                  </div>

                  <div className="feature-row">
                    <ShieldLock />
                    <div>
                      <div className="fw-semibold">Camada de segurança</div>
                      <small className="text-secondary">
                        Regras para evitar saída inconsistente
                      </small>
                    </div>
                  </div>

                  <div className="feature-row">
                    <FileEarmarkCheck />
                    <div>
                      <div className="fw-semibold">Entrega pronta para revisão</div>
                      <small className="text-secondary">DOCX e PDF com histórico</small>
                    </div>
                  </div>
                </div>

                <div className="console-footer mt-3 pt-3">
                  <span>Webhook conectado e monitorado</span>
                  <ArrowRight />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
