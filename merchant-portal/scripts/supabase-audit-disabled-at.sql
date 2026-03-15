-- =============================================================================
-- Auditoria: objetos que referenciam gm_restaurants / gm_restaurant_members ou disabled_at
-- Executar no SQL Editor do Supabase Dashboard (projeto em uso).
-- Objetivo: encontrar a origem dos 400 em:
--   - gm_restaurant_members?select=restaurant_id&limit=1
--   - gm_restaurants?select=id&limit=1  (erro conhecido: column "disabled_at" does not exist)
--
-- Antes de correr: no browser (Network), capturar o body da resposta 400 do request
-- a gm_restaurant_members (Response/Preview) para confirmar a mensagem exata.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A. gm_restaurants
-- -----------------------------------------------------------------------------
-- A1. Políticas RLS em gm_restaurants (qualquer USING/WITH CHECK com disabled_at causa 400 se a coluna não existir)
SELECT 'A1. RLS gm_restaurants' AS section;
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'gm_restaurants';

-- A2. Colunas atuais de gm_restaurants (confirmar se disabled_at existe)
SELECT 'A2. Colunas gm_restaurants' AS section;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'gm_restaurants'
ORDER BY ordinal_position;

-- A3. Views que referenciam gm_restaurants
SELECT 'A3. Views gm_restaurants' AS section;
SELECT c.relname AS view_name,
       pg_get_viewdef(c.oid, true) AS definition
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
  AND n.nspname = 'public'
  AND pg_get_viewdef(c.oid, true) ILIKE '%gm_restaurants%';

-- A4. Funções que referenciam gm_restaurants e disabled_at
SELECT 'A4. Funções gm_restaurants+disabled_at' AS section;
SELECT p.proname AS function_name,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ILIKE '%gm_restaurants%'
  AND pg_get_functiondef(p.oid) ILIKE '%disabled_at%';

-- A5. Triggers em gm_restaurants
SELECT 'A5. Triggers gm_restaurants' AS section;
SELECT tgname, pg_get_triggerdef(oid, true)
FROM pg_trigger
WHERE tgrelid = 'public.gm_restaurants'::regclass;

-- -----------------------------------------------------------------------------
-- B. gm_restaurant_members
-- -----------------------------------------------------------------------------
-- B1. Políticas RLS em gm_restaurant_members (subquery a gm_restaurants pode falhar por disabled_at)
SELECT 'B1. RLS gm_restaurant_members' AS section;
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'gm_restaurant_members';

-- B2. Colunas atuais de gm_restaurant_members (confirmar se disabled_at existe)
SELECT 'B2. Colunas gm_restaurant_members' AS section;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'gm_restaurant_members'
ORDER BY ordinal_position;

-- B3. Views que referenciam gm_restaurant_members
SELECT 'B3. Views gm_restaurant_members' AS section;
SELECT c.relname AS view_name,
       pg_get_viewdef(c.oid, true) AS definition
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
  AND n.nspname = 'public'
  AND pg_get_viewdef(c.oid, true) ILIKE '%gm_restaurant_members%';

-- B4. Funções que referenciam gm_restaurant_members e disabled_at
SELECT 'B4. Funções gm_restaurant_members+disabled_at' AS section;
SELECT p.proname AS function_name,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (
    (pg_get_functiondef(p.oid) ILIKE '%gm_restaurant_members%' AND pg_get_functiondef(p.oid) ILIKE '%disabled_at%')
    OR (pg_get_functiondef(p.oid) ILIKE '%gm_restaurants%' AND pg_get_functiondef(p.oid) ILIKE '%disabled_at%')
  );

-- B5. Triggers em gm_restaurant_members
SELECT 'B5. Triggers gm_restaurant_members' AS section;
SELECT tgname, pg_get_triggerdef(oid, true)
FROM pg_trigger
WHERE tgrelid = 'public.gm_restaurant_members'::regclass;

-- -----------------------------------------------------------------------------
-- C. Qualquer objeto que mencione disabled_at (busca ampla)
-- -----------------------------------------------------------------------------
SELECT 'C. Qualquer policy com disabled_at' AS section;
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE qual::text ILIKE '%disabled_at%' OR with_check::text ILIKE '%disabled_at%';
