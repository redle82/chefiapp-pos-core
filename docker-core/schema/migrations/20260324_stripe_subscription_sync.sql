-- =============================================================================
-- Stripe subscription lifecycle → gm_restaurants.billing_status + merchant_subscriptions
-- Fase 3 Billing Real: actualizar estado de subscrição a partir de webhooks Stripe.
-- Eventos: customer.subscription.created/updated/deleted, invoice.paid, invoice.payment_failed
-- =============================================================================

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
  -- Payload: Stripe event has data.object
  v_obj := p_payload->'data'->'object';
  IF v_obj IS NULL THEN
    v_obj := p_payload;
  END IF;

  -- 1. Resolve restaurant_id: metadata.restaurant_id (checkout session) or customer -> merchant_subscriptions
  v_restaurant_id := (v_obj->'metadata'->>'restaurant_id')::UUID;
  IF v_restaurant_id IS NULL AND p_event_type LIKE 'customer.subscription.%' THEN
    v_customer_id := v_obj->>'customer';
    IF v_customer_id IS NOT NULL THEN
      SELECT restaurant_id INTO v_restaurant_id
      FROM public.merchant_subscriptions
      WHERE stripe_customer_id = v_customer_id
      LIMIT 1;
    END IF;
  END IF;

  IF v_restaurant_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, 'No restaurant_id in metadata or merchant_subscriptions'::TEXT;
    RETURN;
  END IF;

  -- 2. Map Stripe status to Core billing_status (trial | active | past_due | canceled)
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

    UPDATE public.gm_restaurants
    SET
      billing_status = v_core_status,
      trial_ends_at = COALESCE(v_trial_end, trial_ends_at),
      updated_at = NOW()
    WHERE id = v_restaurant_id;

    v_sub_id := v_obj->>'id';
    UPDATE public.merchant_subscriptions
    SET
      status = v_stripe_status,
      trial_end = v_trial_end,
      canceled_at = v_canceled_at,
      stripe_subscription_id = COALESCE(v_sub_id, stripe_subscription_id),
      updated_at = NOW()
    WHERE restaurant_id = v_restaurant_id;

    RETURN QUERY SELECT v_restaurant_id, v_core_status, 'Subscription sync applied'::TEXT;
    RETURN;
  END IF;

  -- 3. invoice.payment_failed → past_due
  IF p_event_type = 'invoice.payment_failed' THEN
    v_customer_id := v_obj->>'customer';
    SELECT restaurant_id INTO v_restaurant_id
    FROM public.merchant_subscriptions
    WHERE stripe_customer_id = v_customer_id
    LIMIT 1;
    IF v_restaurant_id IS NOT NULL THEN
      UPDATE public.gm_restaurants SET billing_status = 'past_due', updated_at = NOW() WHERE id = v_restaurant_id;
      RETURN QUERY SELECT v_restaurant_id, 'past_due'::TEXT, 'Marked past_due from invoice.payment_failed'::TEXT;
    END IF;
    RETURN;
  END IF;

  -- 4. invoice.paid → active (optional: confirm active)
  IF p_event_type = 'invoice.paid' THEN
    v_customer_id := v_obj->>'customer';
    SELECT restaurant_id INTO v_restaurant_id
    FROM public.merchant_subscriptions
    WHERE stripe_customer_id = v_customer_id
    LIMIT 1;
    IF v_restaurant_id IS NOT NULL THEN
      UPDATE public.gm_restaurants SET billing_status = 'active', updated_at = NOW() WHERE id = v_restaurant_id;
      RETURN QUERY SELECT v_restaurant_id, 'active'::TEXT, 'Marked active from invoice.paid'::TEXT;
    END IF;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_restaurant_id, NULL::TEXT, ('Event type not applied: ' || p_event_type)::TEXT;
END;
$$;

COMMENT ON FUNCTION public.sync_stripe_subscription_from_event IS 'Fase 3 Billing: sync gm_restaurants.billing_status and merchant_subscriptions from Stripe webhook events. Call after process_webhook_event for customer.subscription.* and invoice.* events.';

GRANT EXECUTE ON FUNCTION public.sync_stripe_subscription_from_event TO service_role;
