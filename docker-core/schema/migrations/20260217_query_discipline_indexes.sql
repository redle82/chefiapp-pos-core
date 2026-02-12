-- Migration: Query Discipline — índices compostos para listagens por restaurante (1000-ready)
-- Data: 2026-02-11
-- Objetivo: Garantir que listagens operacionais por restaurant_id usam índices compostos
--           para evitar full scan em escala. Nenhuma alteração de lógica.
-- Referência: docs/audit/QUERY_DISCIPLINE_CHECKLIST.md

-- gm_orders: listagens por restaurante ordenadas por data (readActiveOrders, readOrdersByDateRange)
-- core_schema já tem idx_orders_restaurant_status e idx_orders_created_at separados;
-- índice composto (restaurant_id, created_at DESC) optimiza listagens "pedidos do restaurante por data"
CREATE INDEX IF NOT EXISTS idx_gm_orders_restaurant_created
  ON public.gm_orders(restaurant_id, created_at DESC);

COMMENT ON INDEX idx_gm_orders_restaurant_created IS
  'Query discipline: listagens por restaurante ordenadas por data (1000-ready).';

-- gm_order_items: acesso por order_id já coberto por idx_order_items_order_id (core_schema).
-- gm_reservations: já tem idx_reservations_restaurant_date (20260209).
-- gm_equipment: já tem idx_equipment_restaurant e idx_equipment_active (20260126 / 04-modules).
-- gm_tables: já tem idx_tables_restaurant (core_schema).
