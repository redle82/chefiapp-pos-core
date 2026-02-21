-- ============================================================================
-- Migration: gm_product_assets
-- Date: 2026-03-02
-- Purpose: Global product asset library + product image overrides.
-- ============================================================================

-- 1) Asset library table
CREATE TABLE IF NOT EXISTS public.gm_product_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_generic BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gm_product_assets_category
  ON public.gm_product_assets(category);

-- 2) Product overrides
ALTER TABLE public.gm_products
  ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES public.gm_product_assets(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'gm_products_asset_id_fkey'
       AND conrelid = 'public.gm_products'::regclass
  ) THEN
    ALTER TABLE public.gm_products
      ADD CONSTRAINT gm_products_asset_id_fkey
      FOREIGN KEY (asset_id)
      REFERENCES public.gm_product_assets(id)
      ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.gm_products
  ADD COLUMN IF NOT EXISTS custom_image_url TEXT;

CREATE INDEX IF NOT EXISTS idx_gm_products_asset_id
  ON public.gm_products(asset_id);

-- 3) Update sync trigger to prefer custom/asset images
CREATE OR REPLACE FUNCTION sync_product_to_catalog()
RETURNS TRIGGER AS $$
DECLARE
  v_menu_id       UUID;
  v_catalog_cat_id UUID;
  v_cat_name      TEXT;
  v_cat_sort      INTEGER;
  v_asset_image  TEXT;
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

  SELECT image_url INTO v_asset_image
    FROM gm_product_assets
   WHERE id = NEW.asset_id;

  -- Upsert into catalog items (use product ID as catalog item ID for 1:1 mapping)
  INSERT INTO gm_catalog_items (id, category_id, title, description, price_cents, image_url, is_available, sort_order)
  VALUES (
    NEW.id,
    v_catalog_cat_id,
    NEW.name,
    NEW.description,
    NEW.price_cents,
    COALESCE(NEW.custom_image_url, v_asset_image, NEW.photo_url),
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

-- 4) Seed generic assets
INSERT INTO public.gm_product_assets (category, label, image_url, is_generic)
VALUES
  -- Bebidas (20)
  ('Bebidas', 'Cola Soda', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Lemon Soda', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Tonic Water', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Sparkling Water', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Water Bottle', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Orange Juice', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Apple Juice', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Iced Tea', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Energy Drink', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Ginger Ale', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Root Beer', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Lemonade', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Mango Juice', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Peach Tea', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Mineral Water', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Coconut Water', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Soda Water', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Grape Soda', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Cherry Soda', '/assets/products/generic/drink.svg', TRUE),
  ('Bebidas', 'Cappuccino', '/assets/products/generic/drink.svg', TRUE),

  -- Comidas (15)
  ('Comidas', 'Burger Classic', '/assets/products/generic/food.svg', TRUE),
  ('Comidas', 'Cheeseburger', '/assets/products/generic/food.svg', TRUE),
  ('Comidas', 'Fries', '/assets/products/generic/food.svg', TRUE),
  ('Comidas', 'Pizza Margherita', '/assets/products/generic/food.svg', TRUE),
  ('Comidas', 'Pasta Alfredo', '/assets/products/generic/food.svg', TRUE),
  ('Comidas', 'Garden Salad', '/assets/products/generic/food.svg', TRUE),
  ('Comidas', 'Chicken Sandwich', '/assets/products/generic/food.svg', TRUE),
  ('Comidas', 'Veggie Wrap', '/assets/products/generic/food.svg', TRUE),
  ('Comidas', 'Grilled Chicken Plate', '/assets/products/generic/food.svg', TRUE),
  ('Comidas', 'Steak Plate', '/assets/products/generic/food.svg', TRUE),
  ('Comidas', 'Fish and Chips', '/assets/products/generic/food.svg', TRUE),
  ('Comidas', 'Soup of the Day', '/assets/products/generic/food.svg', TRUE),
  ('Comidas', 'Rice Bowl', '/assets/products/generic/food.svg', TRUE),
  ('Comidas', 'Breakfast Omelet', '/assets/products/generic/food.svg', TRUE),
  ('Comidas', 'Pancakes', '/assets/products/generic/food.svg', TRUE),

  -- Coqueteis (10)
  ('Coqueteis', 'Mojito', '/assets/products/generic/cocktail.svg', TRUE),
  ('Coqueteis', 'Margarita', '/assets/products/generic/cocktail.svg', TRUE),
  ('Coqueteis', 'Negroni', '/assets/products/generic/cocktail.svg', TRUE),
  ('Coqueteis', 'Old Fashioned', '/assets/products/generic/cocktail.svg', TRUE),
  ('Coqueteis', 'Moscow Mule', '/assets/products/generic/cocktail.svg', TRUE),
  ('Coqueteis', 'Whiskey Sour', '/assets/products/generic/cocktail.svg', TRUE),
  ('Coqueteis', 'Gin Tonic', '/assets/products/generic/cocktail.svg', TRUE),
  ('Coqueteis', 'Daiquiri', '/assets/products/generic/cocktail.svg', TRUE),
  ('Coqueteis', 'Pina Colada', '/assets/products/generic/cocktail.svg', TRUE),
  ('Coqueteis', 'Orange Spritz', '/assets/products/generic/cocktail.svg', TRUE);
