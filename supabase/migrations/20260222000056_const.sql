ALTER TABLE public.gm_order_items ADD CONSTRAINT gm_order_items_station_check CHECK (station = ANY (ARRAY['BAR'::text, 'KITCHEN'::text]));
