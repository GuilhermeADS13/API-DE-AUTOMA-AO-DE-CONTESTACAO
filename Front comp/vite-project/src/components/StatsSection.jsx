/*
=========================================================
SETOR 1 — MÉTRICAS RÁPIDAS
=========================================================
*/

import React from 'react'
import { Card, Col, Container, Row } from 'react-bootstrap'
import { stats } from '../data/mockData'

export default function StatsSection() {
  return (
    <section className="py-4">
      <Container>
        <Row className="g-3">
          {stats.map((item) => (
            <Col md={6} lg={3} key={item.label}>
              <Card className="border-0 shadow-sm rounded-4 h-100">
                <Card.Body>
                  <div className="text-secondary small mb-2">{item.label}</div>
                  <div className="fs-2 fw-bold">{item.value}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}