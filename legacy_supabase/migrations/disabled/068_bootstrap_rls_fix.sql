-- Migration: 068_bootstrap_rls_fix.sql
-- Purpose: Fix RLS policies for bootstrap flow (restaurant_members SELECT + gm_restaurants INSERT)
-- Date: 2025-01-27
-- Context: Bootstrap failing because RLS blocking queries needed for first login

-- ============================================
-- 1. RESTAURANT_MEMBERS - SELECT Policy
-- ============================================
-- Ensure users can read their own memberships (required for bootstrap check)

-- Drop existing policy if it exists (might have different name)
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.restaurant_members;
DROP POLICY IF EXISTS "Users can read own memberships" ON public.restaurant_members;

-- Create/Recreate policy with consistent name
CREATE POLICY "Users can read own memberships"
ON public.restaurant_members
FOR SELECT
USING (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. RESTAURANT_MEMBERS - INSERT Policy
-- ============================================
-- Allow users to create memberships for restaurants they own

DROP POLICY IF EXISTS "Users can create own membership" ON public.restaurant_members;

CREATE POLICY "Users can create own membership"
ON public.restaurant_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.gm_restaurants 
    WHERE id = restaurant_id 
    AND owner_id = auth.uid()
  )
);

-- ============================================
-- 3. GM_RESTAURANTS - INSERT Policy
-- ============================================
-- Ensure users can create their own restaurants (required for new user onboarding)

-- Check if policy already exists (from 027_security_enforce.sql)
-- It might be named "Users can create restaurants"
DROP POLICY IF EXISTS "Users can create restaurants" ON public.gm_restaurants;
DROP POLICY IF EXISTS "Users can create own restaurant" ON public.gm_restaurants;

-- Create policy
CREATE POLICY "Users can create own restaurant"
ON public.gm_restaurants
FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE public.gm_restaurants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. GM_RESTAURANTS - SELECT Policy (if missing)
-- ============================================
-- Allow users to read restaurants they own or are members of

-- Check if public read policy exists (from 027_security_enforce.sql)
-- If not, create one that allows owners and members to read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'gm_restaurants' 
    AND policyname = 'Users can read own restaurants'
  ) THEN
    CREATE POLICY "Users can read own restaurants"
    ON public.gm_restaurants
    FOR SELECT
    USING (
      owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.restaurant_members
        WHERE restaurant_id = gm_restaurants.id
        AND user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Check policies after creation
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('restaurant_members', 'gm_restaurants')
ORDER BY tablename, policyname;

