"""Testes de validacao do schema de suporte/contato."""

import pytest
from pydantic import ValidationError

from App.models.suporte import SuporteContato


def test_suporte_contato_valido():
    payload = SuporteContato(
        name="Cliente Teste",
        email="cliente@teste.com",
        category="Erro na minuta sugerida",
        processo="0001234-56.2026.8.00.0000",
        subject="Erro no texto final",
        message="A contestacao foi gerada com dado incorreto na fundamentacao.",
    )

    assert payload.nome == "Cliente Teste"
    assert payload.email == "cliente@teste.com"
    assert payload.numero_processo == "0001234-56.2026.8.00.0000"


@pytest.mark.parametrize("email", ["", "invalido", "cliente@", "cliente.com"])
def test_suporte_contato_rejeita_email_invalido(email):
    with pytest.raises(ValidationError):
        SuporteContato(
            name="Cliente Teste",
            email=email,
            category="Falha de login",
            subject="Sem acesso",
            message="Nao consigo acessar a plataforma desde ontem a tarde.",
        )


def test_suporte_contato_rejeita_numero_processo_invalido():
    with pytest.raises(ValidationError):
        SuporteContato(
            name="Cliente Teste",
            email="cliente@teste.com",
            category="Erro na minuta sugerida",
            processo="123",
            subject="Processo invalido",
            message="Recebi erro ao informar o numero do processo no formulario.",
        )


def test_suporte_contato_rejeita_mensagem_curta():
    with pytest.raises(ValidationError):
        SuporteContato(
            name="Cliente Teste",
            email="cliente@teste.com",
            category="Falha de login",
            subject="Sem acesso",
            message="Muito curto",
        )
