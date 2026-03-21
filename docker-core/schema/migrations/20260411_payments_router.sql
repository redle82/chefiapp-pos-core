-- =============================================================================
-- Migration: Payments Router — gm_payment_intents, gm_payment_receipts, RPCs
-- Date: 2026-04-11
-- Purpose:
--   1. Tables: gm_payment_intents, gm_payment_receipts
--   2. RPCs: create_payment_intent, capture_payment_intent, mark_pix_paid, list_payments_by_order
--   3. RBAC: mark_pix_paid owner/manager+; billing guard on writes
-- Ref: Payment Provider Router (Stripe US/GB, SumUp ES, Pix BR)
-- =============================================================================

-- =============================================================================
-- 1. gm_payment_intents
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.gm_orders(id) ON DELETE SET NULL,
    amount INT NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL CHECK (currency IN ('USD', 'GBP', 'EUR', 'BRL')),
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'sumup', 'pix')),
    method TEXT NOT NULL CHECK (method IN ('card', 'cash', 'pix')),
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN (
        'created', 'requires_action', 'processing', 'succeeded', 'failed', 'canceled', 'expired'
    )),
    provider_ref TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    pix_instructions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gm_payment_intents_restaurant
    ON public.gm_payment_intents(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gm_payment_intents_order
    ON public.gm_payment_intents(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gm_payment_intents_provider_ref
    ON public.gm_payment_intents(provider, provider_ref) WHERE provider_ref IS NOT NULL;

COMMENT ON TABLE public.gm_payment_intents IS
'Payment intents across providers (Stripe, SumUp, Pix). Normalized by Payment Provider Router.';

-- =============================================================================
-- 2. gm_payment_receipts
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intent_id UUID NOT NULL REFERENCES public.gm_payment_intents(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'sumup', 'pix')),
    provider_ref TEXT NOT NULL,
    amount INT NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL,
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    raw JSONB,
    proof_text TEXT,
    marked_by_user_id UUID
);

CREATE INDEX IF NOT EXISTS idx_gm_payment_receipts_intent
    ON public.gm_payment_receipts(intent_id);

COMMENT ON TABLE public.gm_payment_receipts IS
'Payment receipts (captured/settled). Links to gm_payment_intents.';

