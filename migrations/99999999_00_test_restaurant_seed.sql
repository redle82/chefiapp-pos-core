-- ==============================================================================
-- TEST RESTAURANT SEED (CORE Operational Testing Prerequisite)
-- ==============================================================================
-- Version: 1.0.0
-- Date: 2025-12-27
-- Purpose: Seed explicit test restaurant for CORE operational testing
-- 
-- IMPORTANT: This is NOT a hack. This is an explicit institutional identity
-- required by the CORE's ontological gate. The CORE does not invent restaurants.
-- The CORE does not assume implicit context. This seed satisfies the requirement.
-- ==============================================================================

-- Test Restaurant (Institutional Identity)
-- This restaurant_id is used by WEB_MODULE_RESTAURANT_ID for testing
INSERT INTO restaurant_web_profiles (
    restaurant_id,
    company_id,
    slug,
    status,
    theme,
    web_level,
    hero,
    highlights,
    contacts,
    delivery_zones,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,  -- Fixed UUID for test consistency
    '00000000-0000-0000-0000-000000000002'::uuid,  -- Test company
    'test-restaurant-core',
    'published',
    'minimal',
    'BASIC',
    '{"title": "Test Restaurant", "subtitle": "CORE Operational Testing"}'::jsonb,
    '[]'::jsonb,
    '{"phone": "+351000000000"}'::jsonb,
    '[]'::jsonb,
    NOW(),
    NOW()
)
ON CONFLICT (restaurant_id) DO UPDATE SET
    updated_at = NOW();

-- Test Company (if companies table exists)
-- Note: This may not be required if company_id is not enforced
INSERT INTO companies (
    company_id,
    name,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'Test Company (CORE Testing)',
    NOW(),
    NOW()
)
ON CONFLICT (company_id) DO UPDATE SET
    updated_at = NOW();

-- ==============================================================================
-- USAGE
-- ==============================================================================
-- After running this seed, set in your .env:
--
-- WEB_MODULE_RESTAURANT_ID=00000000-0000-0000-0000-000000000001
--
-- This satisfies the CORE's requirement for institutional identity.
-- The CORE will not create orders without a valid restaurant_id.
-- This is a feature, not a bug - it prevents orphaned financial facts.
-- ==============================================================================

