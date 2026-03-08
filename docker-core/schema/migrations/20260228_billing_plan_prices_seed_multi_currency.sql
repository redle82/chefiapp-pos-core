-- =============================================================================
-- BILLING PLAN PRICES — Seed multi-currency matrix (EUR, USD, BRL)
-- =============================================================================
-- Purpose:
--   - Populate billing_plan_prices with opinionated, psychological pricing per
--     currency, without runtime conversion.
--   - Keep Stripe decoupled: stripe_price_id here usa um identificador semântico
--     (ex.: 'starter_eur', 'starter_usd', 'starter_brl') que será mapeado para
--     price_xxx reais via env vars STRIPE_PRICE_* no gateway ou actualizados
--     directamente na coluna no futuro.
--   - Currency continua a vir de gm_restaurants.country / restaurant.currency,
--     nunca de locale (ver coreBillingApi.getRestaurantBillingCurrency).
--
-- Notas:
--   - billing_plans continua a ter o preço base em EUR; esta migração adiciona
--     preços específicos por moeda em billing_plan_prices.
--   - Valores são uma matriz inicial (ajustável). São pensados como:
--       Starter: ~29 €/32 $/149 R$
--       Pro:     ~59 €/65 $/299 R$
--       Enterprise: ~99 €/110 $/499 R$
--     Mas guardados em centavos inteiros por moeda.
-- =============================================================================

-- Starter (Basic)
INSERT INTO public.billing_plan_prices (plan_id, currency, stripe_price_id, price_cents, interval)
VALUES
  -- EUR (~29 €/mês)
  ('starter', 'EUR', 'starter_eur', 2900, 'month'),
  -- USD (~32 $/mês)
  ('starter', 'USD', 'starter_usd', 3200, 'month'),
  -- BRL (~149 R$/mês)
  ('starter', 'BRL', 'starter_brl', 14900, 'month')
ON CONFLICT (plan_id, currency) DO UPDATE SET
  stripe_price_id = EXCLUDED.stripe_price_id,
  price_cents     = EXCLUDED.price_cents,
  interval        = EXCLUDED.interval,
  updated_at      = NOW();

-- Pro
INSERT INTO public.billing_plan_prices (plan_id, currency, stripe_price_id, price_cents, interval)
VALUES
  -- EUR (~59 €/mês)
  ('pro', 'EUR', 'pro_eur', 5900, 'month'),
  -- USD (~65 $/mês)
  ('pro', 'USD', 'pro_usd', 6500, 'month'),
  -- BRL (~299 R$/mês)
  ('pro', 'BRL', 'pro_brl', 29900, 'month')
ON CONFLICT (plan_id, currency) DO UPDATE SET
  stripe_price_id = EXCLUDED.stripe_price_id,
  price_cents     = EXCLUDED.price_cents,
  interval        = EXCLUDED.interval,
  updated_at      = NOW();

-- Enterprise
INSERT INTO public.billing_plan_prices (plan_id, currency, stripe_price_id, price_cents, interval)
VALUES
  -- EUR (~99 €/mês)
  ('enterprise', 'EUR', 'enterprise_eur', 9900, 'month'),
  -- USD (~110 $/mês)
  ('enterprise', 'USD', 'enterprise_usd', 11000, 'month'),
  -- BRL (~499 R$/mês)
  ('enterprise', 'BRL', 'enterprise_brl', 49900, 'month')
ON CONFLICT (plan_id, currency) DO UPDATE SET
  stripe_price_id = EXCLUDED.stripe_price_id,
  price_cents     = EXCLUDED.price_cents,
  interval        = EXCLUDED.interval,
  updated_at      = NOW();

-- =============================================================================
-- Stripe mapping strategy (bridge to real price_xxx)
-- =============================================================================
-- - O Core e o merchant-portal usam resolveStripePriceId(plan, currency, planPriceRow)
--   para devolver um identificador de preço. Com esta seed:
--       planPriceRow.stripe_price_id = 'starter_eur' | 'starter_usd' | ...
-- - O integration-gateway mapeia estes identificadores semânticos para
--   price_xxx reais via env vars:
--       STRIPE_PRICE_STARTER_EUR=price_...
--       STRIPE_PRICE_STARTER_USD=price_...
--       STRIPE_PRICE_STARTER_BRL=price_...
--       STRIPE_PRICE_PRO_EUR=price_...
--       ...
-- - Futuro: quando os price_xxx forem conhecidos, pode-se actualizar
--   directamente billing_plan_prices.stripe_price_id para o valor real.
--   O gateway já trata de passar price_xxx directo para a Stripe SDK.
-- =============================================================================

