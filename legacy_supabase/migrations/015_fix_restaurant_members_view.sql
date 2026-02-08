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
);