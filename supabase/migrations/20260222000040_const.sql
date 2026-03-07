ALTER TABLE public.gm_catalog_categories ADD CONSTRAINT gm_catalog_categories_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES gm_catalog_menus(id) ON DELETE CASCADE;
