-- Script para resetar wizard_completed_at (apenas para testes/desenvolvimento)
-- ⚠️ ATENÇÃO: Use apenas em ambiente de desenvolvimento

-- ============================================
-- OPÇÃO 1: Resetar por restaurant_id específico
-- ============================================
-- Substitua 'RESTAURANT_ID_AQUI' pelo ID do seu restaurante

UPDATE public.gm_restaurants
SET 
  wizard_completed_at = NULL,
  setup_status = 'not_started',
  wizard_progress = '{}'::jsonb,
  updated_at = NOW()
WHERE id = 'RESTAURANT_ID_AQUI'::uuid;

-- ============================================
-- OPÇÃO 2: Resetar pelo user_id atual (mais prático)
-- ============================================
-- Substitua 'USER_ID_AQUI' pelo ID do usuário (auth.users.id)

UPDATE public.gm_restaurants
SET 
  wizard_completed_at = NULL,
  setup_status = 'not_started',
  wizard_progress = '{}'::jsonb,
  updated_at = NOW()
WHERE id IN (
  SELECT restaurant_id 
  FROM public.restaurant_members 
  WHERE user_id = 'USER_ID_AQUI'::uuid
);

-- ============================================
-- OPÇÃO 3: Resetar TODOS os restaurantes (⚠️ CUIDADO!)
-- ============================================
-- Use apenas em desenvolvimento local

-- UPDATE public.gm_restaurants
-- SET 
--   wizard_completed_at = NULL,
--   setup_status = 'not_started',
--   wizard_progress = '{}'::jsonb,
--   updated_at = NOW();

-- ============================================
-- Verificar se foi resetado
-- ============================================

SELECT 
  r.id,
  r.name,
  r.wizard_completed_at,
  r.setup_status,
  r.wizard_progress,
  rm.user_id
FROM public.gm_restaurants r
LEFT JOIN public.restaurant_members rm ON r.id = rm.restaurant_id
WHERE rm.user_id = 'USER_ID_AQUI'::uuid  -- ou WHERE r.id = 'RESTAURANT_ID_AQUI'::uuid
ORDER BY r.updated_at DESC;
