/*
=========================================================
SETOR 1 — RODAPÉ
=========================================================
*/

import React from 'react'
import { Container } from 'react-bootstrap'

export default function AppFooter() {
  return (
    <footer className="py-4 bg-dark text-white-50">
      <Container className="d-flex flex-column flex-lg-row justify-content-between align-items-center gap-2">
        <div>
          <strong className="text-white">JurisFlow AI</strong> · Frontend React + Bootstrap
        </div>

        <div>Automação de contestação com agente de IA e n8n</div>
      </Container>
    </footer>
  )
}