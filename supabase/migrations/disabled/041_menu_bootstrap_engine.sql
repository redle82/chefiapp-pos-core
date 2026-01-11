-- Migration: 041_menu_bootstrap_engine.sql
-- Purpose: Defines the "Bootstrap Engine" allowing automated menu creation from diverse sources.
-- Strategy: Append-only audit of WHERE the menu came from.
-- 1. Bootstrap Sources (The Raw Input)
CREATE TABLE IF NOT EXISTS public.menu_bootstrap_sources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (
        source_type IN ('PRESET', 'JSON', 'PDF', 'URL', 'MANUAL')
    ),
    source_origin TEXT,
    -- Preset Name (e.g. 'CAFE_V1') or URL or Filename
    raw_payload JSONB NOT NULL DEFAULT '{}',
    -- The raw input data
    created_at TIMESTAMPTZ DEFAULT now()
);
-- 2. Bootstrap Runs (The Execution Log)
CREATE TABLE IF NOT EXISTS public.menu_bootstrap_runs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id UUID NOT NULL REFERENCES public.menu_bootstrap_sources(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    log JSONB DEFAULT '[]',
    -- Execution log steps
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);
-- 3. Bootstrap Results (The Outcome)
CREATE TABLE IF NOT EXISTS public.menu_bootstrap_results (
    run_id UUID NOT NULL REFERENCES public.menu_bootstrap_runs(id) ON DELETE CASCADE PRIMARY KEY,
    created_items_count INTEGER DEFAULT 0,
    created_categories_count INTEGER DEFAULT 0,
    normalization_report JSONB DEFAULT '{}',
    -- Details on what was fixed/normalized
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Note: We do not trigger the logic here. Logic lives in the Application Service Layer (MenuBootstrapService).
-- This schema purely records the "Birth Certificate" of the menu.