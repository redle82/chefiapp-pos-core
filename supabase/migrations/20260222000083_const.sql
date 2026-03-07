ALTER TABLE public.gm_stock_ledger ADD CONSTRAINT gm_stock_ledger_order_id_fkey FOREIGN KEY (order_id) REFERENCES gm_orders(id) ON DELETE SET NULL;
