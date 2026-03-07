CREATE INDEX IF NOT EXISTS idx_gm_catalog_menus_active ON public.gm_catalog_menus USING btree (restaurant_id, is_active) WHERE (is_active = true);
