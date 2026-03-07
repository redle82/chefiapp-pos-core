CREATE INDEX IF NOT EXISTS idx_installed_modules_status ON public.installed_modules USING btree (status);
