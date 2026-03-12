import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def _resolve_allowed_origins() -> list[str]:
    """
    Permite configurar origens via env:
    FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
    """
    value = os.getenv("FRONTEND_ORIGINS", "").strip()
    if not value:
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    return [origin.strip().rstrip("/") for origin in value.split(",") if origin.strip()]


app = FastAPI(
    title="API de Automacao de Contestacao",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_resolve_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Backend funcionando!"}


@app.get("/health")
def health():
    return {"status": "ok"}
