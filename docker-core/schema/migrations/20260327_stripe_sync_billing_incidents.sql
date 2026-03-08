-- =============================================================================
-- Billing incidents: persist audit trail when sync_stripe_subscription_from_event
-- aborts (tenant_not_found, stale_event, currency_mismatch, price_mismatch).
-- Requires: billing_incidents table and billing_incidents_unique_event_reason.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sync_stripe_subscription_from_event(
  p_event_type TEXT,
  p_payload JSONB,
  p_event_created_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(updated_restaurant_id UUID, billing_status TEXT, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_restaurant_id UUID;
  v_customer_id TEXT;
  v_stripe_status TEXT;
  v_trial_end TIMESTAMPTZ;
  v_canceled_at TIMESTAMPTZ;
  v_core_status TEXT;
  v_sub_id TEXT;
  v_obj JSONB;
  v_current_event_at TIMESTAMPTZ;
  v_expected_currency TEXT;
  v_event_currency TEXT;
  v_expected_price_id TEXT;
  v_event_price_id TEXT;
  v_has_billing_status BOOLEAN;
  v_has_trial_ends BOOLEAN;
  v_has_last_event BOOLEAN;
  v_has_subscriptions BOOLEAN;
  v_event_id TEXT;
BEGIN
  v_obj := p_payload->'data'->'object';
  IF v_obj IS NULL THEN
    v_obj := p_payload;
  END IF;
  v_event_id := p_payload->>'id';

  -- Feature-detect columns/tables to keep function safe across migrations
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gm_restaurants' AND column_name='billing_status') INTO v_has_billing_status;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gm_restaurants' AND column_name='trial_ends_at') INTO v_has_trial_ends;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gm_restaurants' AND column_name='last_billing_event_at') INTO v_has_last_event;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='merchant_subscriptions') INTO v_has_subscriptions;

  -- 1. Resolve restaurant_id
  v_restaurant_id := (v_obj->'metadata'->>'restaurant_id')::UUID;
  IF v_restaurant_id IS NULL AND p_event_type LIKE 'customer.subscription.%' THEN
    v_customer_id := v_obj->>'customer';
    IF v_customer_id IS NOT NULL AND v_has_subscriptions THEN
      SELECT restaurant_id INTO v_restaurant_id
      FROM public.merchant_subscriptions
      WHERE stripe_customer_id = v_customer_id
      LIMIT 1;
    END IF;
  END IF;

  -- invoice events also need customer -> restaurant resolution
  IF v_restaurant_id IS NULL AND p_event_type LIKE 'invoice.%' THEN
    v_customer_id := v_obj->>'customer';
    IF v_customer_id IS NOT NULL AND v_has_subscriptions THEN
      SELECT restaurant_id INTO v_restaurant_id
      FROM public.merchant_subscriptions
      WHERE stripe_customer_id = v_customer_id
      LIMIT 1;
    END IF;
  END IF;

  IF v_restaurant_id IS NULL THEN
    IF v_event_id IS NOT NULL AND v_event_id <> '' AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_incidents') THEN
      INSERT INTO public.billing_incidents (
        restaurant_id, provider, event_id, event_type, reason,
        expected_currency, event_currency, expected_price_id, event_price_id, payload
      )
      VALUES (
        NULL, 'stripe', v_event_id, p_event_type, 'tenant_not_found',
        NULL, NULL, NULL, NULL,
        jsonb_build_object('customer_id', v_obj->>'customer')
      )
      ON CONFLICT (event_id, reason) DO NOTHING;
    END IF;
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, 'No restaurant_id in metadata or merchant_subscriptions'::TEXT;
    RETURN;
  END IF;

  -- 2. Stale event guard: skip if we already processed a newer event
  IF p_event_created_at IS NOT NULL THEN
    SELECT last_billing_event_at INTO v_current_event_at
    FROM public.gm_restaurants
    WHERE id = v_restaurant_id;

    IF v_current_event_at IS NOT NULL AND v_current_event_at >= p_event_created_at THEN
      IF v_event_id IS NOT NULL AND v_event_id <> '' AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_incidents') THEN
        INSERT INTO public.billing_incidents (
          restaurant_id, provider, event_id, event_type, reason,
          expected_currency, event_currency, expected_price_id, event_price_id, payload
        )
        VALUES (
          v_restaurant_id, 'stripe', v_event_id, p_event_type, 'stale_event',
          NULL, NULL, NULL, NULL,
          jsonb_build_object('current_last_event_at', v_current_event_at, 'event_created_at', p_event_created_at)
        )
        ON CONFLICT (event_id, reason) DO NOTHING;
      END IF;
      RETURN QUERY SELECT v_restaurant_id, NULL::TEXT,
        ('Stale event skipped: event ' || p_event_created_at::TEXT || ' <= current ' || v_current_event_at::TEXT)::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 3. Currency + price coherence (defensive)
  IF p_event_type IN ('customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted') THEN
    v_event_currency := LOWER(COALESCE(v_obj->>'currency', ''));
  ELSIF p_event_type LIKE 'invoice.%' THEN
    v_event_currency := LOWER(COALESCE(
      v_obj->>'currency',
      (v_obj->'lines'->'data'->0->'price'->>'currency')
    ));
  ELSE
    v_event_currency := NULL;
  END IF;

  IF v_event_currency IS NOT NULL AND v_event_currency <> '' THEN
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='gm_restaurants' AND column_name='billing_currency'
      ) THEN
        SELECT LOWER(billing_currency)::TEXT INTO v_expected_currency
        FROM public.gm_restaurants
        WHERE id = v_restaurant_id;
      ELSE
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='gm_restaurants' AND column_name='currency'
        ) THEN
          SELECT LOWER(currency)::TEXT INTO v_expected_currency
          FROM public.gm_restaurants
          WHERE id = v_restaurant_id;
        END IF;
      END IF;
    EXCEPTION WHEN others THEN
      v_expected_currency := NULL;
    END;

    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema='public' AND table_name='billing_plan_prices'
      ) AND v_has_subscriptions THEN
        SELECT LOWER(bpp.stripe_price_id)::TEXT INTO v_expected_price_id
        FROM public.merchant_subscriptions ms
        JOIN public.billing_plan_prices bpp
          ON bpp.plan_id = ms.plan_id
         AND LOWER(bpp.currency) = v_event_currency
        WHERE ms.restaurant_id = v_restaurant_id
        ORDER BY bpp.id
        LIMIT 1;
      END IF;
    EXCEPTION WHEN others THEN
      v_expected_price_id := NULL;
    END;

    IF p_event_type LIKE 'invoice.%' THEN
      v_event_price_id := COALESCE(
        v_obj->'lines'->'data'->0->'price'->>'id',
        v_obj->'lines'->'data'->0->'price'->>'product'
      );
    ELSIF p_event_type LIKE 'customer.subscription.%' THEN
      v_event_price_id := COALESCE(
        v_obj->'items'->'data'->0->'price'->>'id',
        v_obj->'items'->'data'->0->'price'->>'product'
      );
    ELSE
      v_event_price_id := NULL;
    END IF;

    IF v_expected_currency IS NOT NULL AND v_expected_currency <> '' THEN
      IF v_expected_currency <> v_event_currency THEN
        IF v_event_id IS NOT NULL AND v_event_id <> '' AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_incidents') THEN
          INSERT INTO public.billing_incidents (
            restaurant_id, provider, event_id, event_type, reason,
            expected_currency, event_currency, expected_price_id, event_price_id, payload
          )
          VALUES (
            v_restaurant_id, 'stripe', v_event_id, p_event_type, 'currency_mismatch',
            v_expected_currency, v_event_currency, v_expected_price_id, v_event_price_id,
            jsonb_build_object('customer_id', v_customer_id, 'subscription_id', v_obj->>'id')
          )
          ON CONFLICT (event_id, reason) DO NOTHING;
        END IF;
        RETURN QUERY SELECT v_restaurant_id, NULL::TEXT,
          ('Currency mismatch: expected ' || v_expected_currency || ', got ' || v_event_currency)::TEXT;
        RETURN;
      END IF;
    END IF;

    IF v_expected_price_id IS NOT NULL AND v_expected_price_id <> '' AND v_event_price_id IS NOT NULL THEN
      IF v_expected_price_id <> v_event_price_id THEN
        IF v_event_id IS NOT NULL AND v_event_id <> '' AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_incidents') THEN
          INSERT INTO public.billing_incidents (
            restaurant_id, provider, event_id, event_type, reason,
            expected_currency, event_currency, expected_price_id, event_price_id, payload
          )
          VALUES (
            v_restaurant_id, 'stripe', v_event_id, p_event_type, 'price_mismatch',
            v_expected_currency, v_event_currency, v_expected_price_id, v_event_price_id,
            jsonb_build_object('customer_id', v_customer_id, 'subscription_id', v_obj->>'id')
          )
          ON CONFLICT (event_id, reason) DO NOTHING;
        END IF;
        RETURN QUERY SELECT v_restaurant_id, NULL::TEXT,
          ('Price mismatch: expected ' || v_expected_price_id || ', got ' || v_event_price_id)::TEXT;
        RETURN;
      END IF;
    END IF;
  END IF;

  -- 4. Subscription events
  IF p_event_type IN ('customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted') THEN
    v_stripe_status := v_obj->>'status';
    v_trial_end := (v_obj->>'trial_end')::BIGINT;
    IF v_trial_end IS NOT NULL THEN
      v_trial_end := to_timestamp(v_trial_end) AT TIME ZONE 'UTC';
    END IF;
    v_canceled_at := (v_obj->>'canceled_at')::BIGINT;
    IF v_canceled_at IS NOT NULL THEN
      v_canceled_at := to_timestamp(v_canceled_at) AT TIME ZONE 'UTC';
    END IF;

    v_core_status := CASE v_stripe_status
      WHEN 'trialing' THEN 'trial'
      WHEN 'active' THEN 'active'
      WHEN 'past_due' THEN 'past_due'
      WHEN 'canceled' THEN 'canceled'
      WHEN 'unpaid' THEN 'canceled'
      WHEN 'incomplete' THEN 'past_due'
      WHEN 'incomplete_expired' THEN 'past_due'
      ELSE 'trial'
    END;

    IF v_has_billing_status THEN
      IF v_has_last_event THEN
        UPDATE public.gm_restaurants
        SET
          billing_status = v_core_status,
          trial_ends_at = COALESCE(v_trial_end, trial_ends_at),
          last_billing_event_at = COALESCE(p_event_created_at, NOW()),
          updated_at = NOW()
        WHERE id = v_restaurant_id;
      ELSE
        UPDATE public.gm_restaurants
        SET
          billing_status = v_core_status,
          trial_ends_at = COALESCE(v_trial_end, trial_ends_at),
          updated_at = NOW()
        WHERE id = v_restaurant_id;
      END IF;
    END IF;

    IF v_has_subscriptions THEN
      v_sub_id := v_obj->>'id';
      UPDATE public.merchant_subscriptions
      SET
        status = v_stripe_status,
        trial_end = v_trial_end,
        canceled_at = v_canceled_at,
        stripe_subscription_id = COALESCE(v_sub_id, stripe_subscription_id),
        updated_at = NOW()
      WHERE restaurant_id = v_restaurant_id;
    END IF;

    RETURN QUERY SELECT v_restaurant_id, v_core_status, 'Subscription sync applied'::TEXT;
    RETURN;
  END IF;

  -- 5. invoice.payment_failed → past_due
  IF p_event_type = 'invoice.payment_failed' THEN
    IF v_has_billing_status THEN
      IF v_has_last_event THEN
        UPDATE public.gm_restaurants
        SET billing_status = 'past_due',
            last_billing_event_at = COALESCE(p_event_created_at, NOW()),
            updated_at = NOW()
        WHERE id = v_restaurant_id;
      ELSE
        UPDATE public.gm_restaurants
        SET billing_status = 'past_due',
            updated_at = NOW()
        WHERE id = v_restaurant_id;
      END IF;
      RETURN QUERY SELECT v_restaurant_id, 'past_due'::TEXT, 'Marked past_due from invoice.payment_failed'::TEXT;
    END IF;
    RETURN;
  END IF;

  -- 6. invoice.paid → active
  IF p_event_type = 'invoice.paid' THEN
    IF v_has_billing_status THEN
      IF v_has_last_event THEN
        UPDATE public.gm_restaurants
        SET billing_status = 'active',
            last_billing_event_at = COALESCE(p_event_created_at, NOW()),
            updated_at = NOW()
        WHERE id = v_restaurant_id;
      ELSE
        UPDATE public.gm_restaurants
        SET billing_status = 'active',
            updated_at = NOW()
        WHERE id = v_restaurant_id;
      END IF;
      RETURN QUERY SELECT v_restaurant_id, 'active'::TEXT, 'Marked active from invoice.paid'::TEXT;
    END IF;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_restaurant_id, NULL::TEXT, ('Event type not applied: ' || p_event_type)::TEXT;
END;
$$;

COMMENT ON FUNCTION public.sync_stripe_subscription_from_event IS
  'Billing hardening: sync gm_restaurants.billing_status from Stripe webhooks with timestamp guard and billing_incidents audit trail on abort (tenant_not_found, stale_event, currency_mismatch, price_mismatch).';

GRANT EXECUTE ON FUNCTION public.sync_stripe_subscription_from_event(TEXT, JSONB, TIMESTAMPTZ) TO service_role;
