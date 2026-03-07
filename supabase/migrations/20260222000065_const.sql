ALTER TABLE public.gm_product_bom ADD CONSTRAINT gm_product_bom_product_id_fkey FOREIGN KEY (product_id) REFERENCES gm_products(id) ON DELETE CASCADE;
