from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from App.database import (
    DatabaseIntegrityError,
    create_sessao_usuario,
    create_usuario,
    get_usuario_por_email,
    revoke_sessao,
)
from App.models.usuario import UsuarioCadastro, UsuarioLogin, UsuarioLogout
from App.services.auth_service import hash_password, verify_password

router = APIRouter()


@router.post("/usuarios/cadastro", status_code=status.HTTP_201_CREATED)
async def cadastrar_usuario(payload: UsuarioCadastro) -> dict:
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

    return {
        "status": "sucesso",
        "usuario": usuario,
        "token": token,
    }


@router.post("/usuarios/login")
async def login_usuario(payload: UsuarioLogin) -> dict:
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
async def logout_usuario(payload: UsuarioLogout) -> dict:
    revoke_sessao(payload.token)
    return {"status": "sucesso", "message": "Sessao encerrada."}
