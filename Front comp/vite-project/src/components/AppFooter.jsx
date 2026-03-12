import React from "react";
import { Container } from "react-bootstrap";

export default function AppFooter() {
  return (
    <footer className="app-footer py-4">
      <Container className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2">
        <div>
          <strong>JurisFlow AI</strong>
          <div className="small text-secondary">
            Automacao de contestacoes com IA e n8n
          </div>
        </div>

        <div className="small text-secondary">
          Frontend em React + Bootstrap | Fluxo pronto para escalar
        </div>
      </Container>
    </footer>
  );
}
