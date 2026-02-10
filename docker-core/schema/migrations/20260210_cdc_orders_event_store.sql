-- Migration: CDC trigger for gm_orders -> event_store
-- Emits ORDER_CREATED on insert with payload.totalCents

CREATE OR REPLACE FUNCTION public.emit_order_created_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(stream_version), 0) + 1
    INTO v_next_version
    FROM public.event_store
   WHERE stream_type = 'ORDER'
     AND stream_id = NEW.id::text;

  INSERT INTO public.event_store (
    event_id,
    stream_type,
    stream_id,
    stream_version,
    event_type,
    payload,
    meta
  ) VALUES (
    gen_random_uuid(),
    'ORDER',
    NEW.id::text,
    v_next_version,
    'ORDER_CREATED',
    jsonb_build_object(
      'orderId', NEW.id,
      'restaurantId', NEW.restaurant_id,
      'totalCents', NEW.total_cents,
      'status', NEW.status,
      'paymentStatus', NEW.payment_status,
      'source', NEW.source
    ),
    jsonb_build_object('schema_version', '1')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_order_created_event ON public.gm_orders;

CREATE TRIGGER trg_emit_order_created_event
AFTER INSERT ON public.gm_orders
FOR EACH ROW
EXECUTE FUNCTION public.emit_order_created_event();
