-- Adiciona disabled_at em gm_restaurant_members se não existir (evita 400 quando RLS ou PostgREST referenciam a coluna).
-- Executar no projeto Supabase após 20260310000000 (gm_restaurants opcionais) se as queries a gm_restaurant_members devolverem 400.

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
