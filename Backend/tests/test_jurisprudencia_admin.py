"""Testes da rota POST /api/admin/jurisprudencia/criar (PR22)."""

import os
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from App.security import get_authenticated_user
from main import app

client = TestClient(app)


USUARIO_COMUM = {
    "id": "user-123",
    "nome": "Advogado",
    "email": "adv@escritorio.com",
    "auth_provider": "legacy",
}
USUARIO_ADMIN = {
    "id": "admin-1",
    "nome": "Admin",
    "email": "admin@jurisflow.com",
    "auth_provider": "legacy",
}


@pytest.fixture
def auth_como_usuario():
    app.dependency_overrides[get_authenticated_user] = lambda: USUARIO_COMUM
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def auth_como_admin():
    app.dependency_overrides[get_authenticated_user] = lambda: USUARIO_ADMIN
    yield
    app.dependency_overrides.clear()


def _payload_minimo(**overrides) -> dict:
    base = {
        "tribunal": "TST",
        "numero_processo": "Sumula TESTE-001",
        "ementa": "Ementa de teste com mais de 20 caracteres pra passar pelo min_length.",
    }
    base.update(overrides)
    return base


# ─────────────────────────────────────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────────────────────────────────────


def test_sem_autenticacao_bloqueia():
    """Sem token, dependency real rejeita."""
    resp = client.post("/api/admin/jurisprudencia/criar", json=_payload_minimo())
    assert resp.status_code in (401, 403)


def test_usuario_nao_admin_recebe_403(auth_como_usuario):
    """Usuario logado mas fora de ADMIN_EMAILS deve receber 403."""
    with patch.dict(os.environ, {"ADMIN_EMAILS": "admin@jurisflow.com"}):
        resp = client.post(
            "/api/admin/jurisprudencia/criar", json=_payload_minimo()
        )
    assert resp.status_code == 403
    assert "administradores" in resp.json()["detail"].lower()


def test_admin_consegue_criar(auth_como_admin):
    """Admin com email correto + payload valido → 201 + chama upsert."""
    with (
        patch.dict(os.environ, {"ADMIN_EMAILS": "admin@jurisflow.com"}),
        patch(
            "App.routes.jurisprudencia_admin.gerar_embedding",
            return_value=[0.0] * 384,
        ),
        patch("App.database.upsert_jurisprudencia") as mock_upsert,
    ):
        resp = client.post(
            "/api/admin/jurisprudencia/criar",
            json=_payload_minimo(
                relator="Min. Teste",
                data_julgamento="2020-05-10",
                peso_relevancia=8,
                area_juridica="trabalhista",
            ),
        )
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "ok"
    assert data["tribunal"] == "TST"
    assert data["embedding_gerado"] is True
    mock_upsert.assert_called_once()
    kwargs = mock_upsert.call_args.kwargs
    assert kwargs["peso_relevancia"] == 8
    assert kwargs["data_julgamento"] == "2020-05-10"


# ─────────────────────────────────────────────────────────────────────────────
# Validacao Pydantic
# ─────────────────────────────────────────────────────────────────────────────


def test_ementa_vazia_retorna_422(auth_como_admin):
    """Ementa abaixo do min_length=20 deve falhar com 422."""
    with patch.dict(os.environ, {"ADMIN_EMAILS": "admin@jurisflow.com"}):
        resp = client.post(
            "/api/admin/jurisprudencia/criar",
            json=_payload_minimo(ementa="curto"),
        )
    assert resp.status_code == 422


def test_peso_relevancia_fora_do_range_retorna_422(auth_como_admin):
    """Pydantic rejeita peso=15 (max=10)."""
    with patch.dict(os.environ, {"ADMIN_EMAILS": "admin@jurisflow.com"}):
        resp = client.post(
            "/api/admin/jurisprudencia/criar",
            json=_payload_minimo(peso_relevancia=15),
        )
    assert resp.status_code == 422


