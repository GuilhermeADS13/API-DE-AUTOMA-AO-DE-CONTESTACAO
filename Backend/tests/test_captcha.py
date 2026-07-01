"""PR28 - Testes do cascade CAPTCHA solver (orchestrator + notifier + routes)."""

from __future__ import annotations

import time
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from App.security import get_authenticated_user
from main import app

client = TestClient(app)


USUARIO_MOCK = {
    "id": "user-1",
    "nome": "Advogado",
    "email": "adv@escritorio.com",
    "auth_provider": "legacy",
}


@pytest.fixture
def auth_fake():
    app.dependency_overrides[get_authenticated_user] = lambda: USUARIO_MOCK
    yield
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def limpar_pendentes():
    """Cada teste comeca com storage limpo do orchestrator."""
    from App.services import captcha_orchestrator as orch
    orch._pendentes.clear()
    yield
    orch._pendentes.clear()


# ─────────────────────────────────────────────────────────────────────────────
# Orchestrator (sem HTTP)
# ─────────────────────────────────────────────────────────────────────────────


class TestOrchestrator:
    def test_crnn_resolve_retorna_ok_sem_criar_pending(self, monkeypatch):
        from App.services import captcha_orchestrator as orch
        # Simula CRNN retornando texto
        monkeypatch.setattr(orch, "_tentar_crnn", lambda b: "ABCD")
        resultado = orch.resolver(b"fake-png", tipo="visual", tribunal="STJ")
        assert resultado.status == "ok"
        assert resultado.texto == "ABCD"
        # Nao criou tarefa pending
        assert len(orch._pendentes) == 0

    def test_crnn_falha_notify_ok_retorna_pending(self, monkeypatch):
        from App.services import captcha_orchestrator as orch
        monkeypatch.setattr(orch, "_tentar_crnn", lambda b: None)
        monkeypatch.setattr(orch, "notificar_humano", lambda **kw: True)
        resultado = orch.resolver(b"fake-png", tipo="visual", tribunal="STJ")
        assert resultado.status == "pending"
        assert resultado.token
        # Tarefa criada
        assert resultado.token in orch._pendentes

    def test_crnn_falha_notify_falha_retorna_sem_canal(self, monkeypatch):
        from App.services import captcha_orchestrator as orch
        monkeypatch.setattr(orch, "_tentar_crnn", lambda b: None)
        monkeypatch.setattr(orch, "notificar_humano", lambda **kw: False)
        resultado = orch.resolver(b"fake-png", tipo="visual")
        assert resultado.status == "sem_canal"
        # NAO deixa lixo no dict quando notify falha
        assert len(orch._pendentes) == 0

    def test_tipo_turnstile_pula_crnn_e_notifica_direto(self, monkeypatch):
        """Turnstile nao tem imagem — CRNN nao roda; vai direto pra notify."""
        from App.services import captcha_orchestrator as orch
        crnn_chamado = []
        monkeypatch.setattr(orch, "_tentar_crnn", lambda b: crnn_chamado.append(b) or None)
        monkeypatch.setattr(orch, "notificar_humano", lambda **kw: True)
        resultado = orch.resolver(None, tipo="turnstile", tribunal="STJ")
        assert resultado.status == "pending"
        assert crnn_chamado == []  # pulou CRNN

    def test_registrar_resposta_atualiza_task(self, monkeypatch):
        from App.services import captcha_orchestrator as orch
        monkeypatch.setattr(orch, "_tentar_crnn", lambda b: None)
        monkeypatch.setattr(orch, "notificar_humano", lambda **kw: True)
        resultado = orch.resolver(b"png", tipo="visual")
        token = resultado.token
        assert orch.registrar_resposta(token, "AB5C") is True
        # Segunda tentativa (idempotencia negativa)
        assert orch.registrar_resposta(token, "outra") is False

    def test_consultar_status_retorna_ok_apos_resposta(self, monkeypatch):
        from App.services import captcha_orchestrator as orch
        monkeypatch.setattr(orch, "_tentar_crnn", lambda b: None)
        monkeypatch.setattr(orch, "notificar_humano", lambda **kw: True)
        token = orch.resolver(b"png", tipo="visual").token
        # Antes da resposta
        assert orch.consultar_status(token).status == "pending"
        orch.registrar_resposta(token, "XYZ")
        r = orch.consultar_status(token)
        assert r.status == "ok"
        assert r.texto == "XYZ"

    def test_consultar_status_token_inexistente_retorna_expirado(self):
        from App.services import captcha_orchestrator as orch
        r = orch.consultar_status("token-que-nao-existe-123")
        assert r.status == "expirado"

    def test_ttl_expira_e_limpa_task(self, monkeypatch):
        from App.services import captcha_orchestrator as orch
        monkeypatch.setattr(orch, "_tentar_crnn", lambda b: None)
        monkeypatch.setattr(orch, "notificar_humano", lambda **kw: True)
        token = orch.resolver(b"png", tipo="visual", ttl_sec=0).token
        time.sleep(0.01)  # microscopic wait pra TTL vencer
        r = orch.consultar_status(token)
        assert r.status == "expirado"
        # Task foi limpa
        assert token not in orch._pendentes


# ─────────────────────────────────────────────────────────────────────────────
# Notifier
# ─────────────────────────────────────────────────────────────────────────────


