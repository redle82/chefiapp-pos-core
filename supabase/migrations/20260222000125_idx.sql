CREATE UNIQUE INDEX IF NOT EXISTS gm_stock_levels_restaurant_id_location_id_ingredient_id_key ON public.gm_stock_levels USING btree (restaurant_id, location_id, ingredient_id);
