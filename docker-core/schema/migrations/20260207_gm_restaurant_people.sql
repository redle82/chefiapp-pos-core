-- =============================================================================
-- gm_restaurant_people — Pessoas operacionais do restaurante (código/QR, AppStaff)
-- =============================================================================
-- Data: 2026-02-07
-- Objetivo: Tabela de pessoas operacionais (nome, função staff/manager, staff_code,
--           qr_token) para AppStaff (entrada por pessoa) e Configuração → Empregados.
-- Reader: merchant-portal RestaurantPeopleReader; UI: AppStaffLanding, RestaurantPeopleSection.
-- Distinto de gm_staff (waiter, kitchen, manager). FASE 3 Passo 1.
-- =============================================================================

-- 0. Função updated_at (idempotente; pode já existir noutras migrações)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Tabela gm_restaurant_people
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_restaurant_people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('staff', 'manager')),
    staff_code TEXT NOT NULL,
    qr_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, staff_code)
);

CREATE INDEX IF NOT EXISTS idx_gm_restaurant_people_restaurant_id ON public.gm_restaurant_people(restaurant_id);

-- 2. Trigger updated_at
-- =============================================================================
DROP TRIGGER IF EXISTS trigger_gm_restaurant_people_updated_at ON public.gm_restaurant_people;
CREATE TRIGGER trigger_gm_restaurant_people_updated_at
    BEFORE UPDATE ON public.gm_restaurant_people
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.gm_restaurant_people IS 'Pessoas operacionais do restaurante (nome, staff/manager, código/QR). Usado por AppStaff (entrada por pessoa) e Configuração → Empregados. Reader: RestaurantPeopleReader.';
