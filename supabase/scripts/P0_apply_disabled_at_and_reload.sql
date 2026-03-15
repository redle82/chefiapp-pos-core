-- =============================================================================
-- P0: Aplicar disabled_at em gm_restaurants e gm_restaurant_members + NOTIFY
-- Executar no SQL Editor do Supabase Dashboard.
-- Corresponde ao mínimo das migrações 20260310000000 e 20260310100000 para
-- eliminar os 400 "column disabled_at does not exist".
-- =============================================================================

-- 1. gm_restaurants.disabled_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'disabled_at'
  ) THEN
    ALTER TABLE public.gm_restaurants ADD COLUMN disabled_at timestamptz;
  END IF;
END $$;

-- 2. gm_restaurant_members.disabled_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gm_restaurant_members' AND column_name = 'disabled_at'
  ) THEN
    ALTER TABLE public.gm_restaurant_members ADD COLUMN disabled_at timestamptz;
    COMMENT ON COLUMN public.gm_restaurant_members.disabled_at IS 'Quando preenchido, o membro deixa de ter acesso (RLS/helpers consideram apenas disabled_at IS NULL).';
  END IF;
END $$;

-- 3. Recarregar schema do PostgREST
NOTIFY pgrst, 'reload schema';
