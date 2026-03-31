# Ponto de entrada da API FastAPI com middlewares, rotas e healthchecks.
import os
from pathlib import Path

def load_env_file() -> None:
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue

        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        # Em desenvolvimento, garantimos que o .env do projeto tenha prioridade
        # para evitar variaveis antigas do sistema operacional.
        if key:
            os.environ[key] = value


load_env_file()

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from App.database import init_db, ping_database
from App.limiter import limiter
from App.routes import contestacao, suporte, usuario


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

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_frontend_origins(),
    # Necessario para trafegar cookie HTTPOnly de sessao entre front e backend.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contestacao.router, prefix="/api", tags=["Contestacao"])
app.include_router(usuario.router, prefix="/api", tags=["Usuarios"])
app.include_router(suporte.router, prefix="/api", tags=["Suporte"])


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "message": "Backend online"}


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "healthy"}


@app.get("/health/db")
def healthcheck_database() -> dict[str, str]:
    try:
        ping_database()
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Banco PostgreSQL indisponivel.",
        ) from error

    return {"status": "healthy", "database": "postgresql"}
