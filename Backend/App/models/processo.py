import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

PROCESSO_REGEX = re.compile(r"^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$")
ALLOWED_BASE_FILE_EXTENSIONS = (".pdf", ".doc", ".docx")


class Processo(BaseModel):
    model_config = ConfigDict(extra="ignore")

    numero_processo: str = Field(..., min_length=1)
    autor: str = Field(..., min_length=1)
    reu: str = Field(default="Nao informado")
    tipo_acao: str = Field(..., min_length=1)
    fatos: str = Field(..., min_length=1)
    pedido_autor: str = Field(..., min_length=1)
    arquivo_base: str | None = None
    texto_editado_ao_vivo: str | None = None

    @field_validator("numero_processo")
    @classmethod
    def validar_numero_processo(cls, value: str) -> str:
        numero = value.strip()
        if not PROCESSO_REGEX.fullmatch(numero):
            raise ValueError("Use o formato 0001234-56.2026.8.00.0000.")
        return numero

    @field_validator("autor", "reu", "tipo_acao", "fatos", "pedido_autor")
    @classmethod
    def limpar_texto(cls, value: str) -> str:
        texto = value.strip()
        if not texto:
            raise ValueError("Campo obrigatorio.")
        return texto

    @field_validator("arquivo_base")
    @classmethod
    def validar_arquivo_base(cls, value: str | None) -> str | None:
        if value is None:
            return None

        arquivo = value.strip()
        if not arquivo:
            return None

        if not arquivo.lower().endswith(ALLOWED_BASE_FILE_EXTENSIONS):
            raise ValueError("Arquivo base deve ser DOC, DOCX ou PDF.")
        return arquivo

    @field_validator("texto_editado_ao_vivo")
    @classmethod
    def normalizar_texto_editado(cls, value: str | None) -> str | None:
        if value is None:
            return None

        texto = value.strip()
        if not texto:
            return None
        return texto
