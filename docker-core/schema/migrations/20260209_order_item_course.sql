-- Gap #6: Courses / Rondas — permite agrupar itens de um pedido em "rondas" (courses)
-- para envio sequencial à cozinha.
-- Valor 1 = primeira ronda (padrão), 2 = segunda, etc.
ALTER TABLE gm_order_items ADD COLUMN IF NOT EXISTS course INTEGER DEFAULT 1;
