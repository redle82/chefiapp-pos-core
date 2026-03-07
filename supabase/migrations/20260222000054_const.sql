ALTER TABLE public.gm_order_items ADD CONSTRAINT gm_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES gm_orders(id) ON DELETE CASCADE;
