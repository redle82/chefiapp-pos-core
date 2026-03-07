CREATE TABLE IF NOT EXISTS public.gm_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  cash_register_id uuid,
  operator_id uuid,
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'EUR'::text,
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'paid'::text,
  idempotency_key text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  payment_provider text,
  external_checkout_id text,
  external_payment_id text,
  metadata jsonb DEFAULT '{}'::jsonb
);
