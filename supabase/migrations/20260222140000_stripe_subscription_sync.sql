-- Fase 3 Billing: sync Stripe subscription lifecycle to gm_restaurants + merchant_subscriptions
-- Requires: gm_restaurants (billing_status, trial_ends_at), merchant_subscriptions (stripe_customer_id, etc.)
-- Ref: docker-core/schema/migrations/20260324_stripe_subscription_sync.sql

CREATE OR REPLACE FUNCTION public.sync_stripe_subscription_from_event(
  p_event_type TEXT,
  p_payload JSONB
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
BEGIN
  v_obj := p_payload->'data'->'object';
  IF v_obj IS NULL THEN
    v_obj := p_payload;
  END IF;

  v_restaurant_id := (v_obj->'metadata'->>'restaurant_id')::UUID;
  IF v_restaurant_id IS NULL AND p_event_type LIKE 'customer.subscription.%' THEN
    v_customer_id := v_obj->>'customer';
    IF v_customer_id IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_subscriptions') THEN
      SELECT ms.restaurant_id INTO v_restaurant_id
      FROM public.merchant_subscriptions ms
      WHERE ms.stripe_customer_id = v_customer_id
      LIMIT 1;
    END IF;
  END IF;

  IF v_restaurant_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, 'No restaurant_id in metadata or merchant_subscriptions'::TEXT;
    RETURN;
  END IF;

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

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'billing_status') THEN
      UPDATE public.gm_restaurants
      SET billing_status = v_core_status, updated_at = NOW()
      WHERE id = v_restaurant_id;
      IF FOUND AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'trial_ends_at') THEN
        UPDATE public.gm_restaurants SET trial_ends_at = COALESCE(v_trial_end, trial_ends_at) WHERE id = v_restaurant_id;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_subscriptions') THEN
      v_sub_id := v_obj->>'id';
      UPDATE public.merchant_subscriptions
      SET status = v_stripe_status, trial_end = v_trial_end, canceled_at = v_canceled_at,
          stripe_subscription_id = COALESCE(v_sub_id, stripe_subscription_id), updated_at = NOW()
      WHERE restaurant_id = v_restaurant_id;
    END IF;

    RETURN QUERY SELECT v_restaurant_id, v_core_status, 'Subscription sync applied'::TEXT;
    RETURN;
  END IF;

  IF p_event_type = 'invoice.payment_failed' THEN
    v_customer_id := v_obj->>'customer';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_subscriptions') THEN
      SELECT ms.restaurant_id INTO v_restaurant_id FROM public.merchant_subscriptions ms WHERE ms.stripe_customer_id = v_customer_id LIMIT 1;
      IF v_restaurant_id IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'billing_status') THEN
        UPDATE public.gm_restaurants SET billing_status = 'past_due', updated_at = NOW() WHERE id = v_restaurant_id;
        RETURN QUERY SELECT v_restaurant_id, 'past_due'::TEXT, 'Marked past_due from invoice.payment_failed'::TEXT;
      END IF;
    END IF;
    RETURN;
  END IF;

  IF p_event_type = 'invoice.paid' THEN
    v_customer_id := v_obj->>'customer';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'merchant_subscriptions') THEN
      SELECT ms.restaurant_id INTO v_restaurant_id FROM public.merchant_subscriptions ms WHERE ms.stripe_customer_id = v_customer_id LIMIT 1;
      IF v_restaurant_id IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'billing_status') THEN
        UPDATE public.gm_restaurants SET billing_status = 'active', updated_at = NOW() WHERE id = v_restaurant_id;
        RETURN QUERY SELECT v_restaurant_id, 'active'::TEXT, 'Marked active from invoice.paid'::TEXT;
      END IF;
    END IF;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_restaurant_id, NULL::TEXT, ('Event type not applied: ' || p_event_type)::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_stripe_subscription_from_event TO service_role;
