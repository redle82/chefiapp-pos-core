ALTER TABLE public.gm_products ADD CONSTRAINT gm_products_station_check CHECK (station = ANY (ARRAY['BAR'::text, 'KITCHEN'::text]));
