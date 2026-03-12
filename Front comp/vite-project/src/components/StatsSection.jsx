import React from "react";
import { Card, Col, Container, Row } from "react-bootstrap";
import { stats } from "../data/mockData";

export default function StatsSection() {
  return (
    <section className="stats-band pb-4">
      <Container>
        <Row className="g-3">
          {stats.map((item) => (
            <Col md={6} lg={3} key={item.label}>
              <Card className="stat-card border-0 h-100">
                <Card.Body className="p-4">
                  <div className="stat-label">{item.label}</div>
                  <div className="stat-value">{item.value}</div>
                  {item.detail && <p className="small mb-0 text-secondary">{item.detail}</p>}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}
