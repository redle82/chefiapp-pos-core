-- ============================================
-- FIXES RLS PARA BOOTSTRAP
-- ============================================
-- Execute apenas o fix correspondente ao erro encontrado
-- Não execute todos de uma vez sem diagnóstico

-- ============================================
-- FIX A: Política RLS para SELECT em restaurant_members
-- ============================================
-- Use se: Script 2 falhar com erro de permissão

DROP POLICY IF EXISTS "Users can read own memberships" ON restaurant_members;

CREATE POLICY "Users can read own memberships"
ON restaurant_members
FOR SELECT
USING (user_id = auth.uid());

-- ============================================
-- FIX B: Política RLS para INSERT em gm_restaurants
-- ============================================
-- Use se: Script 4 falhar com erro de permissão

DROP POLICY IF EXISTS "Users can create own restaurant" ON gm_restaurants;

CREATE POLICY "Users can create own restaurant"
ON gm_restaurants
FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- ============================================
-- FIX C: Política RLS para INSERT em restaurant_members
-- ============================================
-- Use se: Criação de membership falhar

DROP POLICY IF EXISTS "Users can create own membership" ON restaurant_members;

CREATE POLICY "Users can create own membership"
ON restaurant_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM gm_restaurants 
    WHERE id = restaurant_id 
    AND owner_id = auth.uid()
  )
);

-- ============================================
-- FIX D: Políticas Adicionais (Se necessário)
-- ============================================

-- Permitir que owners leiam seus restaurantes
DROP POLICY IF EXISTS "Users can read own restaurants" ON gm_restaurants;

CREATE POLICY "Users can read own restaurants"
ON gm_restaurants
FOR SELECT
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM restaurant_members
    WHERE restaurant_id = gm_restaurants.id
    AND user_id = auth.uid()
  )
);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute após aplicar os fixes:

-- Verificar políticas existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('restaurant_members', 'gm_restaurants')
ORDER BY tablename, policyname;

