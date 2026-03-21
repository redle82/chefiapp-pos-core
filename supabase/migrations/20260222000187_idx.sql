CREATE UNIQUE INDEX IF NOT EXISTS saas_tenants_slug_key ON public.saas_tenants USING btree (slug);
