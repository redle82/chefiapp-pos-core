-- =============================================================================
-- Menu digital: catálogo visual de decisão (Docker Core — PostgreSQL)
-- =============================================================================
-- Data: 2026-02-06
-- Spec: docs/architecture/MENU_CATALOG_VISUAL_SPEC.md
-- Backend: Docker Core (PostgreSQL). Media: image_url/video_url (URLs; WebP no app).
-- =============================================================================

-- 0. Função updated_at (idempotente; pode já existir noutras migrações)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Feature flag por restaurante
-- =============================================================================
ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS menu_catalog_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.gm_restaurants.menu_catalog_enabled IS 'Se true, o catálogo visual (menu digital) está ativo para este restaurante.';

-- 2. Menu (cabeça do catálogo; um ativo por restaurante é o caso comum)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_catalog_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gm_catalog_menus_restaurant ON public.gm_catalog_menus(restaurant_id);
CREATE INDEX idx_gm_catalog_menus_active ON public.gm_catalog_menus(restaurant_id, is_active) WHERE is_active = true;

COMMENT ON TABLE public.gm_catalog_menus IS 'Menu do catálogo visual (um ativo por restaurante é o caso comum).';

-- 3. Categoria do catálogo (header visual que “cola” no scroll)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_catalog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.gm_catalog_menus(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gm_catalog_categories_menu ON public.gm_catalog_categories(menu_id);

COMMENT ON TABLE public.gm_catalog_categories IS 'Categorias do catálogo visual (ex.: Entrantes, Carnes).';

-- 4. Item do catálogo (prato = unidade de conversão)
-- Regra: sem imagem boa não aparece — validar no app (image_url preenchido e válido).
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.gm_catalog_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  video_url TEXT,
  allergens JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gm_catalog_items_category ON public.gm_catalog_items(category_id);
CREATE INDEX idx_gm_catalog_items_available ON public.gm_catalog_items(category_id, is_available) WHERE is_available = true;

COMMENT ON TABLE public.gm_catalog_items IS 'Prato do catálogo visual. Regra: sem image_url válido não exibir no catálogo.';
COMMENT ON COLUMN public.gm_catalog_items.allergens IS 'Array de códigos (ex.: gluten, lactose, huevos).';
COMMENT ON COLUMN public.gm_catalog_items.video_url IS 'Opcional; vídeo só carrega ao abrir o prato (performance).';

-- Trigger updated_at (função update_updated_at_column já existe noutras migrações do Core)
-- =============================================================================
DROP TRIGGER IF EXISTS update_gm_catalog_menus_updated_at ON public.gm_catalog_menus;
CREATE TRIGGER update_gm_catalog_menus_updated_at
  BEFORE UPDATE ON public.gm_catalog_menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gm_catalog_items_updated_at ON public.gm_catalog_items;
CREATE TRIGGER update_gm_catalog_items_updated_at
  BEFORE UPDATE ON public.gm_catalog_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
