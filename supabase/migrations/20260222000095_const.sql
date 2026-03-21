ALTER TABLE public.gm_tasks ADD CONSTRAINT gm_tasks_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
