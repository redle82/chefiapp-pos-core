ALTER TABLE public.gm_locations ADD CONSTRAINT gm_locations_kind_check CHECK (kind = ANY (ARRAY['KITCHEN'::text, 'BAR'::text, 'STORAGE'::text, 'SERVICE'::text, 'OTHER'::text]));
