ALTER TABLE public.gm_tasks ADD CONSTRAINT gm_tasks_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES gm_order_items(id) ON DELETE CASCADE;
