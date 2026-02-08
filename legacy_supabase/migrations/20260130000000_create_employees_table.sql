-- Migration: Create employees table with RLS policies
-- Date: 2026-01-30
-- Purpose: Enable staff management functionality

-- ==============================================================================
-- 1. CREATE EMPLOYEES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'worker')),
    position TEXT NOT NULL CHECK (position IN ('kitchen', 'waiter', 'cleaning', 'cashier', 'manager')),
    pin TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. CREATE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_employees_restaurant_id ON public.employees(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_active ON public.employees(restaurant_id, active) WHERE active = true;

-- Unique constraint: Um usuário não pode ser funcionário duas vezes no mesmo restaurante
CREATE UNIQUE INDEX IF NOT EXISTS employees_unique_user_per_restaurant
ON public.employees (restaurant_id, user_id)
WHERE user_id IS NOT NULL;

-- ==============================================================================
-- 3. ENABLE RLS
-- ==============================================================================
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. RLS POLICIES
-- ==============================================================================

-- Policy: Users can SELECT employees from their restaurants
DROP POLICY IF EXISTS "Users can view employees of their restaurants" ON public.employees;
CREATE POLICY "Users can view employees of their restaurants"
ON public.employees
FOR SELECT
USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.restaurant_members 
        WHERE user_id = auth.uid()
    )
    OR restaurant_id IN (
        SELECT id 
        FROM public.gm_restaurants 
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Owners and managers can INSERT employees
DROP POLICY IF EXISTS "Owners and managers can create employees" ON public.employees;
CREATE POLICY "Owners and managers can create employees"
ON public.employees
FOR INSERT
WITH CHECK (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.restaurant_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
    OR restaurant_id IN (
        SELECT id 
        FROM public.gm_restaurants 
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Owners and managers can UPDATE employees
DROP POLICY IF EXISTS "Owners and managers can update employees" ON public.employees;
CREATE POLICY "Owners and managers can update employees"
ON public.employees
FOR UPDATE
USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.restaurant_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
    OR restaurant_id IN (
        SELECT id 
        FROM public.gm_restaurants 
        WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.restaurant_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
    OR restaurant_id IN (
        SELECT id 
        FROM public.gm_restaurants 
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Owners and managers can DELETE employees (soft delete via UPDATE)
-- Note: We use UPDATE to set active = false instead of DELETE
DROP POLICY IF EXISTS "Owners and managers can delete employees" ON public.employees;
CREATE POLICY "Owners and managers can delete employees"
ON public.employees
FOR DELETE
USING (
    restaurant_id IN (
        SELECT restaurant_id 
        FROM public.restaurant_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'manager')
    )
    OR restaurant_id IN (
        SELECT id 
        FROM public.gm_restaurants 
        WHERE owner_id = auth.uid()
    )
);

-- ==============================================================================
-- 5. COMMENTS
-- ==============================================================================
COMMENT ON TABLE public.employees IS 'Staff/Employee management table for restaurants';
COMMENT ON COLUMN public.employees.restaurant_id IS 'Reference to the restaurant';
COMMENT ON COLUMN public.employees.user_id IS 'Optional link to user profile (for authenticated staff)';
COMMENT ON COLUMN public.employees.pin IS 'Optional PIN for quick access';
COMMENT ON COLUMN public.employees.active IS 'Soft delete flag - false means employee is inactive';
