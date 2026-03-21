CREATE UNIQUE INDEX IF NOT EXISTS module_permissions_restaurant_id_module_id_role_key ON public.module_permissions USING btree (restaurant_id, module_id, role);
