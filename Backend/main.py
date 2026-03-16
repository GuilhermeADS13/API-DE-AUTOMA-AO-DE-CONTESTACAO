import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from App.database import init_db
from App.routes import contestacao, usuario


def parse_frontend_origins() -> list[str]:
    raw_value = os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [origin.strip().rstrip("/") for origin in raw_value.split(",") if origin.strip()]


app = FastAPI(
    title="API de Automacao de Contestacao",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_frontend_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contestacao.router, prefix="/api", tags=["Contestacao"])
app.include_router(usuario.router, prefix="/api", tags=["Usuarios"])


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "message": "Backend online"}


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "healthy"}