-- =============================================================================
-- 3. Helper: Resolve currency by country (SQL)
-- =============================================================================
CREATE OR REPLACE FUNCTION public._payments_currency_by_country(p_country TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT CASE UPPER(TRIM(p_country))
        WHEN 'BR' THEN 'BRL'
        WHEN 'US' THEN 'USD'
        WHEN 'GB' THEN 'GBP'
        WHEN 'ES' THEN 'EUR'
        ELSE 'EUR'
    END;
$$;

-- =============================================================================
-- 4. create_payment_intent
-- =============================================================================
-- Gateway calls provider first, then persists. Params include provider response.
-- Billing guard: require_active_subscription(restaurant_id).
-- actor_user_id optional for gateway/service calls.
CREATE OR REPLACE FUNCTION public.create_payment_intent(
    p_restaurant_id UUID,
    p_order_id UUID DEFAULT NULL,
    p_amount INT,
    p_method TEXT,
    p_country TEXT,
    p_actor_user_id UUID DEFAULT NULL,
    p_provider TEXT DEFAULT NULL,
    p_provider_ref TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'created',
    p_currency TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB,
    p_pix_instructions JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_id UUID;
    v_currency TEXT;
    v_provider TEXT;
BEGIN
    -- Billing guard: block if subscription not active
    PERFORM public.require_active_subscription(p_restaurant_id);

    v_currency := COALESCE(p_currency, public._payments_currency_by_country(p_country));
    v_provider := COALESCE(p_provider, CASE
        WHEN p_method = 'pix' THEN 'pix'
        WHEN p_method = 'card' AND UPPER(p_country) IN ('US','GB') THEN 'stripe'
        WHEN p_method = 'card' AND UPPER(p_country) = 'ES' THEN 'sumup'
        WHEN p_method = 'card' AND UPPER(p_country) = 'BR' THEN 'sumup'
        ELSE 'stripe'
    END);

    INSERT INTO public.gm_payment_intents (
        restaurant_id, order_id, amount, currency, provider, method, status,
        provider_ref, metadata, pix_instructions, updated_at
    ) VALUES (
        p_restaurant_id, p_order_id, p_amount, v_currency, v_provider, p_method, COALESCE(p_status, 'created'),
        p_provider_ref, COALESCE(p_metadata, '{}'::JSONB), p_pix_instructions, NOW()
    )
    RETURNING id INTO v_id;

    RETURN (
        SELECT to_jsonb(r) FROM (
            SELECT id, restaurant_id, order_id, amount, currency, provider, method, status,
                   provider_ref, metadata, pix_instructions, created_at
            FROM public.gm_payment_intents
            WHERE id = v_id
        ) r
    );
END;
$$;

COMMENT ON FUNCTION public.create_payment_intent IS
'Create payment intent. Billing guard applied. Gateway should call provider first and pass provider_ref, status, etc.';

GRANT EXECUTE ON FUNCTION public.create_payment_intent TO service_role;
GRANT EXECUTE ON FUNCTION public.create_payment_intent TO authenticated;

-- =============================================================================
-- 5. update_payment_intent (provider_ref, status) — for gateway after provider call
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_payment_intent(
    p_intent_id UUID,
    p_provider_ref TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_restaurant_id UUID;
BEGIN
    SELECT restaurant_id INTO v_restaurant_id
    FROM public.gm_payment_intents
    WHERE id = p_intent_id;

    IF v_restaurant_id IS NULL THEN
        RAISE EXCEPTION 'PAYMENT_INTENT_NOT_FOUND: Intent % not found', p_intent_id;
    END IF;

    UPDATE public.gm_payment_intents
    SET
        provider_ref = COALESCE(p_provider_ref, provider_ref),
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE id = p_intent_id;

    RETURN (
        SELECT to_jsonb(r) FROM (
            SELECT id, restaurant_id, order_id, amount, currency, provider, method, status,
                   provider_ref, metadata, pix_instructions, created_at, updated_at
            FROM public.gm_payment_intents
            WHERE id = p_intent_id
        ) r
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_payment_intent TO service_role;

-- =============================================================================
-- 6. capture_payment_intent
-- =============================================================================
-- Marks intent as succeeded and creates receipt. Provider capture is done by gateway.
CREATE OR REPLACE FUNCTION public.capture_payment_intent(
    p_intent_id UUID,
    p_actor_user_id UUID DEFAULT NULL,
    p_provider_ref TEXT DEFAULT NULL,
    p_amount INT DEFAULT NULL,
    p_currency TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_intent RECORD;
    v_receipt_id UUID;
BEGIN
    SELECT * INTO v_intent
    FROM public.gm_payment_intents
    WHERE id = p_intent_id;

    IF v_intent.id IS NULL THEN
        RAISE EXCEPTION 'PAYMENT_INTENT_NOT_FOUND: Intent % not found', p_intent_id;
    END IF;

    PERFORM public.require_active_subscription(v_intent.restaurant_id);

    UPDATE public.gm_payment_intents
    SET status = 'succeeded', updated_at = NOW()
    WHERE id = p_intent_id;

    INSERT INTO public.gm_payment_receipts (
        intent_id, provider, provider_ref, amount, currency
    ) VALUES (
        p_intent_id,
        v_intent.provider,
        COALESCE(p_provider_ref, v_intent.provider_ref, v_intent.id::TEXT),
        COALESCE(p_amount, v_intent.amount),
        COALESCE(p_currency, v_intent.currency)
    )
    RETURNING id INTO v_receipt_id;

    RETURN (
        SELECT jsonb_build_object(
            'success', true,
            'intent_id', p_intent_id,
            'receipt_id', v_receipt_id,
            'intent', (SELECT to_jsonb(r) FROM (SELECT id, status, provider, amount, currency FROM public.gm_payment_intents WHERE id = p_intent_id) r)
        )
    );
END;
$$;

COMMENT ON FUNCTION public.capture_payment_intent IS
'Capture payment intent, create receipt. Billing guard applied.';

GRANT EXECUTE ON FUNCTION public.capture_payment_intent TO service_role;
GRANT EXECUTE ON FUNCTION public.capture_payment_intent TO authenticated;

-- =============================================================================
-- 7. mark_pix_paid — RBAC: owner/manager+
-- =============================================================================
CREATE OR REPLACE FUNCTION public.mark_pix_paid(
    p_intent_id UUID,
    p_actor_user_id UUID,
    p_proof_text TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_intent RECORD;
    v_receipt_id UUID;
BEGIN
    IF p_actor_user_id IS NULL THEN
        RAISE EXCEPTION 'ACTOR_REQUIRED: p_actor_user_id is required for mark_pix_paid';
    END IF;

    SELECT * INTO v_intent
    FROM public.gm_payment_intents
    WHERE id = p_intent_id;

    IF v_intent.id IS NULL THEN
        RAISE EXCEPTION 'PAYMENT_INTENT_NOT_FOUND: Intent % not found', p_intent_id;
    END IF;

    IF v_intent.provider != 'pix' THEN
        RAISE EXCEPTION 'INVALID_PROVIDER: mark_pix_paid only applies to Pix intents';
    END IF;

    -- RBAC: owner or manager+
    IF NOT public.gm_has_role(v_intent.restaurant_id, p_actor_user_id, 'manager') THEN
        RAISE EXCEPTION 'UNAUTHORIZED: actor must have manager or owner role to mark Pix as paid';
    END IF;

    PERFORM public.require_active_subscription(v_intent.restaurant_id);

    UPDATE public.gm_payment_intents
    SET status = 'succeeded', updated_at = NOW()
    WHERE id = p_intent_id;

    INSERT INTO public.gm_payment_receipts (
        intent_id, provider, provider_ref, amount, currency, proof_text, marked_by_user_id
    ) VALUES (
        p_intent_id, 'pix', COALESCE(v_intent.provider_ref, v_intent.id::TEXT),
        v_intent.amount, v_intent.currency, p_proof_text, p_actor_user_id
    )
    RETURNING id INTO v_receipt_id;

    RETURN jsonb_build_object(
        'success', true,
        'intent_id', p_intent_id,
        'receipt_id', v_receipt_id
    );
END;
$$;

COMMENT ON FUNCTION public.mark_pix_paid IS
'Mark Pix intent as paid (manual v1). RBAC: manager or owner required.';

GRANT EXECUTE ON FUNCTION public.mark_pix_paid TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_pix_paid TO authenticated;

-- =============================================================================
-- 8. list_payments_by_order
-- =============================================================================
CREATE OR REPLACE FUNCTION public.list_payments_by_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN (
        SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC), '[]'::JSONB)
        FROM (
            SELECT
                pi.id, pi.restaurant_id, pi.order_id, pi.amount, pi.currency,
                pi.provider, pi.method, pi.status, pi.provider_ref, pi.pix_instructions,
                pi.created_at, pi.updated_at,
                (
                    SELECT COALESCE(jsonb_agg(to_jsonb(pr)), '[]'::JSONB)
                    FROM public.gm_payment_receipts pr
                    WHERE pr.intent_id = pi.id
                ) AS receipts
            FROM public.gm_payment_intents pi
            WHERE pi.order_id = p_order_id
        ) r
    );
END;
$$;

COMMENT ON FUNCTION public.list_payments_by_order IS
'List payment intents and receipts for an order.';

GRANT EXECUTE ON FUNCTION public.list_payments_by_order TO service_role;
GRANT EXECUTE ON FUNCTION public.list_payments_by_order TO authenticated;
