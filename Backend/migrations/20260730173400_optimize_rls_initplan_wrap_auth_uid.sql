-- Performance: envolve auth.uid() em (select auth.uid()) nas RLS policies.
-- Detectado pelo advisor de performance do Supabase (lint auth_rls_initplan).
--
-- Sem o wrap, o Postgres re-avalia auth.uid() UMA VEZ POR LINHA na policy;
-- com (select auth.uid()) ele avalia uma unica vez por query (InitPlan/scalar
-- subquery). Semanticamente IDENTICO — mesmo dono, mesma comparacao — so mais
-- rapido em escala. Ref:
--   https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- Aplicado via ALTER POLICY (preserva nome/comando/roles; troca so a expressao).
-- Idempotente-ish: reexecutar apenas reaplica a mesma expressao.

-- ── contestacoes (owner = auth.uid()::text = usuario_id) ────────────────────
ALTER POLICY owner_select ON public.contestacoes
  USING (((select auth.uid())::text = usuario_id));
ALTER POLICY owner_insert ON public.contestacoes
  WITH CHECK (((select auth.uid())::text = usuario_id));
ALTER POLICY owner_update ON public.contestacoes
  USING (((select auth.uid())::text = usuario_id))
  WITH CHECK (((select auth.uid())::text = usuario_id));
ALTER POLICY owner_delete ON public.contestacoes
  USING (((select auth.uid())::text = usuario_id));

-- ── usuarios (self = auth.uid()::text = id) ─────────────────────────────────
ALTER POLICY self_select ON public.usuarios
  USING (((select auth.uid())::text = id));
ALTER POLICY self_update ON public.usuarios
  USING (((select auth.uid())::text = id))
  WITH CHECK (((select auth.uid())::text = id));

-- ── usuarios_sessoes (owner = auth.uid()::text = usuario_id) ────────────────
ALTER POLICY owner_select ON public.usuarios_sessoes
  USING (((select auth.uid())::text = usuario_id));
ALTER POLICY owner_delete ON public.usuarios_sessoes
  USING (((select auth.uid())::text = usuario_id));
