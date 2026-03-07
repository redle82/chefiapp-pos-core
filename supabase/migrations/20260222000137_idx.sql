CREATE INDEX IF NOT EXISTS idx_gm_catalog_items_available ON public.gm_catalog_items USING btree (category_id, is_available) WHERE (is_available = true);
