-- Migration: 064_portioning_currency_fix.sql
-- Purpose: Atualizar schema de porcionamento para usar centavos (EUR-first)
-- Date: 2025-01-02

-- Add currency column if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portioning_base_products' AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.portioning_base_products
    ADD COLUMN currency TEXT DEFAULT 'EUR';
  END IF;
END $$;

-- Convert cost_total from DECIMAL to INTEGER (cents)
-- Note: This migration assumes existing data is in currency units, not cents
-- If you have existing data, you'll need to multiply by 100
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portioning_base_products' 
      AND column_name = 'cost_total' 
      AND data_type = 'numeric'
  ) THEN
    -- Add new column for cents
    ALTER TABLE public.portioning_base_products
    ADD COLUMN cost_total_cents INTEGER;
    
    -- Migrate data (multiply by 100 to convert to cents)
    UPDATE public.portioning_base_products
    SET cost_total_cents = ROUND(cost_total * 100)::INTEGER;
    
    -- Drop old column
    ALTER TABLE public.portioning_base_products
    DROP COLUMN cost_total;
    
    -- Rename new column
    ALTER TABLE public.portioning_base_products
    RENAME COLUMN cost_total_cents TO cost_total_cents;
    
    -- Make it NOT NULL
    ALTER TABLE public.portioning_base_products
    ALTER COLUMN cost_total_cents SET NOT NULL;
  END IF;
END $$;

-- Update calculated fields to use cents
DO $$ BEGIN
  -- cost_per_gram_cents
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portioning_base_products' AND column_name = 'cost_per_gram'
  ) THEN
    ALTER TABLE public.portioning_base_products
    ADD COLUMN cost_per_gram_cents INTEGER;
    
    UPDATE public.portioning_base_products
    SET cost_per_gram_cents = ROUND((cost_total_cents::DECIMAL / weight_total_g) * 100)::INTEGER;
    
    ALTER TABLE public.portioning_base_products
    DROP COLUMN cost_per_gram;
  END IF;
  
  -- cost_per_portion_cents
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portioning_base_products' AND column_name = 'cost_per_portion'
  ) THEN
    ALTER TABLE public.portioning_base_products
    ADD COLUMN cost_per_portion_cents INTEGER;
    
    UPDATE public.portioning_base_products
    SET cost_per_portion_cents = ROUND((cost_total_cents::DECIMAL / weight_total_g) * portion_weight_g)::INTEGER;
    
    ALTER TABLE public.portioning_base_products
    DROP COLUMN cost_per_portion;
  END IF;
END $$;

-- Update portioning_config to use cents
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portioning_config' AND column_name = 'currency'
  ) THEN
    -- Already has currency
    NULL;
  ELSE
    ALTER TABLE public.portioning_config
    ADD COLUMN currency TEXT DEFAULT 'EUR';
  END IF;
END $$;

-- Update portioning_alerts to use cents
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portioning_alerts' AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.portioning_alerts
    ADD COLUMN currency TEXT DEFAULT 'EUR';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portioning_alerts' AND column_name = 'impact_monthly_cents'
  ) THEN
    ALTER TABLE public.portioning_alerts
    ADD COLUMN impact_monthly_cents INTEGER;
    
    -- Migrate existing data if any
    UPDATE public.portioning_alerts
    SET impact_monthly_cents = ROUND(COALESCE(impact_monthly, 0) * 100)::INTEGER
    WHERE impact_monthly_cents IS NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portioning_alerts' AND column_name = 'impact_yearly_cents'
  ) THEN
    ALTER TABLE public.portioning_alerts
    ADD COLUMN impact_yearly_cents INTEGER;
    
    -- Migrate existing data if any
    UPDATE public.portioning_alerts
    SET impact_yearly_cents = ROUND(COALESCE(impact_yearly, 0) * 100)::INTEGER
    WHERE impact_yearly_cents IS NULL;
  END IF;
END $$;

-- Comments
COMMENT ON COLUMN public.portioning_base_products.cost_total_cents IS 'Custo total em centavos (EUR-first)';
COMMENT ON COLUMN public.portioning_base_products.currency IS 'Moeda (EUR, USD, BRL, etc.)';
COMMENT ON COLUMN public.portioning_base_products.cost_per_gram_cents IS 'Custo por grama em centavos';
COMMENT ON COLUMN public.portioning_base_products.cost_per_portion_cents IS 'Custo por porção em centavos';

