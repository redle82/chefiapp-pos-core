CREATE INDEX IF NOT EXISTS idx_locations_kind ON public.gm_locations USING btree (restaurant_id, kind);
