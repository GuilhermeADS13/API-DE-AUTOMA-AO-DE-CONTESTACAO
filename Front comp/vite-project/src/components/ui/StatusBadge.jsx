import React from "react";
import { Badge } from "react-bootstrap";

export default function StatusBadge({ status }) {
  const normalized = status.toLowerCase();

  let variant = "secondary";

  if (normalized.includes("conclu")) {
    variant = "success";
  } else if (normalized.includes("analise")) {
    variant = "warning";
  } else if (normalized.includes("revis")) {
    variant = "primary";
  }

  return (
    <Badge pill bg={variant} className="status-pill">
      {status}
    </Badge>
  );
}
