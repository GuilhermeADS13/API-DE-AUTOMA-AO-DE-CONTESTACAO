/*
=========================================================
SETOR 1 — IMPORTAÇÕES PRINCIPAIS
Esse arquivo monta a aplicação e controla os estados globais.
=========================================================
*/

import React, { useMemo, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'

import AppNavbar from './components/AppNavbar'
import HeroSection from './components/HeroSection'
import StatsSection from './components/StatsSection'
import MainPanelSection from './components/MainPanelSection'
import WorkflowN8nSection from './components/WorkflowN8nSection'
import DashboardSection from './components/DashboardSection'
import AppFooter from './components/AppFooter'

/*
=========================================================
SETOR 2 — COMPONENTE PRINCIPAL
Aqui ficam os estados e o controle do formulário.
=========================================================
*/

export default function App() {

  /*
  =========================================================
  SETOR 3 — ESTADOS DA INTERFACE
  =========================================================
  */

  const [showModal, setShowModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    processo: '',
    cliente: '',
    tipoAcao: '',
    tese: '',
    observacoes: '',
  })

  /*
  =========================================================
  SETOR 4 — CÁLCULO DO PROGRESSO DO FORMULÁRIO
  =========================================================
  */

  const completion = useMemo(() => {
    const fields = Object.values(form)
    const filled = fields.filter(Boolean).length
    return Math.round((filled / fields.length) * 100)
  }, [form])

  /*
  =========================================================
  SETOR 5 — ATUALIZAÇÃO DOS CAMPOS
  =========================================================
  */

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  /*
  =========================================================
  SETOR 6 — ENVIO DO FORMULÁRIO (SIMULADO)
  =========================================================
  */

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setSubmitted(false)

    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      setShowModal(true)
    }, 1200)
  }

  /*
  =========================================================
  SETOR 7 — LAYOUT DA APLICAÇÃO
  =========================================================
  */

  return (
    <div className="bg-light min-vh-100">

      <AppNavbar />

      <HeroSection />

      <StatsSection />

      <MainPanelSection
        form={form}
        completion={completion}
        submitted={submitted}
        loading={loading}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />

      <WorkflowN8nSection />

      <DashboardSection />

      <AppFooter />

      {/*
      =====================================================
      MODAL DE CONFIRMAÇÃO
      =====================================================
      */}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>

        <Modal.Header closeButton>
          <Modal.Title>Envio concluído</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          O caso foi encaminhado para o fluxo no n8n e está pronto para análise do agente de IA.
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fechar
          </Button>

          <Button variant="primary" onClick={() => setShowModal(false)}>
            Ver histórico
          </Button>
        </Modal.Footer>

      </Modal>

    </div>
  )
}