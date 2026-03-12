from pydantic import BaseModel, Field


class Processo(BaseModel):
    processo: str = Field(min_length=3, description="Numero do processo")
    cliente: str = Field(min_length=2, description="Cliente ou parte")
    tipoAcao: str = Field(min_length=2, description="Tipo da acao")
    tese: str = Field(min_length=2, description="Tese principal")
    observacoes: str = Field(min_length=2, description="Observacoes para o agente")
    arquivo: str | None = Field(default=None, description="Nome do arquivo base")
