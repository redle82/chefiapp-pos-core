-- 014_stability_rules.sql
-- Purpose: Seed the first stability-based revenue accelerator rule.
INSERT INTO rules (
        id,
        name,
        description,
        active,
        scope,
        trigger,
        condition,
        action,
        cooldown_minutes,
        version
    )
VALUES (
        'rule_stability_reward_v1',
        'Stability Reward (Momentum)',
        'Detecta alta performance operacional para disparar gatilhos de reputação externa.',
        true,
        'restaurant',
        '{"type": "PULSE_COUNT_WINDOW", "pulse_type": "ORDER_COMPLETED", "threshold_count": 20, "window_minutes": 30}',
        '{"operator": "GREATER_THAN_OR_EQUAL", "value": "threshold_count"}',
        '{"type": "EXTERNAL_LOOP", "loop_type": "REPUTATION_BOOST", "severity": "info", "message": "Sistema operando em alta performance ({{count}} pedidos/30min). Momento ideal para solicitar reviews."}',
        120,
        -- 2 hour cooldown to avoid spamming customers
        1
    ) ON CONFLICT (id) DO
UPDATE
SET trigger = EXCLUDED.trigger,
    action = EXCLUDED.action,
    active = EXCLUDED.active;;
-- FIX RESTAURANT MEMBERS VIEW
-- The original view was a pass-through to saas_tenants_members, which lacks restaurant_id.
-- This caused the application (which expects restaurant_id) to fail finding the link.
-- DEPENDENCY ALERT: dropping this view will drop 'Owners can manage their own connectors' policy.
DROP VIEW IF EXISTS public.restaurant_members CASCADE;
CREATE OR REPLACE VIEW public.restaurant_members AS
SELECT stm.id,
    stm.user_id,
    stm.role,
    r.id as restaurant_id,
    -- EXPOSED: The Key to the Kingdom
    stm.tenant_id,
    stm.created_at
FROM public.saas_tenants_members stm
    JOIN public.gm_restaurants r ON r.tenant_id = stm.tenant_id;
-- Grant permissions again just in case
GRANT SELECT ON public.restaurant_members TO authenticated;
GRANT SELECT ON public.restaurant_members TO service_role;
-- RESTORE DEPENDENCIES
-- Policy for external_connectors (sourced from 013_external_connectors.sql)
-- Drop explicitly just in case CASCADE missed it or if we are re-running
DROP POLICY IF EXISTS "Owners can manage their own connectors" ON public.external_connectors;
CREATE POLICY "Owners can manage their own connectors" ON public.external_connectors FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.restaurant_members
        WHERE restaurant_id = external_connectors.restaurant_id
            AND user_id = auth.uid()
            AND role = 'owner'
    )
);;
-- 016_sovereign_public_read.sql
-- PURPOSE: Allow the Public Void to see the menu (Read-Only).
-- 1. Restaurants (Profile)
ALTER TABLE public.gm_restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view restaurants" ON public.gm_restaurants FOR
SELECT TO anon,
    authenticated USING (true);
-- Public profiles are visible to all.
-- 2. Menu Categories
ALTER TABLE public.gm_menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view menu categories" ON public.gm_menu_categories FOR
SELECT TO anon,
    authenticated USING (true);
-- 3. Products
ALTER TABLE public.gm_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view products" ON public.gm_products FOR
SELECT TO anon,
    authenticated USING (true);
-- Note: We rely on the Frontend to filter by 'available' if needed, or we could enforce it here.
-- For Sovereign/Void integrity, truth is truth. If it exists, it can be read. Availability is a state, not a permission.;
