ALTER TABLE public.gm_catalog_items ADD CONSTRAINT gm_catalog_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES gm_catalog_categories(id) ON DELETE CASCADE;
