-- ============================================================================
-- Migration: sync_products_to_catalog
-- Date: 2026-02-10
-- Purpose: Automatic sync from gm_products → gm_catalog_items
--          When Menu Builder creates/updates/deletes a product, the catalog
--          visual layer stays in sync automatically via DB triggers.
--          Also emits PRODUCT_* events to event_store for future integrations.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1) TRIGGER: sync product INSERT/UPDATE → gm_catalog_items
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_product_to_catalog()
RETURNS TRIGGER AS $$
DECLARE
  v_menu_id       UUID;
  v_catalog_cat_id UUID;
  v_cat_name      TEXT;
  v_cat_sort      INTEGER;
BEGIN
  -- Get the menu-category name for this product
  SELECT mc.name, mc.sort_order
    INTO v_cat_name, v_cat_sort
    FROM gm_menu_categories mc
   WHERE mc.id = NEW.category_id;

  IF v_cat_name IS NULL THEN
    RETURN NEW;  -- orphan category, skip
  END IF;

  -- Find (or auto-create) the active catalog menu for this restaurant
  SELECT id INTO v_menu_id
    FROM gm_catalog_menus
   WHERE restaurant_id = NEW.restaurant_id
     AND is_active = TRUE
   LIMIT 1;

  IF v_menu_id IS NULL THEN
    INSERT INTO gm_catalog_menus (id, restaurant_id, name, language, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), NEW.restaurant_id, 'Carta Principal', 'es', TRUE, now(), now())
    RETURNING id INTO v_menu_id;
  END IF;

  -- Find (or auto-create) the matching catalog category
  SELECT id INTO v_catalog_cat_id
    FROM gm_catalog_categories
   WHERE menu_id = v_menu_id
     AND title = v_cat_name;

  IF v_catalog_cat_id IS NULL THEN
    INSERT INTO gm_catalog_categories (id, menu_id, title, sort_order)
    VALUES (gen_random_uuid(), v_menu_id, v_cat_name, COALESCE(v_cat_sort, 0))
    RETURNING id INTO v_catalog_cat_id;
  END IF;

  -- Upsert into catalog items (use product ID as catalog item ID for 1:1 mapping)
  INSERT INTO gm_catalog_items (id, category_id, title, description, price_cents, image_url, is_available, sort_order)
  VALUES (
    NEW.id,
    v_catalog_cat_id,
    NEW.name,
    NEW.description,
    NEW.price_cents,
    NEW.photo_url,
    COALESCE(NEW.available, TRUE),
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    category_id  = EXCLUDED.category_id,
    title        = EXCLUDED.title,
    description  = EXCLUDED.description,
    price_cents  = EXCLUDED.price_cents,
    image_url    = EXCLUDED.image_url,
    is_available = EXCLUDED.is_available;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_product_to_catalog ON gm_products;

CREATE TRIGGER trg_sync_product_to_catalog
  AFTER INSERT OR UPDATE ON gm_products
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_to_catalog();

-- ────────────────────────────────────────────────────────────────────────────
-- 2) TRIGGER: sync product DELETE → remove from gm_catalog_items
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_product_delete_from_catalog()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM gm_catalog_items WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_product_delete_from_catalog ON gm_products;

CREATE TRIGGER trg_sync_product_delete_from_catalog
  AFTER DELETE ON gm_products
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_delete_from_catalog();

-- ────────────────────────────────────────────────────────────────────────────
-- 3) TRIGGER: emit PRODUCT events to event_store
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION emit_product_event()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type TEXT;
  v_payload    JSONB;
  v_version    INTEGER;
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'PRODUCT_CREATED';
  ELSIF TG_OP = 'UPDATE' THEN
    v_event_type := 'PRODUCT_UPDATED';
  ELSIF TG_OP = 'DELETE' THEN
    v_event_type := 'PRODUCT_DELETED';
  END IF;

  -- Build payload
  IF TG_OP = 'DELETE' THEN
    v_payload := jsonb_build_object(
      'product_id',    OLD.id,
      'restaurant_id', OLD.restaurant_id,
      'name',          OLD.name,
      'deleted_at',    now()
    );
  ELSE
    v_payload := jsonb_build_object(
      'product_id',    NEW.id,
      'restaurant_id', NEW.restaurant_id,
      'category_id',   NEW.category_id,
      'name',          NEW.name,
      'description',   NEW.description,
      'price_cents',   NEW.price_cents,
      'photo_url',     NEW.photo_url,
      'available',     NEW.available
    );
  END IF;

  -- Get next stream version for this product
  SELECT COALESCE(MAX(stream_version), 0) + 1
    INTO v_version
    FROM event_store
   WHERE stream_type = 'PRODUCT'
     AND stream_id   = COALESCE(NEW.id, OLD.id)::TEXT;

  -- Insert event
  INSERT INTO event_store (event_id, stream_type, stream_id, stream_version, event_type, payload, meta, created_at)
  VALUES (
    gen_random_uuid(),
    'PRODUCT',
    COALESCE(NEW.id, OLD.id)::TEXT,
    v_version,
    v_event_type,
    v_payload,
    jsonb_build_object('trigger', 'sync_products_to_catalog', 'source', 'db_trigger'),
    now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_emit_product_event ON gm_products;

CREATE TRIGGER trg_emit_product_event
  AFTER INSERT OR UPDATE OR DELETE ON gm_products
  FOR EACH ROW
  EXECUTE FUNCTION emit_product_event();
