// PR23 - Floating Action Button "Adicionar Jurisprudencia" disponivel em
// qualquer pagina (so pra admin). Pensado pra crescer base organica:
// quando o advogado encontra um acordao util enquanto le uma peca ou
// faz pesquisa no Migalhas, clica no FAB e cadastra em segundos.
import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { Plus } from "react-bootstrap-icons";
import JurisprudenciaForm from "./JurisprudenciaForm";

const FAB_STYLE = {
  position: "fixed",
  bottom: 24,
  right: 24,
  width: 56,
  height: 56,
  borderRadius: "50%",
  fontSize: 24,
  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  zIndex: 1040,
  padding: 0,
};

export default function JurisprudenciaQuickAddFab({ getAccessToken, visible = true }) {
  const [aberto, setAberto] = useState(false);

  if (!visible) return null;

  return (
    <>
      <Button
        variant="warning"
        style={FAB_STYLE}
        onClick={() => setAberto(true)}
        title="Adicionar jurisprudencia ao acervo (admin)"
        aria-label="Quick-add jurisprudencia"
      >
        <Plus />
      </Button>

      <Modal
        show={aberto}
        onHide={() => setAberto(false)}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Adicionar Jurisprudencia</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <JurisprudenciaForm
            getAccessToken={getAccessToken}
            compact
            onSaved={() => {
              // Mantem modal aberto pra cadastrar varios em sequencia.
              // Se quiser fechar, mudar pra: setAberto(false);
            }}
          />
        </Modal.Body>
      </Modal>
    </>
  );
}
