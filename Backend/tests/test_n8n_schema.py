"""Quest 2 — Testa validacao do schema da resposta n8n."""
import pytest
from pydantic import ValidationError

from App.models.n8n_response import N8NResponse


def test_campos_extras_ignorados():
    """Campos desconhecidos nao devem causar erro — sao descartados silenciosamente."""
    r = N8NResponse(
        status="processando",
        campo_malicioso="<script>alert(1)</script>",
        outro_campo_injetado={"nested": "data"},
    )
    data = r.model_dump()
    assert "campo_malicioso" not in data
    assert "outro_campo_injetado" not in data
    assert data["status"] == "processando"


def test_campos_conhecidos_preservados():
    r = N8NResponse(
        status="concluido",
        mensagem="Contestacao gerada com sucesso",
        contestacao_id="CTR-2026-000001",
        workflow_id="wf-abc123",
    )
    assert r.status == "concluido"
    assert r.contestacao_id == "CTR-2026-000001"
    assert r.workflow_id == "wf-abc123"


def test_status_padrao_quando_ausente():
    """status tem default 'processando' — nao e obrigatorio na resposta do n8n."""
    r = N8NResponse()
    assert r.status == "processando"


def test_campos_opcionais_nulos_excluidos_no_dump():
    r = N8NResponse(status="ok")
    data = r.model_dump(exclude_none=True)
    assert "mensagem" not in data
    assert "contestacao_id" not in data
    assert data["status"] == "ok"


def test_resposta_minima_valida():
    r = N8NResponse(status="erro", mensagem="Timeout no modelo de IA")
    assert r.mensagem == "Timeout no modelo de IA"


def test_fundamentos_como_lista():
    r = N8NResponse(status="ok", fundamentos=["Art. 818 CLT", "OJ 301 TST"])
    assert len(r.fundamentos) == 2
