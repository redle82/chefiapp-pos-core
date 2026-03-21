ALTER TABLE public.gm_staff ADD CONSTRAINT gm_staff_role_check CHECK (role = ANY (ARRAY['waiter'::text, 'kitchen'::text, 'manager'::text]));
