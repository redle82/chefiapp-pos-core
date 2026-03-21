ALTER TABLE public.installed_modules ADD CONSTRAINT installed_modules_restaurant_id_module_id_key UNIQUE (restaurant_id, module_id);
