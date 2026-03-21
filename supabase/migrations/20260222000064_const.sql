ALTER TABLE public.gm_product_bom ADD CONSTRAINT gm_product_bom_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES gm_ingredients(id) ON DELETE CASCADE;
