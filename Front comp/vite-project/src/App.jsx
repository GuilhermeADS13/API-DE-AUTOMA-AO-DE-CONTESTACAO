import React, { useMemo, useState } from "react";
import { Button, Modal } from "react-bootstrap";

import AppNavbar from "./components/AppNavbar";
import HeroSection from "./components/HeroSection";
import StatsSection from "./components/StatsSection";
import MainPanelSection from "./components/MainPanelSection";
import WorkflowN8nSection from "./components/WorkflowN8nSection";
import DashboardSection from "./components/DashboardSection";
import AppFooter from "./components/AppFooter";

export default function App() {
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    processo: "",
    cliente: "",
    tipoAcao: "",
    tese: "",
    observacoes: "",
  });

  const completion = useMemo(() => {
    const fields = Object.values(form);
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitted(false);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setShowModal(true);
    }, 1200);
  };

  return (
    <div className="app-shell min-vh-100">
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Envio concluido</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Seu caso foi enviado para o fluxo no n8n e ja esta pronto para analise
          do agente juridico.
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fechar
          </Button>

          <Button variant="dark" onClick={() => setShowModal(false)}>
            Ver fila
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
