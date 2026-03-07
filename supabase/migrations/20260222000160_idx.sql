CREATE INDEX IF NOT EXISTS idx_locations_restaurant ON public.gm_locations USING btree (restaurant_id);
