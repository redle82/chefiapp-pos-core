-- ==============================================================================
-- ChefIApp - Seed 10 Restaurantes (Validação Rápida)
-- ==============================================================================
-- Execução: docker compose exec postgres psql -U postgres -d chefiapp_test -f /docker-entrypoint-initdb.d/seed-10.sql
-- ==============================================================================

-- Limpar dados anteriores
TRUNCATE gm_order_items, gm_orders, gm_tasks, employees, gm_products, gm_menu_categories, gm_tables, gm_restaurants CASCADE;

-- ==============================================================================
-- RESTAURANTES (10)
-- ==============================================================================

INSERT INTO gm_restaurants (id, name, slug) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Restaurante Alpha', 'restaurante-alpha'),
  ('11111111-0000-0000-0000-000000000002', 'Restaurante Beta', 'restaurante-beta'),
  ('11111111-0000-0000-0000-000000000003', 'Restaurante Gamma', 'restaurante-gamma'),
  ('11111111-0000-0000-0000-000000000004', 'Restaurante Delta', 'restaurante-delta'),
  ('11111111-0000-0000-0000-000000000005', 'Restaurante Epsilon', 'restaurante-epsilon'),
  ('11111111-0000-0000-0000-000000000006', 'Restaurante Zeta', 'restaurante-zeta'),
  ('11111111-0000-0000-0000-000000000007', 'Restaurante Eta', 'restaurante-eta'),
  ('11111111-0000-0000-0000-000000000008', 'Restaurante Theta', 'restaurante-theta'),
  ('11111111-0000-0000-0000-000000000009', 'Restaurante Iota', 'restaurante-iota'),
  ('11111111-0000-0000-0000-000000000010', 'Restaurante Kappa', 'restaurante-kappa');

-- ==============================================================================
-- CATEGORIAS (4 por restaurante = 40 total)
-- ==============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM gm_restaurants LOOP
    INSERT INTO gm_menu_categories (restaurant_id, name, sort_order) VALUES
      (r.id, 'Entradas', 1),
      (r.id, 'Principais', 2),
      (r.id, 'Bebidas', 3),
      (r.id, 'Sobremesas', 4);
  END LOOP;
END $$;

-- ==============================================================================
-- PRODUTOS (12 por restaurante = 120 total)
-- ==============================================================================

DO $$
DECLARE
  r RECORD;
  cat_entradas UUID;
  cat_principais UUID;
  cat_bebidas UUID;
  cat_sobremesas UUID;
BEGIN
  FOR r IN SELECT id FROM gm_restaurants LOOP
    -- Buscar categorias do restaurante
    SELECT id INTO cat_entradas FROM gm_menu_categories WHERE restaurant_id = r.id AND name = 'Entradas';
    SELECT id INTO cat_principais FROM gm_menu_categories WHERE restaurant_id = r.id AND name = 'Principais';
    SELECT id INTO cat_bebidas FROM gm_menu_categories WHERE restaurant_id = r.id AND name = 'Bebidas';
    SELECT id INTO cat_sobremesas FROM gm_menu_categories WHERE restaurant_id = r.id AND name = 'Sobremesas';
    
    -- Entradas
    INSERT INTO gm_products (restaurant_id, category_id, name, price_cents, available) VALUES
      (r.id, cat_entradas, 'Bruschetta', 850, true),
      (r.id, cat_entradas, 'Croquetas', 750, true),
      (r.id, cat_entradas, 'Nachos Supreme', 1100, true);
    
    -- Principais
    INSERT INTO gm_products (restaurant_id, category_id, name, price_cents, available) VALUES
      (r.id, cat_principais, 'Paella Valenciana', 1850, true),
      (r.id, cat_principais, 'Risotto Funghi', 1650, true),
      (r.id, cat_principais, 'Filete Mignon', 2450, true);
    
    -- Bebidas
    INSERT INTO gm_products (restaurant_id, category_id, name, price_cents, available) VALUES
      (r.id, cat_bebidas, 'Água Mineral', 300, true),
      (r.id, cat_bebidas, 'Cerveja Artesanal', 650, true),
      (r.id, cat_bebidas, 'Vinho Tinto', 850, true);
    
    -- Sobremesas
    INSERT INTO gm_products (restaurant_id, category_id, name, price_cents, available) VALUES
      (r.id, cat_sobremesas, 'Tiramisú', 750, true),
      (r.id, cat_sobremesas, 'Crème Brûlée', 850, true),
      (r.id, cat_sobremesas, 'Gelato', 550, true);
  END LOOP;
