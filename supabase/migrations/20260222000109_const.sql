ALTER TABLE public.module_permissions ADD CONSTRAINT module_permissions_restaurant_id_module_id_role_key UNIQUE (restaurant_id, module_id, role);
