"""Testes unitarios da rota de contestacao."""

import asyncio

import pytest
from fastapi import HTTPException

from App.models.processo import Processo
from App.routes import contestacao
from App.services.n8n_service import N8NServiceError


@pytest.fixture()
def processo_valido() -> Processo:
    return Processo(
        numero_processo="0001234-56.2026.8.00.0000",
        autor="Autor Teste",
        reu="Reu Teste",
        tipo_acao="Direito Civil",
        fatos="Fatos relevantes",
        pedido_autor="Pedido principal",
        texto_editado_ao_vivo="Minuta inicial",
    )


def test_gerar_contestacao_fluxo_feliz(monkeypatch, processo_valido):
    calls: dict = {}

    async def fake_enviar_para_n8n(payload):
        calls["payload_n8n"] = payload.copy()
        return {"workflow_id": "wf-123"}

    def fake_save_contestacao(payload, status, n8n_resposta):
        calls["save"] = {
            "payload": payload.copy(),
            "status": status,
            "n8n_resposta": n8n_resposta,
        }
        return 77

    monkeypatch.setattr(contestacao, "enviar_para_n8n", fake_enviar_para_n8n)
    monkeypatch.setattr(contestacao, "save_contestacao", fake_save_contestacao)

    response = asyncio.run(
        contestacao.gerar_contestacao(
            processo=processo_valido,
            usuario={"id": "USR-ABC", "nome": "Ana", "email": "ana@teste.com"},
        )
    )

    assert response["status"] == "processando"
    assert response["id_registro"] == 77
    assert response["workflow"] == {"workflow_id": "wf-123"}
    assert calls["payload_n8n"]["usuario_id"] == "USR-ABC"
    assert calls["save"]["status"] == "processando"


def test_gerar_contestacao_trata_erro_n8n(monkeypatch, processo_valido):
    calls: dict = {}

    async def fake_enviar_para_n8n(payload):
        raise N8NServiceError("workflow indisponivel")

    def fake_save_contestacao(payload, status, n8n_resposta):
        calls["save"] = {
            "status": status,
            "n8n_resposta": n8n_resposta,
        }
        return 12

    monkeypatch.setattr(contestacao, "enviar_para_n8n", fake_enviar_para_n8n)
    monkeypatch.setattr(contestacao, "save_contestacao", fake_save_contestacao)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            contestacao.gerar_contestacao(
                processo=processo_valido,
                usuario={"id": "USR-ERR", "nome": "Ana", "email": "ana@teste.com"},
            )
        )

    assert exc_info.value.status_code == 502
    assert "workflow indisponivel" in str(exc_info.value.detail)
    assert calls["save"]["status"] == "erro"
    assert "workflow indisponivel" in calls["save"]["n8n_resposta"]["mensagem"]
