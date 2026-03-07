CREATE INDEX IF NOT EXISTS idx_gm_catalog_items_category ON public.gm_catalog_items USING btree (category_id);
