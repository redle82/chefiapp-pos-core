ALTER TABLE public.gm_order_items ADD CONSTRAINT order_items_quantity_check CHECK (quantity > 0);
