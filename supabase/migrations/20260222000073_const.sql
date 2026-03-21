ALTER TABLE public.gm_restaurant_members ADD CONSTRAINT gm_restaurant_members_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
