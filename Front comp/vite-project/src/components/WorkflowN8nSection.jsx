import React from "react";
import { Badge, Card, Col, Container, Row } from "react-bootstrap";
import { pipelineCards } from "../data/mockData";

export default function WorkflowN8nSection() {
  return (
    <section id="fluxo" className="workflow-section py-5">
      <Container>
        <div className="section-heading text-center mb-5">
          <Badge className="section-badge mb-2">Orquestracao com n8n</Badge>

          <h2 className="fw-bold mb-2">Do envio da peca ate o documento final</h2>

          <p className="text-secondary mb-0">
            Um pipeline unico conecta dados do processo, IA juridica e revisao
            humana sem perder rastreabilidade.
          </p>
        </div>

        <Row className="g-4">
          {pipelineCards.map((item, index) => {
            const Icon = item.icon;

            return (
              <Col md={6} lg={3} key={item.title}>
                <Card className="workflow-card border-0 h-100">
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="workflow-index">0{index + 1}</span>
                      <Icon size={24} />
                    </div>

                    <h3 className="h5 mb-2">{item.title}</h3>
                    <p className="text-secondary mb-0">{item.text}</p>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </section>
  );
}
