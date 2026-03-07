ALTER TABLE public.gm_locations ADD CONSTRAINT gm_locations_restaurant_id_name_key UNIQUE (restaurant_id, name);
