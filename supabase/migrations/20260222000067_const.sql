ALTER TABLE public.gm_product_bom ADD CONSTRAINT gm_product_bom_restaurant_id_product_id_ingredient_id_key UNIQUE (restaurant_id, product_id, ingredient_id);
