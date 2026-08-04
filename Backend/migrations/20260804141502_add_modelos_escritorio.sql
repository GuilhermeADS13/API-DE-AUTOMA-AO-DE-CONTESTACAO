-- Tabela de modelos (papel timbrado) do escritorio, reutilizaveis entre geracoes.
-- Ate agora o modelo era enviado por-contestacao (contestacoes.modelo_base_b64);
-- esta tabela guarda um "timbre padrao" por usuario, reaproveitado quando o
-- advogado nao sobe um modelo na hora.
CREATE TABLE IF NOT EXISTS public.modelos_escritorio (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id    text        NOT NULL,
  nome          text        NOT NULL,
  arquivo_b64   text        NOT NULL,
  is_default    boolean     NOT NULL DEFAULT false,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- No maximo um modelo default por usuario.
CREATE UNIQUE INDEX IF NOT EXISTS ux_modelos_default_por_usuario
  ON public.modelos_escritorio (usuario_id) WHERE is_default;
CREATE INDEX IF NOT EXISTS idx_modelos_usuario
  ON public.modelos_escritorio (usuario_id, atualizado_em DESC);

-- RLS: defesa em profundidade (o backend usa postgres e faz bypass; isto protege
-- acesso direto via PostgREST authenticated). auth.uid() envolto em (select ...).
ALTER TABLE public.modelos_escritorio ENABLE ROW LEVEL SECURITY;

CREATE POLICY owner_select ON public.modelos_escritorio
  FOR SELECT TO authenticated USING (((select auth.uid())::text = usuario_id));
CREATE POLICY owner_insert ON public.modelos_escritorio
  FOR INSERT TO authenticated WITH CHECK (((select auth.uid())::text = usuario_id));
CREATE POLICY owner_update ON public.modelos_escritorio
  FOR UPDATE TO authenticated USING (((select auth.uid())::text = usuario_id))
  WITH CHECK (((select auth.uid())::text = usuario_id));
CREATE POLICY owner_delete ON public.modelos_escritorio
  FOR DELETE TO authenticated USING (((select auth.uid())::text = usuario_id));
