CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_cash_registers_one_open ON public.gm_cash_registers USING btree (restaurant_id) WHERE (status = 'open'::text);
