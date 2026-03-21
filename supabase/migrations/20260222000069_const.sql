ALTER TABLE public.gm_products ADD CONSTRAINT gm_products_category_id_fkey FOREIGN KEY (category_id) REFERENCES gm_menu_categories(id);
