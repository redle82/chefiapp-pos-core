CREATE INDEX IF NOT EXISTS idx_equipment_location ON public.gm_equipment USING btree (location_id) WHERE (location_id IS NOT NULL);
