-- PR19 - RAG de Jurisprudencia Externa (Fase 1)
-- Tabela complementar a `legislacao` (PR13 B3) mas pra DECISOES INDIVIDUAIS:
-- acordaos, repetitivos, IRRs, OJ-SDI. Sumulas continuam em `legislacao`.
-- Schema espelha `legislacao`: vetor 384d + texto_tsv GENERATED ALWAYS + indices.
-- Difere: tem numero_processo + relator + data_julgamento + peso_relevancia + fonte_url.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.jurisprudencia_externa (
  id BIGSERIAL PRIMARY KEY,
  tribunal TEXT NOT NULL,            -- 'STJ', 'STF', 'TST', 'TJ-PE', 'TJ-SP', ...
  tipo_decisao TEXT NOT NULL,        -- 'Repetitivo', 'IRR', 'Acordao', 'OJ-SDI'
  numero_processo TEXT NOT NULL,     -- 'REsp 1.234.567/SP', 'AgRg 9999/MG'
  relator TEXT,
  data_julgamento DATE,
  ementa TEXT NOT NULL,              -- resumo oficial - fonte primaria do RAG
  tese_firmada TEXT,                 -- 1 paragrafo destilado quando disponivel
  area_juridica TEXT,                -- usa AREAS_JURIDICAS_CANONICAS do backend
  peso_relevancia INT NOT NULL DEFAULT 5 CHECK (peso_relevancia BETWEEN 1 AND 10),
  fonte_url TEXT,                    -- URL oficial do acordao no portal do tribunal
  scraped_at TIMESTAMPTZ,            -- quando foi capturado pelo scraper
  embedding vector(384),
  texto_tsv tsvector GENERATED ALWAYS AS (
    to_tsvector('portuguese',
      coalesce(tribunal,'') || ' ' ||
      coalesce(numero_processo,'') || ' ' ||
      coalesce(ementa,'') || ' ' ||
      coalesce(tese_firmada,''))
  ) STORED,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tribunal, numero_processo)
);

CREATE INDEX IF NOT EXISTS idx_jurisprudencia_embedding_hnsw
  ON public.jurisprudencia_externa USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_jurisprudencia_texto_tsv
  ON public.jurisprudencia_externa USING GIN(texto_tsv);
CREATE INDEX IF NOT EXISTS idx_jurisprudencia_area
  ON public.jurisprudencia_externa(area_juridica)
  WHERE area_juridica IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jurisprudencia_data
  ON public.jurisprudencia_externa(data_julgamento DESC);

ALTER TABLE public.jurisprudencia_externa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_jurisprudencia" ON public.jurisprudencia_externa
  FOR SELECT TO anon, authenticated USING (true);

COMMENT ON TABLE public.jurisprudencia_externa IS
  'Acordaos e decisoes paradigmaticas de tribunais (STJ, STF, TST, TJ-*) coletados via scraper. Complementa public.legislacao (leis e sumulas) com decisoes individuais.';
