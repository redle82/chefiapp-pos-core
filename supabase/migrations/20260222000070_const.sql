ALTER TABLE public.gm_products ADD CONSTRAINT gm_products_prep_category_check CHECK (prep_category = ANY (ARRAY['drink'::text, 'starter'::text, 'main'::text, 'dessert'::text]));
