ALTER TABLE public.gm_ingredients ADD CONSTRAINT gm_ingredients_restaurant_id_name_key UNIQUE (restaurant_id, name);
