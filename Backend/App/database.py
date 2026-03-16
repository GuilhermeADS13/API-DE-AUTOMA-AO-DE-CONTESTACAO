# pyright: reportMissingModuleSource=false

import os
from typing import Any
from uuid import uuid4

import psycopg2
from psycopg2.extras import Json

DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/contestacao_db"


def _get_database_url() -> str:
    database_url = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL).strip()
    if not database_url:
        return DEFAULT_DATABASE_URL
    return database_url


def _connect():
    return psycopg2.connect(_get_database_url(), connect_timeout=5)


def init_db() -> None:
    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS usuarios (
                    id TEXT PRIMARY KEY,
                    nome TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    senha_hash TEXT NOT NULL,
                    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS usuarios_sessoes (
                    token TEXT PRIMARY KEY,
                    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS contestacoes (
                    id BIGSERIAL PRIMARY KEY,
                    numero_processo TEXT NOT NULL,
                    autor TEXT NOT NULL,
                    reu TEXT,
                    tipo_acao TEXT NOT NULL,
                    fatos TEXT NOT NULL,
                    pedido_autor TEXT NOT NULL,
                    arquivo_base TEXT,
                    texto_editado_ao_vivo TEXT,
                    status TEXT NOT NULL,
                    n8n_resposta JSONB,
                    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
        connection.commit()


def create_usuario(user_id: str, nome: str, email: str, senha_hash: str) -> dict[str, str]:
    init_db()

    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO usuarios (id, nome, email, senha_hash)
                VALUES (%s, %s, %s, %s)
                RETURNING id, nome, email
                """,
                (user_id, nome, email, senha_hash),
            )
            row = cursor.fetchone()
            if row is None:
                raise RuntimeError("Falha ao criar usuario no banco de dados.")
        connection.commit()

    return {
        "id": str(row[0]),
        "nome": str(row[1]),
        "email": str(row[2]),
    }


def get_usuario_por_email(email: str) -> dict[str, str] | None:
    init_db()

    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, nome, email, senha_hash
                FROM usuarios
                WHERE email = %s
                LIMIT 1
                """,
                (email,),
            )
            row = cursor.fetchone()

    if row is None:
        return None

    return {
        "id": str(row[0]),
        "nome": str(row[1]),
        "email": str(row[2]),
        "senha_hash": str(row[3]),
    }


def create_sessao_usuario(usuario_id: str) -> str:
    init_db()
    token = uuid4().hex

    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO usuarios_sessoes (token, usuario_id)
                VALUES (%s, %s)
                """,
                (token, usuario_id),
            )
        connection.commit()

    return token


def revoke_sessao(token: str) -> bool:
    init_db()

    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                DELETE FROM usuarios_sessoes
                WHERE token = %s
                RETURNING token
                """,
                (token,),
            )
            row = cursor.fetchone()
        connection.commit()

    return row is not None


def save_contestacao(payload: dict[str, Any], status: str, n8n_resposta: Any) -> int:
    init_db()

    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO contestacoes (
                    numero_processo,
                    autor,
                    reu,
                    tipo_acao,
                    fatos,
                    pedido_autor,
                    arquivo_base,
                    texto_editado_ao_vivo,
                    status,
                    n8n_resposta
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    str(payload.get("numero_processo", "")),
                    str(payload.get("autor", "")),
                    str(payload.get("reu", "")),
                    str(payload.get("tipo_acao", "")),
                    str(payload.get("fatos", "")),
                    str(payload.get("pedido_autor", "")),
                    str(payload.get("arquivo_base", "")),
                    str(payload.get("texto_editado_ao_vivo", "")),
                    status,
                    Json(n8n_resposta),
                ),
            )
            row = cursor.fetchone()
            if row is None:
                raise RuntimeError("Falha ao salvar contestacao no banco de dados.")
            inserted_id = row[0]
        connection.commit()
        return int(inserted_id)