class TestNotifier:
    def test_sem_canal_configurado_retorna_false(self, monkeypatch):
        from App.services import captcha_notifier
        # Desliga ambos os canais
        monkeypatch.delenv("TELEGRAM_BOT_TOKEN", raising=False)
        monkeypatch.delenv("TELEGRAM_CHAT_ID", raising=False)
        monkeypatch.delenv("SUPPORT_SMTP_HOST", raising=False)
        monkeypatch.delenv("CAPTCHA_NOTIFY_EMAIL", raising=False)
        monkeypatch.delenv("SUPPORT_EMAIL_TO", raising=False)
        ok = captcha_notifier.notificar_humano(
            token_pending="X", tipo_captcha="visual", tribunal="STJ",
        )
        assert ok is False

    def test_telegram_configurado_usa_telegram(self, monkeypatch):
        from App.services import captcha_notifier

        monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "fake-token")
        monkeypatch.setenv("TELEGRAM_CHAT_ID", "fake-chat")

        chamadas = {"telegram": 0, "email": 0}
        monkeypatch.setattr(
            captcha_notifier, "_enviar_telegram",
            lambda **kw: chamadas.__setitem__("telegram", chamadas["telegram"] + 1) or True,
        )
        monkeypatch.setattr(
            captcha_notifier, "_enviar_email",
            lambda **kw: chamadas.__setitem__("email", chamadas["email"] + 1) or True,
        )
        ok = captcha_notifier.notificar_humano(
            token_pending="X", tipo_captcha="visual", tribunal="STJ",
        )
        assert ok is True
        assert chamadas["telegram"] == 1
        assert chamadas["email"] == 0  # nao caiu no email pq telegram funcionou


# ─────────────────────────────────────────────────────────────────────────────
# HTTP endpoints
# ─────────────────────────────────────────────────────────────────────────────


class TestRotaSolve:
    def test_solve_sem_arquivo_visual_e_pending(self, auth_fake, monkeypatch):
        """Sem imagem + tipo=visual → CRNN nao roda; cai no notify."""
        from App.services import captcha_orchestrator as orch
        monkeypatch.setattr(orch, "notificar_humano", lambda **kw: True)
        resp = client.post(
            "/api/captcha/solve",
            data={"tipo": "visual", "tribunal": "STJ"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "pending"

    def test_solve_tipo_invalido_422(self, auth_fake):
        resp = client.post(
            "/api/captcha/solve",
            data={"tipo": "xyz-invalido"},
        )
        assert resp.status_code == 422

    def test_solve_ok_quando_crnn_resolve(self, auth_fake, monkeypatch):
        from App.services import captcha_orchestrator as orch
        monkeypatch.setattr(orch, "_tentar_crnn", lambda b: "ABCD")
        # Manda arquivo (bytes fake)
        resp = client.post(
            "/api/captcha/solve",
            data={"tipo": "visual", "tribunal": "STJ"},
            files={"file": ("captcha.png", b"fakebytes", "image/png")},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["texto"] == "ABCD"

    def test_solve_sem_canal_503(self, auth_fake, monkeypatch):
        from App.services import captcha_orchestrator as orch
        monkeypatch.setattr(orch, "_tentar_crnn", lambda b: None)
        monkeypatch.setattr(orch, "notificar_humano", lambda **kw: False)
        resp = client.post(
            "/api/captcha/solve",
            data={"tipo": "turnstile", "tribunal": "STJ"},
        )
        assert resp.status_code == 503


class TestRotaStatusEAnswer:
    def test_status_token_inexistente_retorna_expirado_200(self, auth_fake):
        resp = client.get("/api/captcha/status/token-fake-nao-existe")
        assert resp.status_code == 200
        assert resp.json()["status"] == "expirado"

    def test_ciclo_completo_solve_status_answer(self, auth_fake, monkeypatch):
        from App.services import captcha_orchestrator as orch
        monkeypatch.setattr(orch, "_tentar_crnn", lambda b: None)
        monkeypatch.setattr(orch, "notificar_humano", lambda **kw: True)

        # 1) solve → pending
        resp = client.post(
            "/api/captcha/solve",
            data={"tipo": "turnstile", "tribunal": "STJ"},
        )
        token = resp.json()["token"]

        # 2) status → pending
        resp = client.get(f"/api/captcha/status/{token}")
        assert resp.json()["status"] == "pending"

        # 3) answer registra
        resp = client.post(
            f"/api/captcha/answer/{token}",
            json={"texto": "resposta_do_humano"},
        )
        assert resp.status_code == 200

        # 4) status → ok com texto
        resp = client.get(f"/api/captcha/status/{token}")
        data = resp.json()
        assert data["status"] == "ok"
        assert data["texto"] == "resposta_do_humano"

    def test_answer_body_vazio_422(self, auth_fake):
        resp = client.post("/api/captcha/answer/qualquer", json={})
        assert resp.status_code == 422

    def test_answer_token_inexistente_404(self, auth_fake):
        resp = client.post(
            "/api/captcha/answer/inexistente-xyz",
            json={"texto": "ABC"},
        )
        assert resp.status_code == 404


class TestRotaPendentes:
    def test_pendentes_retorna_lista_vazia_quando_zerado(self, auth_fake):
        resp = client.get("/api/captcha/pendentes")
        assert resp.status_code == 200
        assert resp.json()["pendentes"] == []

    def test_pendentes_lista_apos_solve(self, auth_fake, monkeypatch):
        from App.services import captcha_orchestrator as orch
        monkeypatch.setattr(orch, "_tentar_crnn", lambda b: None)
        monkeypatch.setattr(orch, "notificar_humano", lambda **kw: True)
        client.post(
            "/api/captcha/solve",
            data={"tipo": "visual", "tribunal": "STJ"},
        )
        resp = client.get("/api/captcha/pendentes")
        pendentes = resp.json()["pendentes"]
        assert len(pendentes) == 1
        assert pendentes[0]["tipo"] == "visual"
        assert pendentes[0]["tribunal"] == "STJ"
