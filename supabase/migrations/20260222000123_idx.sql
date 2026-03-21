CREATE UNIQUE INDEX IF NOT EXISTS gm_product_bom_restaurant_id_product_id_ingredient_id_key ON public.gm_product_bom USING btree (restaurant_id, product_id, ingredient_id);
