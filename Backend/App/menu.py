"""Exemplo minimo de app FastAPI.

Observacao: este arquivo parece ser legado/demo e nao participa do fluxo principal
iniciado por `Backend/main.py`.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

# CORS local para facilitar consumo por um frontend React durante desenvolvimento.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173/"],  # URL do React
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    """Endpoint basico de teste para validar se a API respondeu."""
    return {"message": "Hello World"}
