-- FASE 4 Passo 3: Documentar extensões em restaurant_web_presence.config
-- Pontos de extensão para reviews, SEO local e fidelização (ver docs/implementation/FASE_4_EXTENSOES_FUTURAS.md).

COMMENT ON COLUMN public.restaurant_web_presence.config IS
  'JSONB: layout, cores, etc. Extensões futuras: reviews (reviews_enabled, reviews_source, place_id), seo (meta_description, og_image_url), loyalty (enabled, points_per_eur, tier_rules).';
