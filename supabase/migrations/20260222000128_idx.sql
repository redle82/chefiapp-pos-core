CREATE INDEX IF NOT EXISTS idx_bom_ingredient ON public.gm_product_bom USING btree (ingredient_id);
