ALTER TABLE public.gm_tasks ADD CONSTRAINT gm_tasks_order_id_fkey FOREIGN KEY (order_id) REFERENCES gm_orders(id) ON DELETE CASCADE;