def test_data_julgamento_formato_invalido_retorna_422(auth_como_admin):
    """data_julgamento '10/05/2020' (BR format) deve falhar; aceitamos so ISO."""
    with patch.dict(os.environ, {"ADMIN_EMAILS": "admin@jurisflow.com"}):
        resp = client.post(
            "/api/admin/jurisprudencia/criar",
            json=_payload_minimo(data_julgamento="10/05/2020"),
        )
    assert resp.status_code == 422


def test_data_julgamento_dia_inexistente_retorna_422(auth_como_admin):
    """'2023-02-30' tem formato ISO mas e data invalida."""
    with patch.dict(os.environ, {"ADMIN_EMAILS": "admin@jurisflow.com"}):
        resp = client.post(
            "/api/admin/jurisprudencia/criar",
            json=_payload_minimo(data_julgamento="2023-02-30"),
        )
    assert resp.status_code == 422


def test_data_julgamento_vazia_aceita_como_none(auth_como_admin):
    """String vazia em data_julgamento vira None sem 422."""
    with (
        patch.dict(os.environ, {"ADMIN_EMAILS": "admin@jurisflow.com"}),
        patch(
            "App.routes.jurisprudencia_admin.gerar_embedding",
            return_value=[0.0] * 384,
        ),
        patch("App.database.upsert_jurisprudencia") as mock_upsert,
    ):
        resp = client.post(
            "/api/admin/jurisprudencia/criar",
            json=_payload_minimo(data_julgamento=""),
        )
    assert resp.status_code == 201
    assert mock_upsert.call_args.kwargs["data_julgamento"] is None


# ─────────────────────────────────────────────────────────────────────────────
# Robustez
# ─────────────────────────────────────────────────────────────────────────────


def test_embedding_indisponivel_nao_bloqueia_upsert(auth_como_admin):
    """Sentence-transformers retorna None: ainda assim upserta + log warning."""
    with (
        patch.dict(os.environ, {"ADMIN_EMAILS": "admin@jurisflow.com"}),
        patch(
            "App.routes.jurisprudencia_admin.gerar_embedding",
            return_value=None,
        ),
        patch("App.database.upsert_jurisprudencia") as mock_upsert,
    ):
        resp = client.post(
            "/api/admin/jurisprudencia/criar", json=_payload_minimo()
        )
    assert resp.status_code == 201
    assert resp.json()["embedding_gerado"] is False
    mock_upsert.assert_called_once()
    assert mock_upsert.call_args.kwargs["embedding"] is None


def test_upsert_falha_db_retorna_500(auth_como_admin):
    """psycopg2.Error virou HTTPException 500 (nao vaza stacktrace)."""
    with (
        patch.dict(os.environ, {"ADMIN_EMAILS": "admin@jurisflow.com"}),
        patch(
            "App.routes.jurisprudencia_admin.gerar_embedding",
            return_value=[0.0] * 384,
        ),
        patch(
            "App.database.upsert_jurisprudencia",
            side_effect=Exception("connection refused"),
        ),
    ):
        resp = client.post(
            "/api/admin/jurisprudencia/criar", json=_payload_minimo()
        )
    assert resp.status_code == 500
    assert "logs" in resp.json()["detail"].lower()


def test_re_submissao_mesmo_acordao_continua_201(auth_como_admin):
    """Idempotencia: chamar 2x com mesmo (tribunal, numero) retorna 201 ambas vezes
    (UPSERT da tabela faz match e atualiza, sem duplicar)."""
    with (
        patch.dict(os.environ, {"ADMIN_EMAILS": "admin@jurisflow.com"}),
        patch(
            "App.routes.jurisprudencia_admin.gerar_embedding",
            return_value=[0.0] * 384,
        ),
        patch("App.database.upsert_jurisprudencia") as mock_upsert,
    ):
        resp1 = client.post(
            "/api/admin/jurisprudencia/criar", json=_payload_minimo()
        )
        resp2 = client.post(
            "/api/admin/jurisprudencia/criar",
            json=_payload_minimo(ementa="Ementa atualizada com mais detalhes do paradigma."),
        )
    assert resp1.status_code == 201
    assert resp2.status_code == 201
    assert mock_upsert.call_count == 2
