-- 20260111_enable_rls_and_indexes.sql
-- Ativar RLS e criar policies para isolamento multi-tenant

-- 1. gm_orders
ALTER TABLE public.gm_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only restaurant members can access their orders"
  ON public.gm_orders
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
  ));

-- 2. gm_order_items
ALTER TABLE public.gm_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only restaurant members can access their order items"
  ON public.gm_order_items
  USING (order_id IN (
    SELECT id FROM gm_orders WHERE restaurant_id IN (
      SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
    )
  ));

-- 3. gm_tables
ALTER TABLE public.gm_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only restaurant members can access their tables"
  ON public.gm_tables
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
  ));

-- 4. gm_cash_registers
ALTER TABLE public.gm_cash_registers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only restaurant members can access their cash registers"
  ON public.gm_cash_registers
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
  ));

-- 5. gm_payments
ALTER TABLE public.gm_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only restaurant members can access their payments"
  ON public.gm_payments
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
  ));

-- UNIQUE INDEX para evitar race condition em pedidos abertos por mesa
CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_orders_active_table
  ON gm_orders(restaurant_id, table_id)
  WHERE status IN ('OPEN', 'IN_PREP', 'READY');

-- Índices críticos para performance
CREATE INDEX IF NOT EXISTS idx_gm_orders_active
  ON gm_orders(restaurant_id, status)
  WHERE status IN ('OPEN', 'IN_PREP', 'READY');

CREATE INDEX IF NOT EXISTS idx_gm_products_available
  ON gm_products(restaurant_id, available)
  WHERE available = true;
