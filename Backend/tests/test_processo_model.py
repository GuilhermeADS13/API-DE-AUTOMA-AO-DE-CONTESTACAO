"""Testes do schema `Processo` para cenarios validos e invalidos."""

import base64

import pytest
from pydantic import ValidationError

from App.models.processo import Processo


@pytest.fixture()
def payload_base() -> dict:
    """Fixture com payload valido minimo reaproveitado entre cenarios."""
    return {
        "numero_processo": "0001234-56.2026.8.00.0000",
        "autor": "Autor de Teste",
        "reu": "Reu de Teste",
        "tipo_acao": "Direito Civil",
        "fatos": "Resumo dos fatos",
        "pedido_autor": "Pedido principal",
        "texto_editado_ao_vivo": "Texto livre",
    }


def _arquivo_base64_valido() -> str:
    # Magic bytes PK\x03\x04 = DOCX (ZIP/OpenXML) — satisfaz a validacao de MIME.
    return base64.b64encode(b"PK\x03\x04conteudo de teste DOCX").decode("utf-8")


def test_processo_valido_sem_arquivo(payload_base):
    processo = Processo(**payload_base)
    assert processo.numero_processo == "0001234-56.2026.8.00.0000"
    assert processo.arquivo_base is None


@pytest.mark.parametrize(
    "numero_invalido",
    [
        "123",
        "0001234-56.2026.8.00.000",
        "00012345620268000000",
        "0001234-56.2026.8.0.0000",
    ],
)
def test_processo_rejeita_numero_cnj_invalido(payload_base, numero_invalido):
    with pytest.raises(ValidationError):
        Processo(**{**payload_base, "numero_processo": numero_invalido})


def test_processo_valido_com_arquivo_base64(payload_base):
    processo = Processo(
        **{
            **payload_base,
            "arquivo_base_nome": "peca.docx",
            "arquivo_base_conteudo_base64": _arquivo_base64_valido(),
            "arquivo_base_tamanho_bytes": 17,
        }
    )
    assert processo.arquivo_base_nome == "peca.docx"
    assert processo.arquivo_base == "peca.docx"


def test_processo_rejeita_nome_sem_conteudo(payload_base):
    with pytest.raises(ValidationError):
        Processo(**{**payload_base, "arquivo_base_nome": "peca.pdf"})


def test_processo_rejeita_conteudo_sem_nome(payload_base):
    with pytest.raises(ValidationError):
        Processo(
            **{
                **payload_base,
                "arquivo_base_conteudo_base64": _arquivo_base64_valido(),
            }
        )


@pytest.mark.parametrize("nome_arquivo", ["peca.exe", "arquivo.txt", "base.jpeg"])
def test_processo_rejeita_extensao_invalida(payload_base, nome_arquivo):
    with pytest.raises(ValidationError):
        Processo(
            **{
                **payload_base,
                "arquivo_base_nome": nome_arquivo,
                "arquivo_base_conteudo_base64": _arquivo_base64_valido(),
            }
        )


def test_processo_rejeita_base64_invalido(payload_base):
    with pytest.raises(ValidationError):
        Processo(
            **{
                **payload_base,
                "arquivo_base_nome": "peca.pdf",
                "arquivo_base_conteudo_base64": "###@@@",
            }
        )


def test_processo_rejeita_tamanho_arquivo_invalido(payload_base):
    with pytest.raises(ValidationError):
        Processo(
            **{
                **payload_base,
                "arquivo_base_nome": "peca.pdf",
                "arquivo_base_conteudo_base64": _arquivo_base64_valido(),
                "arquivo_base_tamanho_bytes": -1,
            }
        )
