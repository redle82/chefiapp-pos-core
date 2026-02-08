-- FASE 4 Passo 1: Campos de presença digital em gm_restaurants
-- Horários e localização para a página pública (/public/:slug).

ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS address_text TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours_text TEXT;

COMMENT ON COLUMN public.gm_restaurants.address_text IS
  'Endereço ou localização para exibir na página pública (FASE 4 Presença Digital).';
COMMENT ON COLUMN public.gm_restaurants.opening_hours_text IS
  'Horários de funcionamento em texto livre (ex: Seg-Sex 9h-18h) para a página pública (FASE 4).';
;
-- FASE 4 Passo 3: Documentar extensões em restaurant_web_presence.config
-- Pontos de extensão para reviews, SEO local e fidelização (ver docs/implementation/FASE_4_EXTENSOES_FUTURAS.md).

COMMENT ON COLUMN public.restaurant_web_presence.config IS
  'JSONB: layout, cores, etc. Extensões futuras: reviews (reviews_enabled, reviews_source, place_id), seo (meta_description, og_image_url), loyalty (enabled, points_per_eur, tier_rules).';
;
-- Onda 5 O5.6 — RPC get_shift_history (histórico por turno para Owner Dashboard)
-- Ref: docs/ops/DASHBOARD_METRICS.md §7

CREATE OR REPLACE FUNCTION public.get_shift_history(
    p_restaurant_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    IF NOT (
        EXISTS (SELECT 1 FROM public.gm_restaurants r WHERE r.id = p_restaurant_id AND r.owner_id = auth.uid())
        OR public.is_user_member_of_restaurant(p_restaurant_id)
    ) THEN
        RAISE EXCEPTION 'Access Denied: You are not a member of this restaurant.';
    END IF;

    IF p_from IS NULL OR p_to IS NULL OR p_from > p_to THEN
        RAISE EXCEPTION 'Invalid period: p_from and p_to required, p_from <= p_to.';
    END IF;

    SELECT COALESCE(
        jsonb_agg(rec ORDER BY (rec->>'opened_at')::timestamptz DESC NULLS LAST),
        '[]'::jsonb
    ) INTO v_result
    FROM (
        SELECT jsonb_build_object(
            'shift_id', t.id,
            'opened_at', t.started_at,
            'closed_at', t.ended_at,
            'total_sales_cents', (
                SELECT COALESCE(SUM(p.amount_cents), 0)::BIGINT
                FROM public.gm_payments p
                WHERE p.tenant_id = t.restaurant_id
                  AND p.created_at >= t.started_at
                  AND (t.ended_at IS NULL OR p.created_at <= t.ended_at)
            ),
            'orders_count', (
                SELECT COUNT(*)::BIGINT
                FROM public.gm_orders o
                WHERE o.restaurant_id = t.restaurant_id
                  AND o.created_at >= t.started_at
                  AND (t.ended_at IS NULL OR o.created_at <= t.ended_at)
            )
        ) AS rec
        FROM public.turn_sessions t
        WHERE t.restaurant_id = p_restaurant_id
          AND t.started_at <= p_to
          AND (t.ended_at IS NULL OR t.ended_at >= p_from)
    ) sub;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_shift_history(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS
  'Histórico por turno (Onda 5 O5.6). Retorna array de { shift_id, opened_at, closed_at, total_sales_cents, orders_count }. DASHBOARD_METRICS §7.';
;
