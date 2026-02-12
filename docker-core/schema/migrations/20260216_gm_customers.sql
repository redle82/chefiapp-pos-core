-- =====================================================
-- gm_customers — Docker Core
-- Created: 2026-02-16
-- Purpose: Clientes por restaurante para fidelidade (pontos,
--          visitas, total gasto). Usado por LoyaltyService,
--          customersService (admin), GroupEngine, OrderContextReal.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.gm_customers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id       UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    phone               TEXT NOT NULL,
    name                TEXT,
    email               TEXT,
    points_balance      INTEGER NOT NULL DEFAULT 0,
    total_spend_cents   INTEGER NOT NULL DEFAULT 0,
    visit_count         INTEGER NOT NULL DEFAULT 0,
    last_visit_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(restaurant_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_gm_customers_restaurant_id
    ON public.gm_customers (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_gm_customers_created_at
    ON public.gm_customers (created_at DESC);

COMMENT ON TABLE public.gm_customers IS 'Clientes por restaurante: fidelidade (pontos, visitas, spend). Upsert por (restaurant_id, phone).';
