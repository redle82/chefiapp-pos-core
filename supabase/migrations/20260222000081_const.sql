ALTER TABLE public.gm_stock_ledger ADD CONSTRAINT gm_stock_ledger_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES gm_ingredients(id) ON DELETE CASCADE;
