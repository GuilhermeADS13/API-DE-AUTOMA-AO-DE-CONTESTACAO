import React from "react";
import { Button, Container, Nav, Navbar } from "react-bootstrap";

export default function AppNavbar() {
  return (
    <Navbar expand="lg" className="app-navbar sticky-top">
      <Container>
        <Navbar.Brand href="#inicio" className="d-flex align-items-center gap-2">
          <span className="brand-mark">JF</span>
          <span>
            <span className="brand-name d-block">JurisFlow AI</span>
            <span className="brand-sub d-block">Automacao juridica inteligente</span>
          </span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />

        <Navbar.Collapse id="main-navbar">
          <Nav className="ms-auto align-items-lg-center gap-lg-3">
            <Nav.Link href="#inicio">Inicio</Nav.Link>
            <Nav.Link href="#fluxo">Como funciona</Nav.Link>
            <Nav.Link href="#prova-social">Resultados</Nav.Link>
            <Nav.Link href="#faq">FAQ</Nav.Link>

            <Button variant="dark" size="sm" className="nav-cta ms-lg-2">
              Teste gratuito
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
