# Rotas HTTP de autenticacao de usuario (cadastro, login, logout e sessao).
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from App.database import (
    DatabaseIntegrityError,
    create_sessao_usuario,
    create_usuario,
    get_usuario_por_email,
    revoke_sessao,
)
from App.models.usuario import UsuarioCadastro, UsuarioLogin, UsuarioLogout
from App.security import (
    apply_session_cookie,
    clear_session_cookie,
    extract_session_token,
    get_authenticated_user,
)
from App.services.auth_service import hash_password, verify_password

router = APIRouter()


@router.post("/usuarios/cadastro", status_code=status.HTTP_201_CREATED)
async def cadastrar_usuario(payload: UsuarioCadastro, response: Response) -> dict:
    existente = get_usuario_por_email(payload.email)
    if existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ja existe uma conta com este e-mail.",
        )

    user_id = f"USR-{uuid4().hex[:12].upper()}"
    senha_hash = hash_password(payload.senha)

    try:
        usuario = create_usuario(
            user_id=user_id,
            nome=payload.nome,
            email=payload.email,
            senha_hash=senha_hash,
        )
    except DatabaseIntegrityError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ja existe uma conta com este e-mail.",
        ) from error

    token = create_sessao_usuario(usuario["id"])
    apply_session_cookie(response, token)

    return {
        "status": "sucesso",
        "usuario": usuario,
        "token": token,
    }


@router.post("/usuarios/login")
async def login_usuario(payload: UsuarioLogin, response: Response) -> dict:
    usuario = get_usuario_por_email(payload.email)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais invalidas.",
        )

    senha_ok = verify_password(payload.senha, usuario["senha_hash"])
    if not senha_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais invalidas.",
        )

    token = create_sessao_usuario(usuario["id"])
    apply_session_cookie(response, token)

    return {
        "status": "sucesso",
        "usuario": {
            "id": usuario["id"],
            "nome": usuario["nome"],
            "email": usuario["email"],
        },
        "token": token,
    }


@router.post("/usuarios/logout")
async def logout_usuario(
    request: Request,
    response: Response,
    payload: UsuarioLogout | None = None,
) -> dict:
    header_token = extract_session_token(request, request.headers.get("authorization"))
    token = (payload.token if payload else None) or header_token

    if token:
        revoke_sessao(token)

    clear_session_cookie(response)

    return {"status": "sucesso", "message": "Sessao encerrada."}


@router.get("/usuarios/sessao")
async def obter_sessao(usuario: dict[str, str] = Depends(get_authenticated_user)) -> dict:
    """Retorna dados basicos da sessao autenticada."""
    return {
        "status": "sucesso",
        "usuario": {
            "id": usuario["id"],
            "nome": usuario["nome"],
            "email": usuario["email"],
        },
    }
