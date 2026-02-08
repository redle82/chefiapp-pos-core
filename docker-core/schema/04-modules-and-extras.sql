-- =============================================================================
-- CHEFIAPP CORE - TABELAS POR MÓDULO (initdb.d)
-- =============================================================================
-- Aplicado após 03-migrations-consolidated.sql.
-- Inclui: People/Members, Módulos instalados, Event Store, Legal Seals, Stock/Inventory.
-- Data: 2026-02-03
-- =============================================================================

-- =============================================================================
-- 1. PEOPLE / MEMBERS (gm_restaurant_members)
-- =============================================================================
-- BootstrapPage, TenantContext, FlowGate, PulseReader, DbWriteGate.
CREATE TABLE IF NOT EXISTS public.gm_restaurant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT DEFAULT 'staff',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gm_restaurant_members_user ON public.gm_restaurant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_gm_restaurant_members_restaurant ON public.gm_restaurant_members(restaurant_id);

COMMENT ON TABLE public.gm_restaurant_members IS 'Membros do restaurante (people). Bootstrap e runtime.';

-- =============================================================================
-- 2. MÓDULOS INSTALADOS (installed_modules, module_permissions)
-- =============================================================================
-- RuntimeReader, RuntimeWriter, ConfigModulesPage, TPVInstaller, RestaurantRuntimeContext.
CREATE TABLE IF NOT EXISTS public.installed_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    module_id VARCHAR NOT NULL,
    module_name VARCHAR NOT NULL,
    version VARCHAR DEFAULT '1.0.0',
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    config JSONB DEFAULT '{}'::jsonb,
    dependencies TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(restaurant_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_installed_modules_restaurant ON public.installed_modules(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_installed_modules_status ON public.installed_modules(status);
CREATE INDEX IF NOT EXISTS idx_installed_modules_module_id ON public.installed_modules(module_id);

CREATE TABLE IF NOT EXISTS public.module_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    module_id VARCHAR NOT NULL,
    role VARCHAR NOT NULL,
    permissions TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, module_id, role)
);

CREATE INDEX IF NOT EXISTS idx_module_permissions_restaurant ON public.module_permissions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_module_permissions_module ON public.module_permissions(module_id);

COMMENT ON TABLE public.installed_modules IS 'Módulos instalados por restaurante (TPV, KDS, tasks, etc).';

-- =============================================================================
-- 3. EVENT STORE + LEGAL SEALS (Event Sourcing, Reconciliação)
-- =============================================================================
-- ReconciliationEngine, EventSourcingService.
CREATE TABLE IF NOT EXISTS public.event_store (
    sequence_id   BIGSERIAL,
    event_id     UUID NOT NULL,
    stream_type  TEXT NOT NULL,
    stream_id    TEXT NOT NULL,
    stream_version INTEGER NOT NULL,
    event_type   TEXT NOT NULL,
    payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
    meta         JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    idempotency_key TEXT,
    PRIMARY KEY (event_id),
    UNIQUE (stream_type, stream_id, stream_version)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_store_idempotency
  ON public.event_store (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_store_stream
  ON public.event_store (stream_type, stream_id);

COMMENT ON TABLE public.event_store IS 'Event Sourcing. Reconciliação e concorrência.';

CREATE SEQUENCE IF NOT EXISTS public.legal_seals_legal_sequence_id_seq;

CREATE TABLE IF NOT EXISTS public.legal_seals (
    seal_id       TEXT NOT NULL,
    entity_type   TEXT NOT NULL,
    entity_id     TEXT NOT NULL,
    legal_state   TEXT NOT NULL,
    seal_event_id UUID NOT NULL,
    stream_hash   TEXT NOT NULL,
    financial_state_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    sealed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    legal_sequence_id INTEGER NOT NULL DEFAULT nextval('public.legal_seals_legal_sequence_id_seq'::regclass),
    PRIMARY KEY (seal_id),
    UNIQUE (entity_type, entity_id, legal_state)
);

CREATE INDEX IF NOT EXISTS idx_legal_seals_entity
  ON public.legal_seals (entity_type, entity_id);

COMMENT ON TABLE public.legal_seals IS 'Legal seals por entidade. CoreTransactionManager.';

GRANT ALL ON public.event_store TO postgres;
GRANT ALL ON public.legal_seals TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- =============================================================================
-- 4. STOCK / INVENTORY (gm_locations, gm_equipment, gm_ingredients, gm_stock_levels, gm_product_bom, gm_stock_ledger)
-- =============================================================================
-- InventoryStockReader, StockWriter, ShoppingListMinimal, simulate_order_stock_impact RPC.
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

CREATE TABLE IF NOT EXISTS public.gm_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.gm_locations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN (
        'FRIDGE','FREEZER','OVEN','GRILL','PLANCHA','COFFEE_MACHINE','ICE_MACHINE','KEG_SYSTEM','SHELF','OTHER'
    )),
    capacity_note TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (restaurant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_equipment_restaurant ON public.gm_equipment(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_equipment_location ON public.gm_equipment(location_id) WHERE location_id IS NOT NULL;

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

CREATE TABLE IF NOT EXISTS public.gm_stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.gm_locations(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.gm_ingredients(id) ON DELETE CASCADE,
    qty NUMERIC NOT NULL DEFAULT 0,
    min_qty NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (restaurant_id, location_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_restaurant ON public.gm_stock_levels(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_stock_location ON public.gm_stock_levels(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_ingredient ON public.gm_stock_levels(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stock_low ON public.gm_stock_levels(restaurant_id, location_id)
  WHERE qty <= min_qty AND min_qty > 0;

CREATE TABLE IF NOT EXISTS public.gm_product_bom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.gm_products(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.gm_ingredients(id) ON DELETE CASCADE,
    qty_per_unit NUMERIC NOT NULL,
    station TEXT NOT NULL CHECK (station IN ('KITCHEN','BAR')),
    preferred_location_kind TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (restaurant_id, product_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_bom_product ON public.gm_product_bom(product_id);
CREATE INDEX IF NOT EXISTS idx_bom_ingredient ON public.gm_product_bom(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_bom_restaurant ON public.gm_product_bom(restaurant_id);

CREATE TABLE IF NOT EXISTS public.gm_stock_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.gm_locations(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.gm_ingredients(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.gm_orders(id) ON DELETE SET NULL,
    order_item_id UUID REFERENCES public.gm_order_items(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('IN','OUT','RESERVE','RELEASE','CONSUME','ADJUST')),
    qty NUMERIC NOT NULL,
    reason TEXT,
    created_by_role TEXT,
    created_by_user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_restaurant_time ON public.gm_stock_ledger(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_location ON public.gm_stock_ledger(location_id);
CREATE INDEX IF NOT EXISTS idx_ledger_ingredient ON public.gm_stock_ledger(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ledger_order ON public.gm_stock_ledger(order_id) WHERE order_id IS NOT NULL;

COMMENT ON TABLE public.gm_locations IS 'Locais físicos (cozinha, bar, estoque).';
COMMENT ON TABLE public.gm_ingredients IS 'Ingredientes medidos (stock).';
COMMENT ON TABLE public.gm_stock_levels IS 'Níveis de estoque por local e ingrediente.';
COMMENT ON TABLE public.gm_product_bom IS 'Bill of Materials: produto -> ingredientes.';
COMMENT ON TABLE public.gm_stock_ledger IS 'Ledger de movimentação de estoque.';

-- =============================================================================
-- FIM 04-modules-and-extras.sql
-- =============================================================================
