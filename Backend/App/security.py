"""Utilitarios de autenticacao/sessao para rotas FastAPI."""

import os

from fastapi import Header, HTTPException, Request, Response, status

from App.database import get_sessao_ativa

# Nome do cookie de sessao enviado ao navegador.
SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "contestacao_session")

# Configuracoes para endurecer sessao em producao sem quebrar ambiente local.
SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "lax").lower()
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").strip().lower() == "true"


def _extract_bearer_token(authorization: str | None) -> str | None:
    """Extrai token de um header Authorization no formato Bearer."""
    if not authorization:
        return None

    raw_value = authorization.strip()
    if not raw_value.lower().startswith("bearer "):
        return None
    token = raw_value[7:].strip()
    return token or None


def extract_session_token(request: Request, authorization: str | None) -> str | None:
    """Prioriza Bearer token; fallback para cookie HTTPOnly de sessao."""
    bearer_token = _extract_bearer_token(authorization)
    if bearer_token:
        return bearer_token

    cookie_token = request.cookies.get(SESSION_COOKIE_NAME, "").strip()
    return cookie_token or None


def apply_session_cookie(response: Response, token: str) -> None:
    """Aplica cookie de sessao no response de login/cadastro."""
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=SESSION_COOKIE_SECURE,
        samesite=SESSION_COOKIE_SAMESITE,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    """Remove cookie de sessao no logout."""
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
    )


async def get_authenticated_user(
    request: Request,
    authorization: str | None = Header(default=None),
) -> dict[str, str]:
    """Dependencia FastAPI para bloquear rotas sem sessao valida."""
    token = extract_session_token(request, authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticacao obrigatoria para este endpoint.",
        )

    session = get_sessao_ativa(token)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessao invalida ou expirada. Faca login novamente.",
        )

    return session
