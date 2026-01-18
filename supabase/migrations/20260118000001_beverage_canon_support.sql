-- BEVERAGE CANON SUPPORT
-- Adds columns to gm_products to support the Universal Beverage Canon system

-- Add canon support columns
ALTER TABLE gm_products 
ADD COLUMN IF NOT EXISTS system_provided BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS canon_id TEXT,
ADD COLUMN IF NOT EXISTS default_visibility BOOLEAN DEFAULT TRUE;

-- Add index for filtering system-provided items
CREATE INDEX IF NOT EXISTS idx_gm_products_system_provided 
ON gm_products(system_provided) WHERE system_provided = TRUE;

-- Add index for canon_id lookups
CREATE INDEX IF NOT EXISTS idx_gm_products_canon_id 
ON gm_products(canon_id) WHERE canon_id IS NOT NULL;

-- RLS Policy: Prevent deletion of canon items (system_provided = true)
-- Users can only delete their own custom products
DROP POLICY IF EXISTS "Users can delete only custom products" ON gm_products;
CREATE POLICY "Users can delete only custom products"
ON gm_products FOR DELETE
USING (
    system_provided = FALSE 
    AND restaurant_id IN (
        SELECT id FROM gm_restaurants WHERE owner_id = auth.uid()
    )
);

-- Comment for documentation
COMMENT ON COLUMN gm_products.system_provided IS 'True if product is from Beverage Canon (cannot be deleted, only deactivated)';
COMMENT ON COLUMN gm_products.canon_id IS 'Reference to canon template (e.g., ES:coca-cola-33cl)';
COMMENT ON COLUMN gm_products.default_visibility IS 'Default visibility state for canon items (false = requires activation)';
