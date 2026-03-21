CREATE UNIQUE INDEX IF NOT EXISTS installed_modules_restaurant_id_module_id_key ON public.installed_modules USING btree (restaurant_id, module_id);
