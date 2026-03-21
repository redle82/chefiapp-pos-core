ALTER TABLE public.gm_restaurants ADD CONSTRAINT gm_restaurants_product_mode_check CHECK (product_mode = ANY (ARRAY['demo'::text, 'pilot'::text, 'live'::text]));
