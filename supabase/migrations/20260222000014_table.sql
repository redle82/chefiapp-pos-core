CREATE TABLE IF NOT EXISTS public.gm_payment_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  order_id uuid,
  operator_id uuid,
  amount_cents integer,
  method text,
  result text NOT NULL,
  error_code text,
  error_message text,
  idempotency_key text,
  payment_id uuid,
  duration_ms integer,
  client_info jsonb,
  created_at timestamp with time zone DEFAULT now()
);
