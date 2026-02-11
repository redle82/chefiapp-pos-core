-- Fix: gm_catalog_menus missing updated_at/created_at columns
-- The MenuCatalogReader orders by updated_at which fails if the column doesn't exist.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gm_catalog_menus' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE gm_catalog_menus ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gm_catalog_menus' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE gm_catalog_menus ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END
$$;
