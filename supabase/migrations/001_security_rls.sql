-- =====================================================================
-- 001_security_rls.sql  —  Endurecimento de Row Level Security
-- =====================================================================
-- Objetivo: garantir que a chave anon (NEXT_PUBLIC_SUPABASE_ANON_KEY)
-- presente no bundle JS NÃO possa ler/escrever dados de outros usuários
-- nem dados sensíveis do cache compartilhado.
--
-- Aplique manualmente em Supabase > SQL Editor (uma vez).
-- Idempotente: pode ser reaplicado sem efeitos colaterais.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Garante que RLS está habilitado em TODAS as tabelas de domínio.
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_packages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_cache     ENABLE ROW LEVEL SECURITY;

-- Bloqueia bypass por superuser na role anon (defesa em profundidade)
ALTER TABLE public.profiles         FORCE ROW LEVEL SECURITY;
ALTER TABLE public.conversations    FORCE ROW LEVEL SECURITY;
ALTER TABLE public.messages         FORCE ROW LEVEL SECURITY;
ALTER TABLE public.travel_packages  FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 2. search_cache — antes era "SELECT USING (true)" aberto a anon.
--    Agora só usuários autenticados podem ler/escrever o cache.
--    (O cache pode conter parâmetros de busca do usuário; tratar como
--     dado interno e não público.)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "search_cache: read all"                ON public.search_cache;
DROP POLICY IF EXISTS "search_cache: insert authenticated"    ON public.search_cache;
DROP POLICY IF EXISTS "search_cache: select authenticated"    ON public.search_cache;
DROP POLICY IF EXISTS "search_cache: write authenticated"     ON public.search_cache;

CREATE POLICY "search_cache: select authenticated"
  ON public.search_cache
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "search_cache: write authenticated"
  ON public.search_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "search_cache: update authenticated"
  ON public.search_cache
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- NÃO criamos política de DELETE: limpeza de cache deve usar
-- service_role (server-side) ou um job agendado com SECURITY DEFINER.

-- ---------------------------------------------------------------------
-- 3. passenger_leads — a tabela criada pelo gerador SQL em
--    src/app/dashboard/settings/page.tsx tinha policies
--    "INSERT WITH CHECK (true)" e "SELECT USING (true)", o que permite
--    a qualquer cliente com a chave anon ler TODOS os leads.
--    Aqui restringimos: SELECT só dono; INSERT só via API server.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'passenger_leads'
  ) THEN
    EXECUTE 'ALTER TABLE public.passenger_leads ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.passenger_leads FORCE  ROW LEVEL SECURITY';

    -- Remove policies antigas (abertas)
    EXECUTE 'DROP POLICY IF EXISTS "Service insert leads" ON public.passenger_leads';
    EXECUTE 'DROP POLICY IF EXISTS "Admin read leads"     ON public.passenger_leads';
    EXECUTE 'DROP POLICY IF EXISTS "leads: own data"      ON public.passenger_leads';
    EXECUTE 'DROP POLICY IF EXISTS "leads: insert self"   ON public.passenger_leads';

    -- Usuário autenticado só vê seus próprios leads
    EXECUTE $POL$
      CREATE POLICY "leads: own data"
        ON public.passenger_leads
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id)
    $POL$;

    -- Usuário autenticado só insere leads atribuídos a si próprio
    EXECUTE $POL$
      CREATE POLICY "leads: insert self"
        ON public.passenger_leads
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id)
    $POL$;
    -- (DELETE/UPDATE permanecem proibidos para anon e authenticated;
    --  faça via service_role no backend.)
  END IF;
END$$;

-- ---------------------------------------------------------------------
-- 4. Revoga qualquer GRANT residual da role anon nas tabelas de domínio.
--    RLS já protege, mas remover GRANT é cinto + suspensório.
-- ---------------------------------------------------------------------
REVOKE ALL ON public.profiles         FROM anon;
REVOKE ALL ON public.conversations    FROM anon;
REVOKE ALL ON public.messages         FROM anon;
REVOKE ALL ON public.travel_packages  FROM anon;
REVOKE ALL ON public.search_cache     FROM anon;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'passenger_leads') THEN
    EXECUTE 'REVOKE ALL ON public.passenger_leads FROM anon';
  END IF;
END$$;

-- ---------------------------------------------------------------------
-- NOTA: o schema atual NÃO usa o padrão "link_token" (compartilhamento
-- público de propostas via link). Caso isso seja adicionado no futuro,
-- a política sugerida é:
--
--   CREATE POLICY "propostas: anon by token"
--     ON public.propostas
--     FOR SELECT
--     TO anon
--     USING (
--       link_token IS NOT NULL
--       AND link_token = current_setting('request.headers', true)::json->>'x-link-token'
--     );
--
-- ---------------------------------------------------------------------
