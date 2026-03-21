CREATE UNIQUE INDEX IF NOT EXISTS gm_equipment_restaurant_id_name_key ON public.gm_equipment USING btree (restaurant_id, name);
