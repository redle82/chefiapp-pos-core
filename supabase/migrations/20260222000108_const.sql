ALTER TABLE public.module_permissions ADD CONSTRAINT module_permissions_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
