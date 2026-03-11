/*
=========================================================
SETOR 1 — BADGE DE STATUS
Esse componente mostra o status com cor.
=========================================================
*/

import React from 'react'
import { Badge } from 'react-bootstrap'

export default function StatusBadge({ status }) {
  const variant = status === 'Concluída' ? 'success' : 'warning'

  return <Badge bg={variant}>{status}</Badge>
}