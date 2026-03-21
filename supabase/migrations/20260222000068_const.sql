ALTER TABLE public.gm_product_bom ADD CONSTRAINT gm_product_bom_station_check CHECK (station = ANY (ARRAY['KITCHEN'::text, 'BAR'::text]));
