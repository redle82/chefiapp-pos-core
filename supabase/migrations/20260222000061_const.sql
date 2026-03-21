ALTER TABLE public.gm_payments ADD CONSTRAINT gm_payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES gm_orders(id) ON DELETE CASCADE;
