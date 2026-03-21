CREATE UNIQUE INDEX IF NOT EXISTS gm_ingredients_restaurant_id_name_key ON public.gm_ingredients USING btree (restaurant_id, name);
