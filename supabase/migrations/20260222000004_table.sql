CREATE TABLE IF NOT EXISTS public.gm_cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Caixa Principal'::text,
  status text NOT NULL DEFAULT 'closed'::text,
  opened_at timestamp with time zone,
  closed_at timestamp with time zone,
  opened_by text,
  closed_by text,
  opening_balance_cents bigint DEFAULT 0,
  closing_balance_cents bigint,
  total_sales_cents bigint DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
