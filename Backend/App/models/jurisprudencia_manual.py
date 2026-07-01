"""Schema Pydantic para cadastro manual de jurisprudencia paradigma (PR22).

Payload de POST /api/admin/jurisprudencia/criar — usado pela UI admin
"Adicionar Jurisprudencia" pra advogado adicionar acordaos paradigma
encontrados no Migalhas/Conjur/JusBrasil sem precisar editar SQL.
"""

from __future__ import annotations

import re
from datetime import date as date_type
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


_DATE_ISO_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

# PR27 (finding #2): validar area_juridica contra enum canonica no proprio
# model. Antes, string arbitraria passava Pydantic e era silenciosamente
# coercada pra NULL no upsert_jurisprudencia — admin nao sabia que a area
# tinha sido descartada. Agora o 422 acontece antes de gravar.
# Mantido em sync com Backend/App/database.py AREAS_JURIDICAS_CANONICAS.
AreaJuridica = Literal[
    "trabalhista",
    "consumidor",
    "bancario",
    "previdenciario",
    "civel",
]


class JurisprudenciaManual(BaseModel):
    """Payload para POST /api/admin/jurisprudencia/criar.

    Espelha colunas da tabela `public.jurisprudencia_externa` (PR19). Embedding
    e `criado_em`/`scraped_at` sao gerados/setados pelo backend, nao recebidos.
    """

    model_config = ConfigDict(extra="ignore")

    # Obrigatorios
    tribunal: Annotated[str, Field(min_length=2, max_length=20)]
    numero_processo: Annotated[str, Field(min_length=3, max_length=100)]
    ementa: Annotated[str, Field(min_length=20, max_length=10000)]

    # Opcionais com defaults
    tipo_decisao: Annotated[str, Field(default="Acordao", max_length=40)] = "Acordao"
    relator: Annotated[str | None, Field(default=None, max_length=200)] = None
    data_julgamento: Annotated[str | None, Field(default=None, max_length=10)] = None
    tese_firmada: Annotated[str | None, Field(default=None, max_length=5000)] = None
    area_juridica: AreaJuridica | None = None
    peso_relevancia: Annotated[int, Field(default=5, ge=1, le=10)] = 5
    fonte_url: Annotated[str | None, Field(default=None, max_length=500)] = None
    # PR24: texto_integral opcional (so pra consulta humana / reranker futuro,
    # NAO entra no embedding). Max 200k chars (~200 KB, cobre acordaos gigantes).
    texto_integral: Annotated[str | None, Field(default=None, max_length=200000)] = None

    @field_validator("tribunal", "numero_processo", "ementa")
    @classmethod
    def _strip_obrigatorio(cls, value: str) -> str:
        texto = value.strip()
        if not texto:
            raise ValueError("Campo obrigatorio nao pode ser vazio apos strip.")
        return texto

    @field_validator("relator", "tese_firmada", "fonte_url", "texto_integral")
    @classmethod
    def _strip_opcional(cls, value: str | None) -> str | None:
        if value is None:
            return None
        texto = value.strip()
        return texto or None

    @field_validator("data_julgamento")
    @classmethod
    def _validar_data_iso(cls, value: str | None) -> str | None:
        """Aceita None ou 'YYYY-MM-DD' valido. Outras formas levantam ValueError."""
        if value is None or value == "":
            return None
        texto = value.strip()
        if not _DATE_ISO_RE.match(texto):
            raise ValueError(
                "data_julgamento deve estar em formato ISO 'YYYY-MM-DD' (ex: '2023-05-10')."
            )
        # Confirma que e data real (rejeita 2023-02-30)
        try:
            date_type.fromisoformat(texto)
        except ValueError as err:
            raise ValueError(f"data_julgamento invalida: {err}") from err
        return texto
