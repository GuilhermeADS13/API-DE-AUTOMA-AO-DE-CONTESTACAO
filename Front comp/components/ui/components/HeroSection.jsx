/*
=========================================================
SETOR 1 — HERO SECTION
Essa página mostra a apresentação principal do sistema.
=========================================================
*/

import React from 'react';
import { Badge, Button, Card, Col, Container, Row } from 'react-bootstrap';
import { Cpu, ShieldCheck, Upload } from 'react-bootstrap-icons';

export default function HeroSection() {
  return (
    <section id="inicio" className="py-5 bg-white border-bottom">
      <Container>
        <Row className="align-items-center g-4">
          <Col lg={7}>
            <Badge bg="primary" className="mb-3">SaaS Jurídico com IA + n8n</Badge>

            <h1 className="display-5 fw-bold mb-3">
              Edite contestações com apoio de IA, sem perder o padrão jurídico do escritório.
            </h1>

            <p className="lead text-secondary mb-4">
              Plataforma para envio da peça base, análise do processo e edição assistida por agente de IA
              integrado ao n8n. O foco não é gerar a peça do zero, mas complementar e ajustar a
              fundamentação com segurança e controle.
            </p>

            <div className="d-flex flex-wrap gap-2">
              <Button variant="primary" size="lg" href="#painel">
                Testar fluxo
              </Button>
              <Button variant="outline-secondary" size="lg" href="#dashboard">
                Ver dashboard
              </Button>
            </div>
          </Col>

          {/*
          =====================================================
          SETOR 2 — CARD RESUMO DO SISTEMA
          =====================================================
          */}
          <Col lg={5}>
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-semibold">Resumo do sistema</span>
                  <Badge bg="success">Online</Badge>
                </div>

                <div className="d-grid gap-3">
                  <div className="p-3 bg-light rounded-3">
                    <div className="d-flex align-items-center gap-2 fw-semibold mb-1">
                      <Cpu /> Agente jurídico inteligente
                    </div>
                    <small className="text-secondary">
                      Classifica a ação, escolhe tese e sugere fundamentação.
                    </small>
                  </div>

                  <div className="p-3 bg-light rounded-3">
                    <div className="d-flex align-items-center gap-2 fw-semibold mb-1">
                      <Upload /> Entrada controlada
                    </div>
                    <small className="text-secondary">
                      Recebe dados do processo e usa uma peça base como referência.
                    </small>
                  </div>

                  <div className="p-3 bg-light rounded-3">
                    <div className="d-flex align-items-center gap-2 fw-semibold mb-1">
                      <ShieldCheck /> Segurança jurídica
                    </div>
                    <small className="text-secondary">
                      Preserva dados sensíveis e evita reescrita integral da peça.
                    </small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}