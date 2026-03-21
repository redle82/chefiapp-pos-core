ALTER TABLE public.gm_product_bom ADD CONSTRAINT gm_product_bom_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
