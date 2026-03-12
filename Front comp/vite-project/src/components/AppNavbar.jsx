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
            <span className="brand-sub d-block">Automação Jurídica para Defesas</span>
          </span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />

        <Navbar.Collapse id="main-navbar">
          <Nav className="ms-auto align-items-lg-center gap-lg-3">
            <Nav.Link href="#inicio">Início</Nav.Link>
            <Nav.Link href="#painel">Painel</Nav.Link>
            <Nav.Link href="#dashboard">Dashboard</Nav.Link>
            <Nav.Link href="#faq">FAQ</Nav.Link>

            <Button variant="dark" size="sm" className="nav-cta ms-lg-2">
              Iniciar teste
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
