-- =============================================================================
-- RESTAURANT MAP - Migration: Mapa do Restaurante
-- =============================================================================
-- Data: 2026-01-26
-- Objetivo: Mapa do restaurante como contexto operacional (zonas, mesas)
-- =============================================================================

-- =============================================================================
-- 1. ZONES (Zonas do Restaurante)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_restaurant_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  code TEXT NOT NULL, -- 'BAR', 'KITCHEN', 'PASS', 'SERVICE', 'CASHIER', etc
  name TEXT NOT NULL, -- Nome amigável
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(restaurant_id, code)
);

-- =============================================================================
-- 2. TABLES (Mesas)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES public.gm_restaurant_zones(id) ON DELETE SET NULL,
  number INTEGER NOT NULL, -- Número da mesa
  name TEXT, -- Nome opcional (ex: "Mesa VIP")
  capacity INTEGER, -- Capacidade (número de pessoas)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(restaurant_id, number)
);

-- =============================================================================
-- 3. ÍNDICES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_restaurant_zones_restaurant ON public.gm_restaurant_zones(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_zones_code ON public.gm_restaurant_zones(restaurant_id, code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_restaurant ON public.gm_restaurant_tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_zone ON public.gm_restaurant_tables(zone_id) WHERE zone_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_active ON public.gm_restaurant_tables(restaurant_id, is_active) WHERE is_active = true;

-- =============================================================================
-- 4. COMENTÁRIOS
-- =============================================================================
COMMENT ON TABLE public.gm_restaurant_zones IS 'Zonas do restaurante (BAR, KITCHEN, PASS, SERVICE, etc) - contexto operacional';
COMMENT ON TABLE public.gm_restaurant_tables IS 'Mesas do restaurante - associadas a zonas';
COMMENT ON COLUMN public.gm_restaurant_zones.code IS 'Código da zona: BAR, KITCHEN, PASS, SERVICE, CASHIER, etc';
COMMENT ON COLUMN public.gm_restaurant_tables.zone_id IS 'Zona onde a mesa está localizada (para contexto de entrega, tarefas, etc)';
