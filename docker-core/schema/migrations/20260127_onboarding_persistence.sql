-- =============================================================================
-- ONBOARDING PERSISTENCE - Colunas e Tabelas para Salvar Dados do Onboarding
-- =============================================================================
-- Data: 2026-01-27
-- Objetivo: Adicionar colunas faltantes em gm_restaurants e criar tabelas
--           necessárias para persistir dados do onboarding
-- =============================================================================

-- =============================================================================
-- 1. ADICIONAR COLUNAS EM gm_restaurants
-- =============================================================================

-- Colunas de Identidade
ALTER TABLE public.gm_restaurants 
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'pt-BR';

-- Colunas de Localização
ALTER TABLE public.gm_restaurants 
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS capacity INTEGER,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Comentários
COMMENT ON COLUMN public.gm_restaurants.type IS 'Tipo de estabelecimento: RESTAURANT, BAR, HOTEL, BEACH_CLUB, CAFE, OTHER';
COMMENT ON COLUMN public.gm_restaurants.timezone IS 'Fuso horário (ex: America/Sao_Paulo, Europe/Madrid)';
COMMENT ON COLUMN public.gm_restaurants.currency IS 'Moeda (BRL, EUR, USD)';
COMMENT ON COLUMN public.gm_restaurants.locale IS 'Idioma (pt-BR, es-ES, en-US)';
COMMENT ON COLUMN public.gm_restaurants.capacity IS 'Capacidade total de clientes';

-- =============================================================================
-- 2. TABELA DE HORÁRIOS DE FUNCIONAMENTO
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.restaurant_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = domingo, 6 = sábado
  open BOOLEAN NOT NULL DEFAULT true,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_schedules_restaurant ON public.restaurant_schedules(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_schedules_day ON public.restaurant_schedules(restaurant_id, day_of_week);

COMMENT ON TABLE public.restaurant_schedules IS 'Horários de funcionamento do restaurante por dia da semana';
COMMENT ON COLUMN public.restaurant_schedules.day_of_week IS '0 = domingo, 1 = segunda, ..., 6 = sábado';

-- =============================================================================
-- 3. TABELA DE STATUS DO ONBOARDING (para rastrear progresso)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.restaurant_setup_status (
  restaurant_id UUID PRIMARY KEY REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  sections JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_setup_status_restaurant ON public.restaurant_setup_status(restaurant_id);

COMMENT ON TABLE public.restaurant_setup_status IS 'Status do onboarding por seção (para rastrear progresso)';

-- =============================================================================
-- 4. TABELA DE ZONAS (se não existir)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.restaurant_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BAR', 'SALON', 'KITCHEN', 'TERRACE', 'OTHER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(restaurant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_zones_restaurant ON public.restaurant_zones(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_zones_type ON public.restaurant_zones(restaurant_id, type);

COMMENT ON TABLE public.restaurant_zones IS 'Zonas operacionais do restaurante (BAR, SALON, KITCHEN, TERRACE)';

-- =============================================================================
-- 5. FUNÇÃO HELPER: Criar mesas automaticamente baseado na capacidade
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_tables_from_capacity(
  p_restaurant_id UUID,
  p_capacity INTEGER,
  p_tables_per_zone INTEGER DEFAULT 5
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_tables_created INTEGER := 0;
  v_table_number INTEGER;
  v_zone_id UUID;
BEGIN
  -- Verificar se já existem mesas
  IF EXISTS (SELECT 1 FROM public.gm_tables WHERE restaurant_id = p_restaurant_id) THEN
    RETURN 0; -- Já existem mesas, não criar
  END IF;

  -- Criar mesas baseado na capacidade (assumindo 4 pessoas por mesa)
  FOR v_table_number IN 1..(p_capacity / 4) LOOP
    INSERT INTO public.gm_tables (restaurant_id, number, status)
    VALUES (p_restaurant_id, v_table_number, 'closed')
    ON CONFLICT (restaurant_id, number) DO NOTHING;
    
    v_tables_created := v_tables_created + 1;
  END LOOP;

  RETURN v_tables_created;
END;
$$;

COMMENT ON FUNCTION public.create_tables_from_capacity IS 'Cria mesas automaticamente baseado na capacidade do restaurante';
