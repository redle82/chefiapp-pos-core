-- Migration: Add web_level to restaurant_web_profiles
-- Date: 2025-12-28
-- Description: Adds the visual tier level for public pages.
ALTER TABLE restaurant_web_profiles
ADD COLUMN IF NOT EXISTS web_level TEXT DEFAULT 'BASIC';
-- Set initial state for demo
UPDATE restaurant_web_profiles
SET web_level = 'PRO'
WHERE slug = 'sofia-gastrobar';