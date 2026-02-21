-- Migration: Create Menu Item Costs View
-- Date: 2026-01-20
-- Description: Calculates the theoretical cost of each menu item based on its recipe ingredients.

CREATE OR REPLACE VIEW gm_menu_item_costs_view AS
SELECT 
    r.menu_item_id,
    COALESCE(SUM(r.quantity * i.cost_per_unit), 0) as total_cost
FROM gm_recipes r
JOIN gm_inventory_items i ON r.inventory_item_id = i.id
GROUP BY r.menu_item_id;

-- Grant access (if needed, though views usually inherent tables if same owner, but explicitly good)
-- GRANT SELECT ON gm_menu_item_costs_view TO authenticated;
