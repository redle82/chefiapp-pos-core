CREATE UNIQUE INDEX IF NOT EXISTS gm_locations_restaurant_id_name_key ON public.gm_locations USING btree (restaurant_id, name);