END $$;

-- ==============================================================================
-- MESAS (10 por restaurante = 100 total)
-- ==============================================================================

DO $$
DECLARE
  r RECORD;
  i INT;
BEGIN
  FOR r IN SELECT id FROM gm_restaurants LOOP
    FOR i IN 1..10 LOOP
      INSERT INTO gm_tables (restaurant_id, number, status, qr_code) VALUES
        (r.id, i, 'closed', 'QR-' || SUBSTRING(r.id::text, 1, 8) || '-' || i);
    END LOOP;
  END LOOP;
END $$;

-- ==============================================================================
-- STAFF (9 por restaurante = 90 total)
-- ==============================================================================

DO $$
DECLARE
  r RECORD;
  names TEXT[] := ARRAY['Carlos', 'María', 'Juan', 'Ana', 'Pedro', 'Laura', 'Miguel', 'Carmen', 'José'];
  surnames TEXT[] := ARRAY['García', 'López', 'Martínez', 'Rodríguez', 'Sánchez', 'Fernández', 'Torres', 'Ruiz', 'Díaz'];
BEGIN
  FOR r IN SELECT id FROM gm_restaurants LOOP
    -- Owner
    INSERT INTO employees (restaurant_id, name, role, position, pin, active) VALUES
      (r.id, names[1] || ' ' || surnames[1], 'owner', 'manager', '1111', true);
    
    -- Manager
    INSERT INTO employees (restaurant_id, name, role, position, pin, active) VALUES
      (r.id, names[2] || ' ' || surnames[2], 'manager', 'manager', '2222', true);
    
    -- Waiters (3)
    INSERT INTO employees (restaurant_id, name, role, position, pin, active) VALUES
      (r.id, names[3] || ' ' || surnames[3], 'worker', 'waiter', '3333', true),
      (r.id, names[4] || ' ' || surnames[4], 'worker', 'waiter', '4444', true),
      (r.id, names[5] || ' ' || surnames[5], 'worker', 'waiter', '5555', true);
    
    -- Kitchen (2)
    INSERT INTO employees (restaurant_id, name, role, position, pin, active) VALUES
      (r.id, names[6] || ' ' || surnames[6], 'worker', 'kitchen', '6666', true),
      (r.id, names[7] || ' ' || surnames[7], 'worker', 'kitchen', '7777', true);
    
    -- Cleaning (2)
    INSERT INTO employees (restaurant_id, name, role, position, pin, active) VALUES
      (r.id, names[8] || ' ' || surnames[8], 'worker', 'cleaning', '8888', true),
      (r.id, names[9] || ' ' || surnames[9], 'worker', 'cleaning', '9999', true);
  END LOOP;
END $$;

-- ==============================================================================
-- VERIFICAÇÃO
-- ==============================================================================

SELECT 'SEED COMPLETO' AS status;
SELECT 'Restaurantes: ' || COUNT(*) FROM gm_restaurants;
SELECT 'Categorias: ' || COUNT(*) FROM gm_menu_categories;
SELECT 'Produtos: ' || COUNT(*) FROM gm_products;
SELECT 'Mesas: ' || COUNT(*) FROM gm_tables;
SELECT 'Staff: ' || COUNT(*) FROM employees;
