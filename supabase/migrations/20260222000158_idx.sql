CREATE INDEX IF NOT EXISTS idx_legal_seals_entity ON public.legal_seals USING btree (entity_type, entity_id);
