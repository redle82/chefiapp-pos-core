ALTER TABLE public.gm_equipment ADD CONSTRAINT gm_equipment_location_id_fkey FOREIGN KEY (location_id) REFERENCES gm_locations(id) ON DELETE SET NULL;
