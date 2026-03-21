ALTER TABLE public.gm_ingredients ADD CONSTRAINT gm_ingredients_unit_check CHECK (unit = ANY (ARRAY['g'::text, 'kg'::text, 'ml'::text, 'l'::text, 'unit'::text]));
