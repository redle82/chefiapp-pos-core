CREATE UNIQUE INDEX IF NOT EXISTS legal_seals_entity_type_entity_id_legal_state_key ON public.legal_seals USING btree (entity_type, entity_id, legal_state);
