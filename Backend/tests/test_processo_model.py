"""Testes do schema `Processo` para cenarios validos e invalidos."""

import base64

import pytest
from pydantic import ValidationError

from App.models.processo import Processo


def _base_payload():
    """Monta payload valido minimo reutilizado nos testes."""
    return {
        "numero_processo": "0001234-56.2026.8.00.0000",
        "autor": "Autor de Teste",
        "reu": "Reu de Teste",
        "tipo_acao": "Direito Civil",
        "fatos": "Resumo dos fatos",
        "pedido_autor": "Pedido principal",
        "texto_editado_ao_vivo": "Texto livre",
    }


def test_processo_valido_sem_arquivo():
    """Aceita payload com campos juridicos obrigatorios sem upload."""
    processo = Processo(**_base_payload())
    assert processo.numero_processo == "0001234-56.2026.8.00.0000"


def test_processo_invalido_numero():
    """Rejeita numero de processo fora do formato CNJ."""
    with pytest.raises(ValidationError):
        Processo(**{**_base_payload(), "numero_processo": "123"})


def test_processo_valido_com_arquivo_base64():
    """Aceita metadados + conteudo base64 coerentes."""
    content = base64.b64encode(b"conteudo de teste").decode("utf-8")
    processo = Processo(
        **{
            **_base_payload(),
            "arquivo_base_nome": "peca.docx",
            "arquivo_base_conteudo_base64": content,
            "arquivo_base_tamanho_bytes": 17,
        }
    )
    assert processo.arquivo_base_nome == "peca.docx"
    assert processo.arquivo_base == "peca.docx"


def test_processo_erro_quando_nome_sem_conteudo():
    """Rejeita envio com nome de arquivo sem conteudo correspondente."""
    with pytest.raises(ValidationError):
        Processo(
            **{
                **_base_payload(),
                "arquivo_base_nome": "peca.pdf",
            }
        )
