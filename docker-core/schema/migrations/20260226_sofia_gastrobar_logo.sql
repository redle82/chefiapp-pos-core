-- =============================================================================
-- Sofia Gastrobar — logo_url (asset em merchant-portal/public/logo-sofia-gastrobar.png)
-- =============================================================================
-- Pré-requisitos: 20260225_restaurant_logo_url.sql (coluna logo_url),
--                20260226_sofia_gastrobar_real_identity.sql (restaurante Sofia).
-- O portal serve o ficheiro em /logo-sofia-gastrobar.png (relativo à origem).
-- =============================================================================

UPDATE public.gm_restaurants
SET logo_url = '/logo-sofia-gastrobar.png',
    updated_at = COALESCE(updated_at, NOW())
WHERE id = '00000000-0000-0000-0000-000000000100'
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'logo_url'
  );
