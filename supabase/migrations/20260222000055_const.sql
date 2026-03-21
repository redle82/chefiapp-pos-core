ALTER TABLE public.gm_order_items ADD CONSTRAINT gm_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES gm_products(id);
