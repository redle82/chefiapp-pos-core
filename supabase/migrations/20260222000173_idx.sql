CREATE INDEX IF NOT EXISTS idx_shift_logs_restaurant_active ON public.shift_logs USING btree (restaurant_id) WHERE (status = 'active'::text);
