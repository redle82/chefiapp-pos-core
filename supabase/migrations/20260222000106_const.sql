ALTER TABLE public.legal_seals ADD CONSTRAINT legal_seals_entity_type_entity_id_legal_state_key UNIQUE (entity_type, entity_id, legal_state);
