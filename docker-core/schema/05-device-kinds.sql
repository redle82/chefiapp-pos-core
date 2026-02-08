-- =============================================================================
-- CHEFIAPP CORE - DISPOSITIVOS TPV/KDS (gm_equipment.kind)
-- =============================================================================
-- Permite registar TPV e KDS como equipamentos (dispositivos com identidade).
-- Aplicado após 04-modules-and-extras.sql.
-- =============================================================================

ALTER TABLE public.gm_equipment DROP CONSTRAINT IF EXISTS gm_equipment_kind_check;
ALTER TABLE public.gm_equipment ADD CONSTRAINT gm_equipment_kind_check CHECK (kind IN (
  'FRIDGE','FREEZER','OVEN','GRILL','PLANCHA','COFFEE_MACHINE','ICE_MACHINE','KEG_SYSTEM','SHELF','OTHER',
  'TPV','KDS'
));

COMMENT ON COLUMN public.gm_equipment.kind IS 'Tipo: equipamento de cozinha ou dispositivo operacional (TPV, KDS).';
