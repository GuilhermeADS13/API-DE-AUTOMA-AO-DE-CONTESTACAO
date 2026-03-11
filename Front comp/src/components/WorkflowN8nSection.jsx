import React from 'react'
import { Badge, Card, Col, Container, Row } from 'react-bootstrap'
import { pipelineCards } from '../data/mockData'

export default function WorkflowN8nSection() {
  return (
    <section id="fluxo" className="py-5 bg-white border-top border-bottom">
      <Container>
        <div className="text-center mb-5">
          <Badge bg="dark" className="mb-2">
            Fluxo automatizado
          </Badge>

          <h2 className="fw-bold">Visão do pipeline com n8n</h2>

          <p className="text-secondary mb-0">
            O n8n orquestra as etapas do sistema e integra o agente de IA ao backend e ao armazenamento.
          </p>
        </div>

        <Row className="g-4">
          {pipelineCards.map((item) => {
            const Icon = item.icon

            return (
              <Col md={6} lg={3} key={item.title}>
                <Card className="border-0 shadow-sm rounded-4 h-100 text-center">
                  <Card.Body className="p-4">
                    <div className="mb-3">
                      <Icon size={32} />
                    </div>

                    <h3 className="h5">{item.title}</h3>
                    <p className="text-secondary mb-0">{item.text}</p>
                  </Card.Body>
                </Card>
              </Col>
            )
          })}
        </Row>
      </Container>
    </section>
  )
}