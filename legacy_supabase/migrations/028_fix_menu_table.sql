-- Migration 028: Fix Menu Table
-- Reason: The system expects 'gm_menu_items' but it might be missing or named differently.
-- We ensure strict schema compliance here.
CREATE TABLE IF NOT EXISTS public.gm_menu_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid NOT NULL,
    name text NOT NULL,
    price_cents integer NOT NULL,
    category text,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);
-- Enable RLS
ALTER TABLE public.gm_menu_items ENABLE ROW LEVEL SECURITY;
-- Policy: Allow read for all (public menu)
CREATE POLICY "Public Menu Read" ON public.gm_menu_items FOR
SELECT USING (true);
-- Policy: Allow all for authenticated users (staff/owner)
-- A looser policy for now to ensure POS works
CREATE POLICY "Staff Full Access" ON public.gm_menu_items FOR ALL USING (auth.role() = 'authenticated');