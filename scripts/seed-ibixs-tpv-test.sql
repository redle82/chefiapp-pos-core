-- Seed Test Data for Ibixs Restaurant (TPV Testing)
-- Table: gm_menu_items

-- Get Ibixs restaurant ID
WITH restaurant AS (
    SELECT id FROM gm_restaurants WHERE name ILIKE '%ibixs%' LIMIT 1
)
-- Insert menu items
INSERT INTO gm_menu_items (restaurant_id, name, price_cents, category, active)
SELECT 
    restaurant.id,
    item.name,
    item.price_cents,
    item.category,
    true
FROM restaurant, (VALUES
    ('Café Expresso', 150, 'Bebidas'),
    ('Café Latte', 250, 'Bebidas'),
    ('Água Mineral', 100, 'Bebidas'),
    ('Sumo de Laranja', 300, 'Bebidas'),
    ('Croissant', 200, 'Padaria'),
    ('Pão de Queijo', 180, 'Padaria'),
    ('Tosta Mista', 350, 'Padaria'),
    ('Hambúrguer Clássico', 800, 'Pratos'),
    ('Francesinha', 1200, 'Pratos'),
    ('Bifana', 500, 'Pratos'),
    ('Bolo de Chocolate', 350, 'Sobremesas'),
    ('Pudim', 300, 'Sobremesas')
) AS item(name, price_cents, category)
ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT name, price_cents, category FROM gm_menu_items 
WHERE restaurant_id = (SELECT id FROM gm_restaurants WHERE name ILIKE '%ibixs%' LIMIT 1);
