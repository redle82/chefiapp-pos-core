-- =============================================================================
-- Seed Sofia Gastrobar — restaurante exemplo único (menu completo)
-- =============================================================================
-- Pré-requisitos: seeds_dev.sql; gm_restaurant_people, gm_staff, gm_tasks,
-- gm_catalog_*, gm_catalog_items.badges (20260207_gm_catalog_items_badges.sql),
-- gm_menu_categories, gm_products.
-- Objetivo: demo, seed local, referência visual e operacional.
-- =============================================================================

-- 0. Restaurante
UPDATE public.gm_restaurants
SET name = 'Sofia Gastrobar', slug = 'sofia-gastrobar', menu_catalog_enabled = true
WHERE id = '00000000-0000-0000-0000-000000000100';

-- 1. Pessoas operacionais (gm_restaurant_people) — check-in AppStaff
DELETE FROM public.gm_restaurant_people WHERE restaurant_id = '00000000-0000-0000-0000-000000000100';
INSERT INTO public.gm_restaurant_people (restaurant_id, name, role, staff_code, qr_token)
VALUES
  ('00000000-0000-0000-0000-000000000100', 'Sofia', 'manager', 'SOFIA', NULL),
  ('00000000-0000-0000-0000-000000000100', 'Alex', 'staff', 'ALEX', NULL),
  ('00000000-0000-0000-0000-000000000100', 'Maria', 'staff', 'MARIA', NULL);

-- 2. Staff operacional (gm_staff) — alinhar nomes; manter IDs para shift_logs
INSERT INTO public.gm_staff (id, restaurant_id, name, role, active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000100', 'Sofia', 'manager', true),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000100', 'Alex', 'waiter', true),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000100', 'Maria', 'kitchen', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

-- 3. Um turno ativo (shift_logs)
INSERT INTO public.shift_logs (restaurant_id, employee_id, role, status)
SELECT
  '00000000-0000-0000-0000-000000000100',
  'a0000000-0000-0000-0000-000000000001',
  'manager',
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.shift_logs
  WHERE restaurant_id = '00000000-0000-0000-0000-000000000100' AND status = 'active'
)
LIMIT 1;

-- 4. Tarefas abertas (gm_tasks)
INSERT INTO public.gm_tasks (restaurant_id, task_type, station, priority, message, status)
SELECT r.id, t.task_type, t.station, t.priority, t.message, 'OPEN'
FROM public.gm_restaurants r
CROSS JOIN (VALUES
  ('MODO_INTERNO', 'KITCHEN', 'MEDIA', 'Verificar stocks da cozinha'),
  ('MODO_INTERNO', 'BAR', 'LOW', 'Limpar zona do bar'),
  ('MODO_INTERNO', 'SERVICE', 'MEDIA', 'Confirmar reservas do dia'),
  ('ATRASO_ITEM', 'KITCHEN', 'ALTA', 'Item em atraso — seguir up'),
  ('MODO_INTERNO', 'KITCHEN', 'LOW', 'Checklist pré-service')
) AS t(task_type, station, priority, message)
WHERE r.id = '00000000-0000-0000-0000-000000000100'
  AND NOT EXISTS (SELECT 1 FROM public.gm_tasks WHERE restaurant_id = r.id AND status = 'OPEN' LIMIT 1);

-- =============================================================================
-- 5. Menu digital (gm_catalog_*) — limpar e inserir menu completo
-- =============================================================================
DELETE FROM public.gm_catalog_items WHERE category_id IN (
  SELECT id FROM public.gm_catalog_categories WHERE menu_id IN (
    SELECT id FROM public.gm_catalog_menus WHERE restaurant_id = '00000000-0000-0000-0000-000000000100'
  )
);
DELETE FROM public.gm_catalog_categories WHERE menu_id IN (
  SELECT id FROM public.gm_catalog_menus WHERE restaurant_id = '00000000-0000-0000-0000-000000000100'
);
DELETE FROM public.gm_catalog_menus WHERE restaurant_id = '00000000-0000-0000-0000-000000000100';

INSERT INTO public.gm_catalog_menus (id, restaurant_id, name, language, is_active)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000100',
  'Carta Sofia Gastrobar',
  'es',
  true
);

