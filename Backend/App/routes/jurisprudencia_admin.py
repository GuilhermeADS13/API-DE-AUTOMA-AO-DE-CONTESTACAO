"""Rota POST /api/admin/jurisprudencia/criar - cadastro manual de paradigma (PR22).

Usada pela UI admin "Adicionar Jurisprudencia" pra advogado autorizado adicionar
acordaos paradigma encontrados no Migalhas/Conjur/JusBrasil sem editar SQL.
Crescimento organico da base — complementa o seed JSON (~30 acordaos curados,
ingest via `scripts/ingest_seed_jurisprudencia.py`).

Auth: get_authenticated_user + _is_admin() (reusa helper de feedback.py).
Aceita usuario humano cujo email esta em ADMIN_EMAILS OU pseudo-user
backend_admin_token (chamadas internas n8n).

Idempotente por design — upsert da tabela faz match por
(tribunal, numero_processo) UNIQUE. Re-submissao do mesmo acordao atualiza
campos sem duplicar.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status

from App.limiter import limiter
from App.models.jurisprudencia_manual import JurisprudenciaManual
from App.routes.feedback import _is_admin
from App.security import get_authenticated_user
from App.services.embedding_service import gerar_embedding

logger = logging.getLogger(__name__)
router = APIRouter()


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
    if not _is_admin(usuario):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores (ADMIN_EMAILS).",
        )

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
