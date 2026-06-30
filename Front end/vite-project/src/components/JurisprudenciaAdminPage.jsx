// PR23 - Pagina admin com 2 abas: Adicionar (PR22) + Listar/Editar/Excluir (PR23).
import React, { useState } from "react";
import { Badge, Card, Container, Tab, Tabs } from "react-bootstrap";
import JurisprudenciaForm from "./JurisprudenciaForm";
import JurisprudenciaListaTab from "./JurisprudenciaListaTab";

export default function JurisprudenciaAdminPage({ getAccessToken }) {
  const [aba, setAba] = useState("listar");

  return (
    <Container fluid className="py-4" style={{ maxWidth: 1100 }}>
      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex align-items-center gap-2 mb-3">
            <h4 className="mb-0">Jurisprudencia (RAG)</h4>
            <Badge bg="warning" text="dark">Admin</Badge>
          </div>
          <p className="text-muted mb-3">
            Gerencie acordaos paradigma que o RAG cita nas defesas. As entradas
            sao indexadas com embedding 384d (sentence-transformers) +
            full-text search PT-BR.
          </p>

          <Tabs
            activeKey={aba}
            onSelect={(k) => setAba(k)}
            className="mb-3"
          >
            <Tab eventKey="listar" title="Listar / Editar / Excluir">
              {aba === "listar" && (
                <JurisprudenciaListaTab getAccessToken={getAccessToken} />
              )}
            </Tab>
            <Tab eventKey="adicionar" title="Adicionar novo">
              {aba === "adicionar" && (
                <JurisprudenciaForm
                  getAccessToken={getAccessToken}
                  compact
                />
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
}
