ALTER TABLE public.gm_orders ADD CONSTRAINT orders_status_check CHECK (status = ANY (ARRAY['OPEN'::text, 'PREPARING'::text, 'IN_PREP'::text, 'READY'::text, 'CLOSED'::text, 'CANCELLED'::text]));
