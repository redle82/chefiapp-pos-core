-- =============================================================================
-- BILLING CONFIGS - Configuração de Billing por Restaurante (Core Docker-native)
-- =============================================================================
-- Contrato: CORE_BILLING_AND_PAYMENTS_CONTRACT.md
-- NO SUPABASE. Fonte de verdade = Core (Postgres + Core API).
-- =============================================================================

-- =============================================================================
-- 1. TABELA billing_configs (gateways do restaurante para clientes finais)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.billing_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'sumup', 'pix', 'custom')),
    currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'BRL')),
    enabled BOOLEAN NOT NULL DEFAULT false,
    credentials_ref TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_billing_configs_restaurant_id ON public.billing_configs(restaurant_id);

COMMENT ON TABLE public.billing_configs IS 'Configuração de gateways de pagamento do restaurante (clientes finais). Core nunca guarda dados de cartão.';
COMMENT ON COLUMN public.billing_configs.credentials_ref IS 'Referência cifrada; nunca dados em claro.';
COMMENT ON COLUMN public.billing_configs.enabled IS 'false = TPV bloqueia cobrança.';

-- =============================================================================
-- 2. billing_status em gm_restaurants (SaaS: trial | active | past_due | canceled)
-- =============================================================================
-- Para PaymentGuard/FlowGate: fonte de verdade = Core quando backend Docker.
-- Valor pode ser sincronizado pelo Core a partir do Stripe (webhook ou job).

ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'trial'
  CHECK (billing_status IN ('trial', 'active', 'past_due', 'canceled'));

COMMENT ON COLUMN public.gm_restaurants.billing_status IS 'Estado da subscrição SaaS (ChefIApp). Fonte: Core (sync Stripe).';

-- RLS (opcional; habilitar quando auth do Core estiver definida)
-- ALTER TABLE public.billing_configs ENABLE ROW LEVEL SECURITY;
