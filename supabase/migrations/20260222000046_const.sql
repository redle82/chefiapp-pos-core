ALTER TABLE public.gm_equipment ADD CONSTRAINT gm_equipment_restaurant_id_name_key UNIQUE (restaurant_id, name);
