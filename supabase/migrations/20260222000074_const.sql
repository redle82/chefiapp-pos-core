ALTER TABLE public.gm_restaurants ADD CONSTRAINT gm_restaurants_billing_status_check CHECK (billing_status = ANY (ARRAY['trial'::text, 'active'::text, 'past_due'::text, 'canceled'::text]));
