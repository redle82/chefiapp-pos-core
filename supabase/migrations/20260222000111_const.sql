ALTER TABLE public.gm_orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status = ANY (ARRAY['PENDING'::text, 'PAID'::text, 'PARTIALLY_PAID'::text, 'FAILED'::text, 'REFUNDED'::text]));
