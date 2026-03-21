ALTER TABLE public.gm_orders ADD CONSTRAINT gm_orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES gm_tables(id);
