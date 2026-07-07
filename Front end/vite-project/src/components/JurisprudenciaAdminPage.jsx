// PR23 - Pagina admin com 2 abas: Adicionar (PR22) + Listar/Editar/Excluir (PR23).
// PR30 - Contraste + polish no tema Legal Noir (classe .jur-admin no styles.css).
import React, { useState } from "react";
import { Badge, Card, Container, Tab, Tabs } from "react-bootstrap";
import { Bank } from "react-bootstrap-icons";
import JurisprudenciaForm from "./JurisprudenciaForm";
import JurisprudenciaListaTab from "./JurisprudenciaListaTab";

export default function JurisprudenciaAdminPage({ getAccessToken }) {
  const [aba, setAba] = useState("listar");

  return (
    <Container fluid className="py-4 jur-admin" style={{ maxWidth: 1100 }}>
      <Card className="shadow-sm">
        <Card.Body>
          <div className="jur-header">
            <Bank size={22} style={{ color: "var(--uniform-accent)" }} />
            <h4>Jurisprudência</h4>
            <Badge bg="warning" text="dark">Admin</Badge>
          </div>
          <p className="jur-sub">
            Acórdãos paradigma que a IA cita nas defesas. Cada entrada é
            indexada por busca semântica (embedding 384d) e por texto — quanto
            mais relevante e bem preenchida, melhor a fundamentação gerada.
          </p>

          <Tabs activeKey={aba} onSelect={(k) => setAba(k)} className="mb-3">
            <Tab eventKey="listar" title="Listar / Editar / Excluir">
              {aba === "listar" && (
                <JurisprudenciaListaTab getAccessToken={getAccessToken} />
              )}
            </Tab>
            <Tab eventKey="adicionar" title="Adicionar novo">
              {aba === "adicionar" && (
                <div className="pt-2">
                  <JurisprudenciaForm getAccessToken={getAccessToken} compact />
                </div>
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
}
