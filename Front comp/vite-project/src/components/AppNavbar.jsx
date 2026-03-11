import React from "react";
import { Button, Container, Nav, Navbar } from "react-bootstrap";
import { FileEarmarkText, PersonCircle } from "react-bootstrap-icons";

export default function AppNavbar() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand href="#inicio" className="fw-bold d-flex align-items-center gap-2">
          <FileEarmarkText size={20} />
          JurisFlow AI
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />

        <Navbar.Collapse id="main-navbar">
          <Nav className="ms-auto align-items-lg-center gap-lg-2">
            <Nav.Link href="#inicio">Início</Nav.Link>
            <Nav.Link href="#painel">Painel</Nav.Link>
            <Nav.Link href="#fluxo">Fluxo n8n</Nav.Link>
            <Nav.Link href="#dashboard">Dashboard</Nav.Link>

            <Button variant="outline-light" size="sm" className="ms-lg-2">
              <PersonCircle className="me-2" />
              Entrar
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}