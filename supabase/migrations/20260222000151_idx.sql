CREATE INDEX IF NOT EXISTS idx_installed_modules_module_id ON public.installed_modules USING btree (module_id);
