# Schema Pydantic para validar resposta do webhook n8n antes de retornar ao cliente.
from pydantic import BaseModel, ConfigDict


class N8NResponse(BaseModel):
    """Campos conhecidos da resposta do workflow n8n.

    extra='ignore' descarta campos inesperados — protege contra injecao de dados
    arbitrarios caso o n8n seja comprometido ou retorne payload malformado.
    """

    model_config = ConfigDict(extra="ignore")

    status: str = "processando"
    mensagem: str | None = None
    contestacao_id: str | None = None
    workflow_id: str | None = None
    minuta: str | None = None
    fundamentos: list[str] | None = None
