# pyright: reportMissingModuleSource=false

import os
from typing import Any
from urllib.parse import quote_plus
from uuid import uuid4

try:
    import psycopg2
    from psycopg2.extras import Json as PGJsonAdapter
except ModuleNotFoundError:
    psycopg2 = None
    PGJsonAdapter = None

DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/contestacao_db"
DEFAULT_DATABASE_HOST = "localhost"
DEFAULT_DATABASE_PORT = 5432
DEFAULT_DATABASE_NAME = "contestacao_db"
DEFAULT_DATABASE_USER = "postgres"
DEFAULT_DATABASE_PASSWORD = "postgres"
DEFAULT_DATABASE_SSLMODE = "prefer"
DEFAULT_DATABASE_CONNECT_TIMEOUT = 5


class DatabaseIntegrityError(Exception):
    pass


def _safe_int(value: str, fallback: int) -> int:
    try:
        parsed = int(value)
        return parsed if parsed > 0 else fallback
    except (TypeError, ValueError):
        return fallback


def _build_database_url_from_parts() -> str:
    host = os.getenv("DATABASE_HOST", DEFAULT_DATABASE_HOST).strip() or DEFAULT_DATABASE_HOST
    port = _safe_int(os.getenv("DATABASE_PORT", str(DEFAULT_DATABASE_PORT)), DEFAULT_DATABASE_PORT)
    name = os.getenv("DATABASE_NAME", DEFAULT_DATABASE_NAME).strip() or DEFAULT_DATABASE_NAME
    user = os.getenv("DATABASE_USER", DEFAULT_DATABASE_USER).strip() or DEFAULT_DATABASE_USER
    password = os.getenv("DATABASE_PASSWORD", DEFAULT_DATABASE_PASSWORD).strip()
    sslmode = os.getenv("DATABASE_SSLMODE", DEFAULT_DATABASE_SSLMODE).strip() or DEFAULT_DATABASE_SSLMODE

    return (
        f"postgresql://{quote_plus(user)}:{quote_plus(password)}@{host}:{port}/"
        f"{quote_plus(name)}?sslmode={sslmode}"
    )


def _normalize_database_url(database_url: str) -> str:
    value = database_url.strip()
    if value.startswith("postgres://"):
        return "postgresql://" + value[len("postgres://") :]
    return value


def _mask_database_url(database_url: str) -> str:
    if "://" not in database_url or "@" not in database_url:
        return database_url

    scheme, rest = database_url.split("://", 1)
    auth_part, host_part = rest.split("@", 1)
    username = auth_part.split(":", 1)[0]
    if username:
        return f"{scheme}://{username}:***@{host_part}"
    return f"{scheme}://***@{host_part}"


def _get_database_url() -> str:
    raw_database_url = os.getenv("DATABASE_URL", "").strip()
    if raw_database_url:
        return _normalize_database_url(raw_database_url)
    return _build_database_url_from_parts()


def _connect():
    if psycopg2 is None:
        raise RuntimeError(
            "Driver PostgreSQL nao encontrado. Instale `psycopg2-binary` no ambiente do backend."
        )

    database_url = _get_database_url()
    timeout = _safe_int(
        os.getenv("DATABASE_CONNECT_TIMEOUT", str(DEFAULT_DATABASE_CONNECT_TIMEOUT)),
        DEFAULT_DATABASE_CONNECT_TIMEOUT,
    )

    try:
        return psycopg2.connect(database_url, connect_timeout=timeout)
    except Exception as error:
        if isinstance(error, psycopg2.OperationalError):
            raise RuntimeError(
                "Nao foi possivel conectar ao PostgreSQL. "
                f"Verifique as variaveis do banco ({_mask_database_url(database_url)})."
            ) from error
        raise


def ping_database() -> None:
    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            row = cursor.fetchone()
            if row is None or int(row[0]) != 1:
                raise RuntimeError("Falha no teste de conexao com PostgreSQL.")


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
            try:
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
            except Exception as error:
                if psycopg2 is not None and isinstance(error, psycopg2.IntegrityError):
                    raise DatabaseIntegrityError("Conflito de integridade no banco.") from error
                raise
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
                    PGJsonAdapter(n8n_resposta) if PGJsonAdapter else n8n_resposta,
                ),
            )
            row = cursor.fetchone()
            if row is None:
                raise RuntimeError("Falha ao salvar contestacao no banco de dados.")
            inserted_id = row[0]
        connection.commit()
        return int(inserted_id)
