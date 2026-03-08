-- =============================================================================
-- Fix broken Unsplash photo_url in gm_products (404s)
-- Date: 2026-03-02
-- Purpose: Replace known broken/legacy Unsplash URLs with a stable default.
-- =============================================================================

-- URL estável usada como fallback (pizza — mesma que foodPhotoUrls.ts)
-- https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80
UPDATE public.gm_products
SET photo_url = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80'
WHERE photo_url IS NOT NULL
  AND (
    photo_url LIKE '%1565299585197%'
    OR photo_url LIKE '%2ab8d9a65e2a%'
    OR photo_url LIKE '%1565299505197-2ab0d9a65e2a%'
  );
