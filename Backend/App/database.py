import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / "app.db"
DB_PATH = Path(os.getenv("DATABASE_PATH", str(DEFAULT_DB_PATH)))


def init_database() -> None:
    """Inicializa estrutura minima para historico de contestações."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS contestacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                processo TEXT NOT NULL,
                cliente TEXT NOT NULL,
                tipo_acao TEXT NOT NULL,
                tese TEXT NOT NULL,
                observacoes TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Em analise',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
