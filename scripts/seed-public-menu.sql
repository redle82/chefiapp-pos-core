-- Create Category
INSERT INTO menu_categories (id, restaurant_id, name, "position")
VALUES (
        gen_random_uuid(),
        'ec1f054d-ff79-4b23-8e18-e33e66f0cad7',
        'Destaques',
        0
    );
-- Create Item (linking to the category we just created/found)
-- Note: Simplified logic for single-run seed
WITH cat AS (
    SELECT id
    FROM menu_categories
    WHERE restaurant_id = 'ec1f054d-ff79-4b23-8e18-e33e66f0cad7'
    LIMIT 1
)
INSERT INTO menu_items (
        id,
        category_id,
        restaurant_id,
        name,
        description,
        price_cents,
        is_active
    )
SELECT gen_random_uuid(),
    cat.id,
    'ec1f054d-ff79-4b23-8e18-e33e66f0cad7',
    'Item de Teste',
    'Gerado pelo AntiGravity',
    100,
    true
FROM cat;