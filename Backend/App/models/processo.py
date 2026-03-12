from pydantic import BaseModel

class Processo(BaseModel):
    numero_processo: str
    autor: str
    reu: str
    tipo_acao: str
    fatos: str
    pedido_autor: str