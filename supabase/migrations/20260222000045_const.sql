ALTER TABLE public.gm_equipment ADD CONSTRAINT gm_equipment_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
