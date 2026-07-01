-- PR24 - Alinhamento com spec "RAG com Jurisprudencia Nacional".
-- Adiciona coluna opcional `texto_integral` na tabela `jurisprudencia_externa`.
--
-- Motivacao:
--   Sistema atual (PR19-PR23) usa APENAS `ementa` + `tese_firmada` como fonte
--   primaria do RAG. Embedding 384d fica sobre a ementa (destilada, densa em
--   sinal juridico). Texto integral do acordao (20-100 KB) NAO entra no
--   embedding — foi decisao consciente pra manter latencia baixa e evitar
--   diluicao do sinal semantico com fundamentacao redundante.
--
--   Nova coluna serve pra:
--     1. Consulta humana no admin (advogado quer ler o acordao completo antes
--        de aprovar como paradigma)
--     2. Fase B futura: se implementarmos reranker cross-encoder
--        (bge-reranker-v2-m3), ele pode operar sobre chunks do texto integral
--        pra re-ordenar top-10 do RAG com muito mais precisao.
--
--   Campo eh NULL por default — se ninguem preencher, custo de storage e zero.
--
-- Sem impacto no RAG atual:
--   - `texto_tsv` GENERATED ALWAYS continua incluindo so ementa + tese_firmada
--   - Embedding continua sendo gerado sobre ementa (routes/jurisprudencia_admin.py)
--   - buscar_jurisprudencia_* NAO le a nova coluna

ALTER TABLE public.jurisprudencia_externa
  ADD COLUMN IF NOT EXISTS texto_integral TEXT;

COMMENT ON COLUMN public.jurisprudencia_externa.texto_integral IS
  'Texto completo do acordao (~20-100 KB). Opcional. Nao entra no embedding do RAG — so pra consulta humana + reranker futuro (PR24, alinhamento com spec de Jurisprudencia Nacional).';
