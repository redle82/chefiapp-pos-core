ALTER TABLE public.gm_stock_ledger ADD CONSTRAINT gm_stock_ledger_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES gm_order_items(id) ON DELETE SET NULL;
