-- =============================================================================
-- INVENTORY + STOCK ENGINE - MVP Completo
-- =============================================================================
-- Data: 2026-01-26
-- Objetivo: Sistema de inventário (equipamentos) e estoque (ingredientes) 
--           conectado ao Menu, Pedidos e Task Engine
-- =============================================================================

-- =============================================================================
-- 1. LOCAIS (onde as coisas existem)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('KITCHEN', 'BAR', 'STORAGE', 'SERVICE', 'OTHER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (restaurant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_locations_restaurant ON public.gm_locations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_locations_kind ON public.gm_locations(restaurant_id, kind);

COMMENT ON TABLE public.gm_locations IS 'Locais físicos do restaurante (cozinha, bar, estoque, etc)';
COMMENT ON COLUMN public.gm_locations.kind IS 'Tipo de local: KITCHEN, BAR, STORAGE, SERVICE, OTHER';

-- =============================================================================
-- 2. EQUIPAMENTOS (inventário físico)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.gm_locations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,                 -- "Geladeira 1", "Chapa"
  kind TEXT NOT NULL CHECK (kind IN (
    'FRIDGE','FREEZER','OVEN','GRILL','PLANCHA','COFFEE_MACHINE','ICE_MACHINE','KEG_SYSTEM','SHELF','OTHER'
  )),
  capacity_note TEXT,                 -- opcional (ex: "4 burgers simultâneos")
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (restaurant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_equipment_restaurant ON public.gm_equipment(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_equipment_location ON public.gm_equipment(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_equipment_active ON public.gm_equipment(restaurant_id, is_active) WHERE is_active = true;

COMMENT ON TABLE public.gm_equipment IS 'Equipamentos físicos do restaurante (geladeiras, chapas, fornos, etc)';
COMMENT ON COLUMN public.gm_equipment.capacity_note IS 'Nota sobre capacidade (ex: "4 burgers simultâneos")';
COMMENT ON COLUMN public.gm_equipment.is_active IS 'Se false, equipamento está inativo/desativado';

-- =============================================================================
-- 3. INGREDIENTES (o que se mede)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('g','kg','ml','l','unit')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (restaurant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_ingredients_restaurant ON public.gm_ingredients(restaurant_id);

COMMENT ON TABLE public.gm_ingredients IS 'Ingredientes que podem ser medidos e consumidos';
COMMENT ON COLUMN public.gm_ingredients.unit IS 'Unidade de medida: g, kg, ml, l, unit';

-- =============================================================================
-- 4. ESTOQUE POR LOCAL (quantidade atual + mínimo)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.gm_locations(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.gm_ingredients(id) ON DELETE CASCADE,
  qty NUMERIC NOT NULL DEFAULT 0,      -- quantidade atual
  min_qty NUMERIC NOT NULL DEFAULT 0,  -- mínimo operacional
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (restaurant_id, location_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_restaurant ON public.gm_stock_levels(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON public.gm_stock_levels(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_ingredient ON public.gm_stock_levels(ingredient_id);
-- Índice crítico: estoque baixo (para tarefas automáticas)
CREATE INDEX IF NOT EXISTS idx_stock_low ON public.gm_stock_levels(restaurant_id, location_id) 
  WHERE qty <= min_qty AND min_qty > 0;

COMMENT ON TABLE public.gm_stock_levels IS 'Níveis de estoque por local e ingrediente';
COMMENT ON COLUMN public.gm_stock_levels.qty IS 'Quantidade atual disponível';
COMMENT ON COLUMN public.gm_stock_levels.min_qty IS 'Quantidade mínima operacional (abaixo disso gera tarefa)';

-- =============================================================================
-- 5. RECEITA DO PRODUTO (BOM: product -> ingredientes)
-- =============================================================================
-- Liga MenuBuilder (gm_products) ao estoque
CREATE TABLE IF NOT EXISTS public.gm_product_bom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.gm_products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.gm_ingredients(id) ON DELETE CASCADE,
  qty_per_unit NUMERIC NOT NULL,           -- ex: 150 (g)
  station TEXT NOT NULL CHECK (station IN ('KITCHEN','BAR')),
  preferred_location_kind TEXT,            -- ex: 'KITCHEN' ou 'BAR' (opcional)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (restaurant_id, product_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_bom_product ON public.gm_product_bom(product_id);
CREATE INDEX IF NOT EXISTS idx_bom_ingredient ON public.gm_product_bom(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_bom_restaurant ON public.gm_product_bom(restaurant_id);

COMMENT ON TABLE public.gm_product_bom IS 'Bill of Materials: receita do produto (quanto de cada ingrediente)';
COMMENT ON COLUMN public.gm_product_bom.qty_per_unit IS 'Quantidade do ingrediente por unidade do produto (ex: 150g de carne por hambúrguer)';
COMMENT ON COLUMN public.gm_product_bom.station IS 'Estação que usa este ingrediente: KITCHEN ou BAR';
COMMENT ON COLUMN public.gm_product_bom.preferred_location_kind IS 'Local preferencial para buscar estoque (opcional)';

-- =============================================================================
-- 6. LEDGER DE MOVIMENTOS (entrada/saída/reserva/consumo)
-- =============================================================================
-- Auditoria completa de movimentação de estoque
CREATE TABLE IF NOT EXISTS public.gm_stock_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.gm_locations(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.gm_ingredients(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.gm_orders(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES public.gm_order_items(id) ON DELETE SET NULL,

  action TEXT NOT NULL CHECK (action IN ('IN','OUT','RESERVE','RELEASE','CONSUME','ADJUST')),
  qty NUMERIC NOT NULL,                 -- positivo sempre
  reason TEXT,
  created_by_role TEXT,
  created_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_restaurant_time ON public.gm_stock_ledger(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_location ON public.gm_stock_ledger(location_id);
CREATE INDEX IF NOT EXISTS idx_ledger_ingredient ON public.gm_stock_ledger(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ledger_order ON public.gm_stock_ledger(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_order_item ON public.gm_stock_ledger(order_item_id) WHERE order_item_id IS NOT NULL;

COMMENT ON TABLE public.gm_stock_ledger IS 'Ledger completo de movimentação de estoque (auditoria)';
COMMENT ON COLUMN public.gm_stock_ledger.action IS 'Ação: IN (entrada), OUT (saída), RESERVE (reserva), RELEASE (libera reserva), CONSUME (consome), ADJUST (ajuste manual)';
COMMENT ON COLUMN public.gm_stock_ledger.qty IS 'Quantidade (sempre positiva)';
COMMENT ON COLUMN public.gm_stock_ledger.reason IS 'Motivo da movimentação (opcional)';

-- =============================================================================
-- 7. ATUALIZAR TASK ENGINE (adicionar novos tipos de tarefa)
-- =============================================================================
-- Adicionar novos tipos de tarefa relacionados a estoque
-- Nota: A constraint CHECK em gm_tasks precisa ser alterada via ALTER TABLE
-- Mas como a tabela já existe, vamos criar uma migration separada para isso
-- (será feito no commit 2 junto com a RPC)
