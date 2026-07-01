"""Rotas admin de jurisprudencia_externa (PR22 + PR23).

PR22: POST /api/admin/jurisprudencia/criar — cadastro manual de paradigma.
PR23: GET /listar, GET /{id}, PATCH /{id}, DELETE /{id} — CRUD completo.

Auth: get_authenticated_user + _is_admin() (reusa helper de feedback.py).
Aceita usuario humano cujo email esta em ADMIN_EMAILS OU pseudo-user
backend_admin_token (chamadas internas n8n).

Idempotencia do POST: upsert da tabela faz match por
(tribunal, numero_processo) UNIQUE. Re-submissao do mesmo acordao atualiza
campos sem duplicar.

CRUD do PR23 trabalha por `id` (BIGSERIAL) — separado da chave de negocio.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from App.limiter import limiter
from App.models.jurisprudencia_manual import JurisprudenciaManual
from App.routes.feedback import _is_admin
from App.security import get_authenticated_user
from App.services.embedding_service import gerar_embedding

logger = logging.getLogger(__name__)
router = APIRouter()


def _exige_admin(usuario: dict) -> None:
    """Raise 403 quando usuario nao esta em ADMIN_EMAILS / nao eh backend_admin_token."""
    if not _is_admin(usuario):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores (ADMIN_EMAILS).",
        )


@router.post("/admin/jurisprudencia/criar", status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def criar_jurisprudencia(
    request: Request,
    payload: JurisprudenciaManual,
    usuario: dict[str, str] = Depends(get_authenticated_user),
) -> dict:
    """Cadastra ou atualiza acordao paradigma em public.jurisprudencia_externa.

    Validacao Pydantic em `JurisprudenciaManual`:
      - tribunal, numero_processo, ementa obrigatorios + strip
      - peso_relevancia 1-10
      - data_julgamento opcional, mas se vier deve ser ISO 'YYYY-MM-DD'

    Embedding 384d local (sentence-transformers) gerado sobre
    `numero_processo + tese_firmada + ementa` — mesma estrategia do
    `scripts/ingest_seed_jurisprudencia.py` e do scraper STJ.

    Retorna 201 com {status, tribunal, numero_processo, embedding_gerado}.
    Falha de embedding NAO bloqueia o upsert (busca lexical continua
    funcionando mesmo sem vetor) — so loga warning.
    """
    _exige_admin(usuario)

    # Import tardio: upsert_jurisprudencia toca o pool de conexoes do DB
    # so quando a rota e exercida. Evita inicializar pool no boot dos testes
    # que mockam tudo.
    from App.database import upsert_jurisprudencia

    texto_pra_embed = " ".join(filter(None, [
        payload.numero_processo,
        payload.tese_firmada or "",
        payload.ementa,
    ]))
    embedding = gerar_embedding(texto_pra_embed)
    if embedding is None:
        logger.warning(
            "Cadastro manual sem embedding (provider local indisponivel?): %s %s",
            payload.tribunal, payload.numero_processo,
        )

    try:
        upsert_jurisprudencia(
            tribunal=payload.tribunal,
            numero_processo=payload.numero_processo,
            ementa=payload.ementa,
            tipo_decisao=payload.tipo_decisao,
            relator=payload.relator,
            data_julgamento=payload.data_julgamento,
            tese_firmada=payload.tese_firmada,
            area_juridica=payload.area_juridica,
            peso_relevancia=payload.peso_relevancia,
            fonte_url=payload.fonte_url,
            embedding=embedding,
            texto_integral=payload.texto_integral,
        )
    except Exception as err:
        logger.error(
            "Falha upsert jurisprudencia manual %s %s: %s",
            payload.tribunal, payload.numero_processo, err,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao salvar no banco. Confira logs do backend.",
        ) from err

    logger.info(
        "Jurisprudencia paradigma cadastrada: %s %s por %s",
        payload.tribunal, payload.numero_processo, usuario.get("email", "?"),
    )

    return {
        "status": "ok",
        "tribunal": payload.tribunal,
        "numero_processo": payload.numero_processo,
        "peso_relevancia": payload.peso_relevancia,
        "embedding_gerado": embedding is not None,
        "mensagem": (
            f"{payload.tribunal} {payload.numero_processo} cadastrado/atualizado "
            f"em jurisprudencia_externa."
        ),
    }


# ─────────────────────────────────────────────────────────────────────────────
# PR23 — CRUD (List, Get, Update, Delete)
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/admin/jurisprudencia/listar")
@limiter.limit("60/minute")
async def listar(
    request: Request,
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    tribunal: str | None = Query(default=None, max_length=20),
    area_juridica: str | None = Query(default=None, max_length=40),
    busca: str | None = Query(
        default=None, max_length=200,
        description="ILIKE em numero_processo OU ementa OU relator",
    ),
    usuario: dict[str, str] = Depends(get_authenticated_user),
) -> dict:
    """Lista paginada de jurisprudencia (admin)."""
    _exige_admin(usuario)
    from App.database import listar_jurisprudencia

    try:
        return listar_jurisprudencia(
            limit=limit, offset=offset, tribunal=tribunal,
            area_juridica=area_juridica, busca=busca,
        )
    except Exception as err:
        logger.error("Falha ao listar jurisprudencia: %s", err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao listar. Confira logs do backend.",
        ) from err


@router.get("/admin/jurisprudencia/{jurisprudencia_id}")
@limiter.limit("60/minute")
async def obter(
    request: Request,
    jurisprudencia_id: int,
    usuario: dict[str, str] = Depends(get_authenticated_user),
) -> dict:
    """Retorna 1 jurisprudencia por id, ou 404."""
    _exige_admin(usuario)
    from App.database import obter_jurisprudencia

    item = obter_jurisprudencia(jurisprudencia_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Jurisprudencia id={jurisprudencia_id} nao encontrada.",
        )
    return item


@router.patch("/admin/jurisprudencia/{jurisprudencia_id}")
@limiter.limit("30/minute")
async def atualizar(
    request: Request,
    jurisprudencia_id: int,
    payload: JurisprudenciaManual,
    usuario: dict[str, str] = Depends(get_authenticated_user),
) -> dict:
    """Atualiza uma jurisprudencia. Payload completo (Pydantic) — recalcula embedding."""
    _exige_admin(usuario)
    from App.database import atualizar_jurisprudencia, obter_jurisprudencia

    # Verifica existencia antes de gerar embedding (evita custo desnecessario)
    if not obter_jurisprudencia(jurisprudencia_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Jurisprudencia id={jurisprudencia_id} nao encontrada.",
        )

    texto_pra_embed = " ".join(filter(None, [
        payload.numero_processo,
        payload.tese_firmada or "",
        payload.ementa,
    ]))
    embedding = gerar_embedding(texto_pra_embed)

    try:
        atualizou = atualizar_jurisprudencia(
            jurisprudencia_id,
            campos={
                "tribunal": payload.tribunal,
                "tipo_decisao": payload.tipo_decisao,
                "numero_processo": payload.numero_processo,
                "relator": payload.relator,
                "data_julgamento": payload.data_julgamento,
                "ementa": payload.ementa,
                "tese_firmada": payload.tese_firmada,
                "area_juridica": payload.area_juridica,
                "peso_relevancia": payload.peso_relevancia,
                "fonte_url": payload.fonte_url,
                "texto_integral": payload.texto_integral,
            },
            embedding=embedding,
        )
    except Exception as err:
        logger.error(
            "Falha update jurisprudencia id=%s: %s", jurisprudencia_id, err
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar no banco. Confira logs do backend.",
        ) from err

    if not atualizou:
        # Race: existia no obter mas sumiu antes do update. Trata como 404.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Jurisprudencia id={jurisprudencia_id} nao encontrada (race).",
        )

    logger.info(
        "Jurisprudencia paradigma atualizada: id=%s %s %s por %s",
        jurisprudencia_id, payload.tribunal, payload.numero_processo,
        usuario.get("email", "?"),
    )
    return {
        "status": "ok",
        "id": jurisprudencia_id,
        "tribunal": payload.tribunal,
        "numero_processo": payload.numero_processo,
        "embedding_gerado": embedding is not None,
        "mensagem": (
            f"id={jurisprudencia_id} ({payload.tribunal} {payload.numero_processo}) atualizada."
        ),
    }


@router.delete(
    "/admin/jurisprudencia/{jurisprudencia_id}",
    status_code=status.HTTP_200_OK,
)
@limiter.limit("30/minute")
async def deletar(
    request: Request,
    jurisprudencia_id: int,
    usuario: dict[str, str] = Depends(get_authenticated_user),
) -> dict:
    """Remove jurisprudencia por id. 404 se nao existia."""
    _exige_admin(usuario)
    from App.database import deletar_jurisprudencia

    try:
        removeu = deletar_jurisprudencia(jurisprudencia_id)
    except Exception as err:
        logger.error(
            "Falha delete jurisprudencia id=%s: %s", jurisprudencia_id, err
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao remover no banco. Confira logs do backend.",
        ) from err

    if not removeu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Jurisprudencia id={jurisprudencia_id} nao encontrada.",
        )

    logger.info(
        "Jurisprudencia paradigma removida: id=%s por %s",
        jurisprudencia_id, usuario.get("email", "?"),
    )
    return {
        "status": "ok",
        "id": jurisprudencia_id,
        "mensagem": f"id={jurisprudencia_id} removida com sucesso.",
    }
