-- Add customer_id to gm_orders
ALTER TABLE public.gm_orders
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.gm_customers(id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_gm_orders_customer_id ON public.gm_orders(customer_id);