-- 15 categorias (sort_order 0..14)
INSERT INTO public.gm_catalog_categories (id, menu_id, title, sort_order) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Tapas & Entradas', 0),
  ('c0000002-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Gastroburgers', 1),
  ('c0000003-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Pizzas Artesanas', 2),
  ('c0000004-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Platos Principales', 3),
  ('c0000005-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Ensaladas', 4),
  ('c0000006-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'Zumos & Bowls', 5),
  ('c0000007-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'Postres', 6),
  ('c0000008-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'Sangrías & Cocteles', 7),
  ('c0000009-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'Copas y Chupitos', 8),
  ('c000000a-0000-0000-0000-00000000000a', 'b0000000-0000-0000-0000-000000000001', 'Licores', 9),
  ('c000000b-0000-0000-0000-00000000000b', 'b0000000-0000-0000-0000-000000000001', 'Vinos & Espumantes', 10),
  ('c000000c-0000-0000-0000-00000000000c', 'b0000000-0000-0000-0000-000000000001', 'Cervezas & Refrescos', 11),
  ('c000000d-0000-0000-0000-00000000000d', 'b0000000-0000-0000-0000-000000000001', 'Tostadas & Croissants', 12),
  ('c000000e-0000-0000-0000-00000000000e', 'b0000000-0000-0000-0000-000000000001', 'Cafés & Infusiones', 13),
  ('c000000f-0000-0000-0000-00000000000f', 'b0000000-0000-0000-0000-000000000001', 'VIP Party Packs', 14);

-- Imagem placeholder por categoria (Unsplash)
-- Tapas: 1541529086526; Burgers: 1568901346375; Pizza: 1565299585323; Principales: 1546833999; Ensaladas: 1512624; Zumos: 1621264; Postres: 1571877227200; Sangría: 1536935338788; Copas: 151436; Licores: 141364; Vinos: 151081; Cervezas: 1536935338788; Tostadas: 144979; Cafés: 144251; VIP: 1550743194

-- 5a. Tapas & Entradas
INSERT INTO public.gm_catalog_items (category_id, title, description, price_cents, image_url, allergens, is_available, sort_order, badges)
SELECT 'c0000001-0000-0000-0000-000000000001', v.title, v.description, v.price_cents, v.image_url, v.allergens::jsonb, v.is_available, v.sort_order, v.badges::jsonb
FROM (VALUES
  ('Coração Crocante do Brasil | Coxinha', 'Croquetas doradas de pollo desmenuzado, al estilo brasileño, con toque de perejil.', 700, 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&q=80', '["hot","nut_free","dairy_free"]', true, 0, '["chef"]'),
  ('Patatas Fritas / French Fries', 'Papas doradas, crujientes, el acompañamiento perfecto.', 800, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80', '["vegetarian","vegan","gluten_free","nut_free"]', true, 1, '[]'),
  ('Boniato Frito / Fried Sweet Potato', 'Rodajas dulces y crujientes de boniato.', 900, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80', '[]', true, 2, '[]'),
  ('Bravas Ibicencas | Patatas Bravas', 'Patatas caseras con salsa picante.', 900, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80', '["hot","vegetarian","nut_free"]', true, 3, '[]'),
  ('Frango do Brasil | Fried Brazilian Chicken', 'Pollo marinado con cúrcuma y jengibre, rebozado en harina de garbanzo.', 1500, 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=800&q=80', '["nut_free","dairy_free"]', true, 4, '["mais_pedido"]'),
  ('Nachos de Gaia | Vegetarian Nachos', 'Totopos con cheddar, guacamole, pico de gallo y jalapeños.', 1400, 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80', '["hot","vegetarian","vegan","gluten_free","nut_free","dairy_free","raw"]', true, 5, '[]'),
  ('Nachos del Toro | Beef nachos', 'Cheddar fundido, carne suculenta, pico de gallo e guacamole da casa.', 1500, 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80', '[]', true, 6, '[]'),
  ('Nachos del Pecado | Bacon and beef nachos', 'Del Toro con bacon crocante.', 1600, 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80', '["hot","gluten_free","dairy_free","raw"]', true, 7, '[]'),
  ('Nachos del Caribe | Chicken Nachos', 'Frango desfiado, cheddar, guacamole, pico de gallo, jalapeño.', 1500, 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80', '["hot","gluten_free","nut_free","dairy_free","raw"]', true, 8, '[]'),
  ('Nachos del Crimen Perfecto | Chicken and Bacon', 'Frango + bacon + cheddar derretido.', 1600, 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80', '[]', true, 9, '[]'),
  ('Olivas', 'Olivas.', 200, 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&q=80', '[]', true, 10, '[]'),
  ('Salsa Mostaza Y miel', 'Mustard & honey sauce.', 150, 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&q=80', '[]', true, 11, '[]'),
  ('Salsa Alioli Negro', 'Garlic sauce made with black garlic.', 150, 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&q=80', '[]', true, 12, '[]'),
  ('Salsa Agridulce', 'Sweet & spicy sauce.', 150, 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&q=80', '[]', true, 13, '[]'),
  ('Salsa Brava', 'Spicy sauce.', 150, 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&q=80', '[]', true, 14, '[]'),
  ('Salsa de Mango', 'Mango sauce.', 0, 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=800&q=80', '[]', false, 15, '[]'),
  ('Brocheta de carne 100g', 'Brocheta de carne.', 500, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80', '[]', true, 16, '[]'),
  ('Brocheta de pollo 100g', 'Brocheta de pollo.', 500, 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=800&q=80', '[]', true, 17, '[]'),
  ('Carpaccio de ternera | beef carpaccio', 'Carpaccio con salsa de mostaza, lechuga mezclum, parmesano, alcaparras y pan.', 0, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80', '[]', false, 18, '[]'),
  ('Brocheta de pollo y bacon 100g', 'Brocheta de pollo y bacon.', 500, 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=800&q=80', '[]', true, 19, '[]')
) AS v(title, description, price_cents, image_url, allergens, is_available, sort_order, badges);

-- 5b. Gastroburgers (15 burgers)
INSERT INTO public.gm_catalog_items (category_id, title, description, price_cents, image_url, allergens, is_available, sort_order, badges)
SELECT 'c0000002-0000-0000-0000-000000000002', v.title, v.description, v.price_cents, v.image_url, v.allergens::jsonb, true, v.sort_order, v.badges::jsonb
FROM (VALUES
  ('Playa Burger', 'Hamburguesa clásica con 200g de buey, cheddar, tomate, cebolla morada y mayonesa en pan brioche.', 1500, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', '["nut_free","dairy_free","raw"]', 0, '[]'),
  ('Wild Egg', 'Hamburguesa con huevo campero XL, cheddar, tomate y cebolla morada.', 1600, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', '["nut_free","dairy_free","raw"]', 1, '[]'),
  ('Suntrip', 'Doble cheddar, bacon crujiente, cebolla morada y ketchup en pan brioche.', 1700, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', '["raw"]', 2, '[]'),
  ('Midnight Lover', 'Hamburguesa de buey con queso latino, aguacate y cebolla morada.', 1800, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', '["raw"]', 3, '[]'),
  ('No Drama', 'Pollo crujiente con cheddar, tomate, cebolla morada y mayonesa suave.', 1500, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', '["raw"]', 4, '[]'),
  ('Crystal Flame', 'Jalapeños, cheddar, bacon, salsa brava y cebolla morada.', 1800, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', '["hot","raw"]', 5, '["chef"]'),
  ('Gaia Soul', 'Burger veggie con queso de cabra, tomate y cebolla morada en pan de masa madre.', 1700, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', '["raw"]', 6, '["veggie"]'),
  ('Mystic Green', 'Buey, queso latino, aguacate y cebolla morada.', 1800, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', '["raw"]', 7, '[]'),
  ('Venus Trap', 'Pollo crujiente con cheddar doble, bacon y huevo campero.', 2000, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', '["nut_free","raw"]', 8, '["mais_pedido"]'),
  ('Zen Beast', 'Burger veggie con cheddar, huevo campero y cebolla morada.', 1700, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', '[]', 9, '[]'),
  ('Ocean Vibe', 'Burger veggie con aguacate, cebolla morada, ketchup y mayonesa.', 1600, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', '[]', 10, '[]'),
  ('Golden Mood', 'Picanha con cheddar doble, cebolla morada y salsa de miel y mostaza.', 1900, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', '["vegetarian","raw"]', 11, '[]'),
  ('Ibiza Star', 'Buey con cheddar, bacon, huevo, cebolla morada y salsa de la casa. El más completo.', 2100, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', '[]', 12, '["chef","mais_pedido"]'),
  ('Jungle Pollo', 'Pollo crujiente con aguacate, queso latino, cebolla morada y salsa especial.', 1800, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', '[]', 13, '[]'),
  ('Full Moon Veg', 'Burger veggie doble con cheddar, huevo campero y cebolla morada.', 1800, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', '[]', 14, '["veggie"]')
) AS v(title, description, price_cents, image_url, allergens, sort_order, badges);

-- 5c. Pizzas Artesanas
INSERT INTO public.gm_catalog_items (category_id, title, description, price_cents, image_url, allergens, is_available, sort_order, badges)
SELECT 'c0000003-0000-0000-0000-000000000003', v.title, v.description, v.price_cents, v.image_url, v.allergens::jsonb, true, v.sort_order, '[]'::jsonb
FROM (VALUES
  ('Mar y Sol', 'Clásica Margherita con salsa de tomate y mozzarella fundida.', 1450, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', '[]', 0),
  ('Fuego Ibiza', 'Salami picante, mezcla de pimientos marinados, jalapeños y mozzarella.', 1600, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', '[]', 1),
  ('Luna de Quesos', 'Cuatro quesos: mozzarella, edam, cheddar y queso de cabra sobre salsa de tomate.', 1600, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', '[]', 2),
  ('Verde Vida', 'Mezcla de verduras a la parrilla, mozzarella y aceite de oliva.', 1500, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', '[]', 3),
  ('Ibiza Royale', 'Jamón york, champiñones frescos, mozzarella y salsa de tomate.', 1600, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', '[]', 4),
  ('Pollo Soul', 'Pollo asado, mozzarella y salsa de tomate.', 1550, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', '[]', 5),
  ('Sol Latino', 'Jamón york, queso latino, pimientos marinados y mozzarella.', 1650, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', '[]', 6),
  ('Cheddar Lovers', 'Mozzarella y doble cheddar fundido sobre salsa de tomate.', 1550, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', '[]', 7)
) AS v(title, description, price_cents, image_url, allergens, sort_order);

-- 5d. Platos Principales
INSERT INTO public.gm_catalog_items (category_id, title, description, price_cents, image_url, allergens, is_available, sort_order, badges)
SELECT 'c0000004-0000-0000-0000-000000000004', v.title, v.description, v.price_cents, v.image_url, v.allergens::jsonb, true, v.sort_order, v.badges::jsonb
FROM (VALUES
  ('Salmón Boreal', 'Rodaja de salmón salvaje de Noruega a la plancha, con patatas y ensalada fresca.', 2600, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80', '["hot","gluten_free","nut_free","dairy_free","raw"]', 0, '["chef"]'),
  ('Vaca Brava', 'Chuletón de vaca (300g) a la parrilla con pimientos asados y patatas rústicas.', 2400, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80', '[]', 1, '[]'),
  ('Tentáculos del Mar', 'Patas de pulpo a la plancha con ensalada fresca y aceite de oliva virgen extra.', 2800, 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80', '[]', 2, '[]'),
  ('Feijoada Negra del Sol', 'Plato típico brasileño con frijoles negros, carne seca, costilla, chorizo y bacon. Con arroz, farofa y naranja.', 1600, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80', '[]', 3, '["mais_pedido"]'),
  ('Bobó de camarao', 'Puré de yuca con gambas. Acompañado con arroz.', 1600, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', '[]', 4, '[]')
) AS v(title, description, price_cents, image_url, allergens, sort_order, badges);

-- 5e. Ensaladas
INSERT INTO public.gm_catalog_items (category_id, title, description, price_cents, image_url, allergens, is_available, sort_order, badges)
SELECT 'c0000005-0000-0000-0000-000000000005', v.title, v.description, v.price_cents, v.image_url, v.allergens::jsonb, true, v.sort_order, '[]'::jsonb
FROM (VALUES
  ('Ensalada del Edén', 'Queso de cabra cremoso, frutos vermelhos, cebola crocante, mix de folhas, nozes e molho de mostaza e miel.', 1600, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', '["hot","vegetarian","dairy_free","raw"]', 0),
  ('Verde Vital | Green Salad', 'Mezclum, cebolla, pepino, zanahoria, tomate, cebolla frita, frutos secos, aguacate, manzana y tomate cherry.', 1300, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', '["vegetarian","vegan","gluten_free","dairy_free","raw"]', 1),
  ('Atlántico Fresco | Tuna Salad', 'Atún, mezclum, cebolla, nueces, pepino, tomate y salsa césar.', 1400, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', '["gluten_free","dairy_free","raw"]', 2),
  ('Salmón Zen | Salmon Salad', 'Salmón con mezclum, cebolla frita, aguacate, pepino, tomate, frutos secos, salsa de mostaza y miel y tomate cherry.', 1600, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', '["gluten_free","dairy_free","raw"]', 3)
) AS v(title, description, price_cents, image_url, allergens, sort_order);

-- 5f. Zumos & Bowls
INSERT INTO public.gm_catalog_items (category_id, title, description, price_cents, image_url, allergens, is_available, sort_order, badges)
SELECT 'c0000006-0000-0000-0000-000000000006', v.title, v.description, v.price_cents, v.image_url, v.allergens::jsonb, v.is_available, v.sort_order, '[]'::jsonb
FROM (VALUES
  ('Zumo de Naranja', 'Zumo natural de naranja recién exprimida.', 500, 'https://images.unsplash.com/photo-1621506283937-042d5ffd308b?w=800&q=80', '["vegetarian","vegan","gluten_free","nut_free","dairy_free","raw"]', true, 0),
  ('Zumo de Piña con Jengibre', 'Zumo de piña con jengibre fresco y hierbabuena.', 600, 'https://images.unsplash.com/photo-1621506283937-042d5ffd308b?w=800&q=80', '[]', true, 1),
  ('Zumo de Frutas del Bosque', 'Zumo de frutas del bosque.', 600, 'https://images.unsplash.com/photo-1621506283937-042d5ffd308b?w=800&q=80', '[]', true, 2),
  ('Zumo Fresa / Strawberry', 'Zumo de fresa.', 600, 'https://images.unsplash.com/photo-1621506283937-042d5ffd308b?w=800&q=80', '[]', true, 3),
  ('Zumo Mix a tu gusto', 'Crea tu combinación con hasta 3 frutas.', 700, 'https://images.unsplash.com/photo-1621506283937-042d5ffd308b?w=800&q=80', '[]', true, 4),
  ('Milkshake de Fresa', 'Batido cremoso de fresa con leche y nata.', 700, 'https://images.unsplash.com/photo-1572490122747-3968e75e392f?w=800&q=80', '[]', true, 5),
  ('Milkshake de Oreo', 'Batido de galletas Oreo con leche, cacao y nata.', 700, 'https://images.unsplash.com/photo-1572490122747-3968e75e392f?w=800&q=80', '[]', true, 6),
  ('Batido Proteico de Plátano', 'Batido con proteína vegetal, plátano y leche de avena.', 1000, 'https://images.unsplash.com/photo-1621506283937-042d5ffd308b?w=800&q=80', '[]', true, 7),
  ('Açaí Bowl', 'Pulpa de açaí con granola, frutas frescas y frutos secos.', 1300, 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80', '["vegetarian","vegan","gluten_free","dairy_free","raw"]', true, 8),
  ('Zumo de Maracuyá', 'Zumo de maracuyá.', 600, 'https://images.unsplash.com/photo-1621506283937-042d5ffd308b?w=800&q=80', '[]', true, 9),
  ('Zumo de Kiwi', 'Zumo de kiwi.', 700, 'https://images.unsplash.com/photo-1621506283937-042d5ffd308b?w=800&q=80', '[]', true, 10)
) AS v(title, description, price_cents, image_url, allergens, is_available, sort_order);

-- 5g. Postres
INSERT INTO public.gm_catalog_items (category_id, title, description, price_cents, image_url, allergens, is_available, sort_order, badges)
SELECT 'c0000007-0000-0000-0000-000000000007', v.title, v.description, v.price_cents, v.image_url, v.allergens::jsonb, true, v.sort_order, v.badges::jsonb
FROM (VALUES
  ('Cheesecake Soul', 'Tarta cremosa de queso con base de galleta y cobertura de frutos rojos.', 750, 'https://images.unsplash.com/photo-1533134242443-d4e215c0dc2c?w=800&q=80', '[]', 0, '["chef"]'),
  ('Muerte por Chocolate', 'Bizcocho intenso de chocolate con corazón suave y cobertura cremosa.', 700, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80', '["vegetarian","raw"]', 1, '[]'),
  ('Sonho', 'Pan brioche con dulce de leche y azúcar glas.', 400, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80', '[]', 2, '[]')
) AS v(title, description, price_cents, image_url, allergens, sort_order, badges);

-- 5h. Sangrías & Cocteles
INSERT INTO public.gm_catalog_items (category_id, title, description, price_cents, image_url, allergens, is_available, sort_order, badges)
SELECT 'c0000008-0000-0000-0000-000000000008', v.title, v.description, v.price_cents, v.image_url, '[]'::jsonb, true, v.sort_order, v.badges::jsonb
FROM (VALUES
  ('Red Sunset', 'Sangría clásica de vino tinto con frutas frescas, canela y toque cítrico.', 2600, 'https://images.unsplash.com/photo-1536935338788-423bbd787aeb?w=800&q=80', 0, '["mais_pedido"]'),
  ('White Breeze', 'Sangría de vino blanco, frutas tropicales y menta.', 2600, 'https://images.unsplash.com/photo-1536935338788-423bbd787aeb?w=800&q=80', 1, '[]'),
  ('Golden Bubbles', 'Sangría de cava con frutas naturales.', 2900, 'https://images.unsplash.com/photo-1536935338788-423bbd787aeb?w=800&q=80', 2, '[]'),
  ('Caipirinha Brasilera', 'Lima fresca, azúcar de caña, hielo y cachaça.', 1100, 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80', 3, '[]'),
  ('Piña Colada Tropical', 'Piña natural, licor de coco, ron blanco, zumo de piña y leche de coco.', 1100, 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80', 4, '[]'),
  ('Daiquiri de Frutas', 'Elegí entre fresa, mango, plátano o frutos rojos. Ron y hielo picado.', 1100, 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80', 5, '[]'),
  ('Mojito Clásico', 'Lima, hierbabuena, azúcar moreno, ron blanco, hielo y soda.', 1100, 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80', 6, '[]'),
  ('Aperol Spritz', 'Aperol, cava, hielo y soda.', 900, 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80', 7, '[]'),
  ('2x1 en mojitos', 'Dos mojitos al precio de uno.', 1000, 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80', 8, '[]')
) AS v(title, description, price_cents, image_url, sort_order, badges);

-- 5i. Copas y Chupitos (resumo)
INSERT INTO public.gm_catalog_items (category_id, title, description, price_cents, image_url, allergens, is_available, sort_order, badges)
SELECT 'c0000009-0000-0000-0000-000000000009', v.title, v.description, v.price_cents, 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80', '[]'::jsonb, v.is_available, v.sort_order, '[]'::jsonb
FROM (VALUES
  ('Chupito', 'Chupito.', 250, true, 0),
  ('Fireball', 'Fireball.', 0, false, 1),
  ('Chupito premium', 'Black Label, tequila patrón.', 800, true, 2),
  ('Hendricks', 'Gin Hendricks.', 1000, true, 3),
  ('Beefeater', 'Gin Beefeater.', 1000, true, 4),
  ('Tanqueray', 'Gin Tanqueray.', 1000, true, 5),
  ('Barcelo', 'Ron Barceló.', 1000, true, 6),
  ('Johnnie Walker', 'Johnnie Walker.', 1000, true, 7),
  ('Vodka Absolut', 'Vodka Absolut.', 1000, true, 8),
  ('Vodka Smirnoff', 'Vodka Smirnoff.', 600, true, 9),
  ('Copa de hierbas', 'Copa de hierbas.', 600, true, 10),
  ('Copa de Baileys', 'Copa de Baileys.', 600, true, 11)
) AS v(title, description, price_cents, is_available, sort_order);

-- 5j. Licores (resumo)
INSERT INTO public.gm_catalog_items (category_id, title, description, price_cents, image_url, allergens, is_available, sort_order, badges)
SELECT 'c000000a-0000-0000-0000-00000000000a', v.title, v.description, v.price_cents, 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80', '[]'::jsonb, v.is_available, v.sort_order, '[]'::jsonb
FROM (VALUES
  ('Johnnie Walker Red', 'Johnnie Walker Red.', 3900, true, 0),
  ('Johnnie Walker Black Label', 'Johnnie Walker Black Label.', 5500, true, 1),
  ('Jack Daniels', 'Jack Daniels.', 4100, true, 2),
  ('Gin Mare', 'Gin Mare.', 0, false, 3),
  ('Hendricks', 'Hendricks.', 5500, true, 4),
  ('Gin Tanqueray', 'Gin Tanqueray.', 3500, true, 5),
  ('Vodka Absolut', 'Vodka Absolut.', 3000, true, 6),
  ('Ron Barceló', 'Ron Dominicano Barceló.', 3900, true, 7),
  ('Havana Club 7', 'Havana Club 7.', 4500, true, 8),
  ('Hierbas Ibizenca', 'Hierbas Ibizenca Mari Mayahs.', 3000, true, 9),
  ('Bacardi', 'Bacardi.', 3000, true, 10),
  ('Vodka Grey Goose', 'Vodka Grey Goose.', 6000, true, 11),
  ('Hielo', 'Hielo.', 400, true, 12)
) AS v(title, description, price_cents, is_available, sort_order);

-- 5k. Vinos & Espumantes
INSERT INTO public.gm_catalog_items (category_id, title, description, price_cents, image_url, allergens, is_available, sort_order, badges)
SELECT 'c000000b-0000-0000-0000-00000000000b', v.title, v.description, v.price_cents, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80', '[]'::jsonb, true, v.sort_order, '[]'::jsonb
FROM (VALUES
  ('Botella cava', 'Botella cava.', 1900, 0),
  ('Vino rosado Marqués de Victoria', 'Vino rosado.', 500, 1)
) AS v(title, description, price_cents, sort_order);

-- 5l. Cervezas & Refrescos (resumo)
INSERT INTO public.gm_catalog_items (category_id, title, description, price_cents, image_url, allergens, is_available, sort_order, badges)
SELECT 'c000000c-0000-0000-0000-00000000000c', v.title, v.description, v.price_cents, 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&q=80', '[]'::jsonb, v.is_available, v.sort_order, '[]'::jsonb
FROM (VALUES
  ('Caña Estrella Galicia 250ml', 'Caña 250ml.', 300, true, 0),
  ('Jarra Estrella Galicia', 'Jarra.', 500, true, 1),
  ('Estrella Galicia botella 330ml', 'Botella 330ml.', 350, true, 2),
  ('Estrella Galicia 0,0%', 'Sin alcohol.', 300, true, 3),
  ('Desperados', 'Cerveza y tequila.', 0, false, 4),
  ('Corona', 'Corona.', 400, true, 5),
  ('Estrella Galicia 1906', '1906.', 400, true, 6),
  ('Agua 1L plástico', 'Agua 1L.', 300, true, 7),
  ('Agua con gas 33cl', 'Agua con gas.', 250, true, 8),
  ('Coca-Cola Lata 350ml', 'Coca-Cola.', 350, true, 9),
  ('Coca-Cola 0 Lata', 'Coca-Cola Zero.', 350, true, 10),
  ('Fanta Naranja Lata', 'Fanta Naranja.', 350, true, 11),
  ('Fanta Limón Lata', 'Fanta Limón.', 350, true, 12),
  ('Tónica', 'Tónica.', 250, true, 13),
  ('Nestea Lata', 'Nestea.', 350, true, 14),
  ('Aquarius Limón', 'Aquarius Limón.', 350, true, 15),
  ('Aquarius Naranja', 'Aquarius Naranja.', 350, true, 16),
  ('Red Bull 200ml', 'Red Bull.', 450, true, 17),
  ('Guaraná Antarctica', 'Guaraná.', 350, true, 18),
  ('Sprite', 'Sprite.', 350, true, 19),
  ('Agua de coco 250ml', 'Agua de coco.', 400, true, 20)
) AS v(title, description, price_cents, is_available, sort_order);

-- 5m. Tostadas & Croissants (resumo)
INSERT INTO public.gm_catalog_items (category_id, title, description, price_cents, image_url, allergens, is_available, sort_order, badges)
SELECT 'c000000d-0000-0000-0000-00000000000d', v.title, v.description, v.price_cents, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80', v.allergens::jsonb, true, v.sort_order, '[]'::jsonb
FROM (VALUES
  ('Tostada Mediterránea', 'Pan de masa madre tostado con tomate rallado y aceite de oliva.', 400, '["vegetarian","vegan","nut_free","dairy_free","raw"]', 0),
  ('Edam Sunset', 'Queso Edam fundido con tomate.', 500, '["nut_free","raw"]', 1),
  ('Tostada Clásica York', 'Pan tostado con Jamón York y tomate.', 600, '["nut_free","dairy_free","raw"]', 2),
  ('Tostada Nórdica', 'Pan tostado con queso blanco y salmón.', 1000, '["nut_free","raw"]', 3),
  ('Tostada Soleil', 'Tortilla francesa con tomate fresco.', 900, '["nut_free","dairy_free","raw"]', 4),
  ('Tostada Ibiza Verde', 'Aguacate, huevo y frutos secos sobre pan masa madre.', 900, '["vegetarian","gluten_free","nut_free","dairy_free","raw"]', 5),
  ('Dúo Fundido', 'Jamón york y queso fundido con tomate.', 600, '["nut_free","dairy_free","raw"]', 6),
  ('Tostada del Mar', 'Pan tostado con atún y tomate.', 800, '["nut_free","dairy_free","raw"]', 7),
  ('Campesina con Bacon', 'Bacon crujiente con tomate y pan.', 700, '["nut_free","dairy_free","raw"]', 8),
  ('Nórdica Poché', 'Huevo poché, tomate y aceite de oliva.', 900, '["vegetarian","raw"]', 9),
  ('Croissant de la Isla', 'Croissant clásico hojaldrado de mantequilla.', 250, '[]', 10),
  ('Croissant Cacao Wave', 'Croissant con cacao.', 350, '[]', 11),
  ('Croissant Salado Mediterráneo', 'Croissant relleno de jamón york y queso.', 400, '[]', 12),
  ('Croissant Ibiza Jam', 'Croissant con mermelada.', 350, '[]', 13),
  ('Desayuno Inglés', 'Sausage, pan, huevo, bacon, alubias, tomate cherry y champiñones.', 900, '[]', 14),
  ('Desayuno inglés deluxe', '2 Sausage, 2 panes, 2 huevos, 2 bacon, alubias, tomate cherry y champiñones.', 1300, '[]', 15)
) AS v(title, description, price_cents, allergens, sort_order);

-- 5n. Cafés & Infusiones (resumo)
INSERT INTO public.gm_catalog_items (category_id, title, description, price_cents, image_url, allergens, is_available, sort_order, badges)
SELECT 'c000000e-0000-0000-0000-00000000000e', v.title, v.description, v.price_cents, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80', '[]'::jsonb, true, v.sort_order, '[]'::jsonb
FROM (VALUES
  ('Café solo', 'Expreso clásico.', 200, 0),
  ('Café solo con hielo', 'Café con hielo.', 250, 1),
  ('Americano', 'Americano.', 250, 2),
  ('Café con leche', 'Café con leche de vaca.', 280, 3),
  ('Café con leche vegetal', 'Café con leche de avena.', 300, 4),
  ('Capuchino', 'Café con leche y cacao.', 300, 5),
  ('Café cortado', 'Expreso cortado con leche.', 220, 6),
  ('Café bombón', 'Café con leche condensada.', 250, 7),
  ('Colacao con leche', 'Cacao en polvo con leche.', 350, 8),
  ('Carajillo', 'Café con Baileys, whisky o brandy.', 400, 9),
  ('Café Sofía', 'Café helado con leche de coco, licor de café, nata, leche condensada y panela.', 600, 10),
  ('Té / Tea', 'Negro, rojo, verde, manzanilla, menta, etc.', 200, 11)
) AS v(title, description, price_cents, sort_order);

-- 5o. VIP Party Packs
INSERT INTO public.gm_catalog_items (category_id, title, description, price_cents, image_url, allergens, is_available, sort_order, badges)
SELECT 'c000000f-0000-0000-0000-00000000000f', v.title, v.description, v.price_cents, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80', '[]'::jsonb, true, v.sort_order, v.badges::jsonb
FROM (VALUES
  ('Pack Absolut Energy', '1 Vodka Absolut + 4 Red Bulls + hielo + vasos.', 5500, 0, '[]'),
  ('Pack Barceló Cola', '1 Ron Barceló + 2 Coca-Colas + 2 Sprites + hielo + vasos.', 4900, 1, '[]'),
  ('Pack Hendrick''s Tonic', '1 Gin Hendrick''s + 4 tónicas + hielo + vasos.', 5700, 2, '[]'),
  ('Pack Jack & Cola', '1 Jack Daniel''s + 4 Coca-Colas + hielo + vasos.', 5800, 3, '[]'),
  ('Pack Baileys Night', '1 Baileys + 1L leche + hielo + vasos.', 4000, 4, '[]'),
  ('Pack Sangría Doble', '2L sangría (tinto o blanco) + hielo + vasos.', 3500, 5, '[]'),
  ('Pack Grey Goose Mix', '1 Grey Goose + 3 refrescos a elegir + hielo + vasos.', 7000, 6, '[]'),
  ('Villa Overdose', '1 Grey Goose + 1 Barceló + 2 Coca-Colas + 2 Sprites + 2 Red Bulls + hielo + 6 vasos.', 11500, 7, '["novidade"]')
) AS v(title, description, price_cents, sort_order, badges);

-- =============================================================================
-- 6. TPV: gm_menu_categories + gm_products (mesmo menu para /app/staff/mode/tpv)
-- =============================================================================
DELETE FROM public.gm_products WHERE restaurant_id = '00000000-0000-0000-0000-000000000100';
DELETE FROM public.gm_menu_categories WHERE restaurant_id = '00000000-0000-0000-0000-000000000100';

INSERT INTO public.gm_menu_categories (id, restaurant_id, name, sort_order) VALUES
  ('d0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000100', 'Tapas & Entradas', 0),
  ('d0000002-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000100', 'Gastroburgers', 1),
  ('d0000003-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000100', 'Pizzas Artesanas', 2),
  ('d0000004-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000100', 'Platos Principales', 3),
  ('d0000005-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000100', 'Ensaladas', 4),
  ('d0000006-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000100', 'Zumos & Bowls', 5),
  ('d0000007-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000100', 'Postres', 6),
  ('d0000008-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000100', 'Sangrías & Cocteles', 7),
  ('d0000009-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000100', 'Copas y Chupitos', 8),
  ('d000000a-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000100', 'Licores', 9),
  ('d000000b-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000100', 'Vinos & Espumantes', 10),
  ('d000000c-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-000000000100', 'Cervezas & Refrescos', 11),
  ('d000000d-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-000000000100', 'Tostadas & Croissants', 12),
  ('d000000e-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-000000000100', 'Cafés & Infusiones', 13),
  ('d000000f-0000-0000-0000-00000000000f', '00000000-0000-0000-0000-000000000100', 'VIP Party Packs', 14);

-- Produtos TPV: copiar do catálogo (por título de categoria)
INSERT INTO public.gm_products (restaurant_id, category_id, name, description, price_cents, available)
SELECT
  '00000000-0000-0000-0000-000000000100',
  mc.id,
  ci.title,
  ci.description,
  ci.price_cents,
  ci.is_available
FROM public.gm_catalog_items ci
JOIN public.gm_catalog_categories cc ON cc.id = ci.category_id
JOIN public.gm_catalog_menus cm ON cm.id = cc.menu_id AND cm.restaurant_id = '00000000-0000-0000-0000-000000000100'
JOIN public.gm_menu_categories mc ON mc.restaurant_id = '00000000-0000-0000-0000-000000000100' AND mc.name = cc.title;
