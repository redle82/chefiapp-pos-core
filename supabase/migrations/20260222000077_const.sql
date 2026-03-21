ALTER TABLE public.gm_restaurants ADD CONSTRAINT gm_restaurants_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES saas_tenants(id);
