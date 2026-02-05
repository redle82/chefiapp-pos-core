-- Migration: Criar funções helper para RLS
-- Data: 2026-01-22
-- Objetivo: Criar funções helper para facilitar RLS policies

-- ============================================================================
-- FUNÇÃO HELPER: get_user_restaurant_id()
-- ============================================================================
-- Retorna o restaurant_id do usuário logado (primeiro restaurante)
-- Útil para context switching e policies que precisam de um único ID

CREATE OR REPLACE FUNCTION public.get_user_restaurant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    -- Retorna o primeiro restaurant_id do usuário
    -- Se usuário tem múltiplos restaurantes, retorna o primeiro
    SELECT restaurant_id 
    FROM public.gm_restaurant_members 
    WHERE user_id = auth.uid()
    ORDER BY created_at ASC
    LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_user_restaurant_id() IS 
'Retorna o restaurant_id do usuário logado (primeiro restaurante). Usado em RLS policies.';

-- ============================================================================
-- FUNÇÃO HELPER: get_user_restaurants()
-- ============================================================================
-- Retorna lista de restaurantes do usuário logado
-- Útil para policies que precisam verificar múltiplos restaurantes

CREATE OR REPLACE FUNCTION public.get_user_restaurants()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    -- Retorna todos os restaurant_ids do usuário
    SELECT restaurant_id 
    FROM public.gm_restaurant_members 
    WHERE user_id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_user_restaurants() IS 
'Retorna lista de restaurant_ids do usuário logado. Usado em RLS policies.';

-- ============================================================================
-- FUNÇÃO HELPER: is_user_member_of_restaurant(restaurant_id UUID)
-- ============================================================================
-- Verifica se usuário é membro de um restaurante específico

CREATE OR REPLACE FUNCTION public.is_user_member_of_restaurant(p_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    -- Verifica se usuário é membro do restaurante
    SELECT EXISTS (
        SELECT 1 
        FROM public.gm_restaurant_members 
        WHERE user_id = auth.uid() 
        AND restaurant_id = p_restaurant_id
    );
$$;

COMMENT ON FUNCTION public.is_user_member_of_restaurant(UUID) IS 
'Verifica se usuário é membro de um restaurante específico. Usado em validações.';

-- ============================================================================
-- NOTA: user_restaurant_ids() já existe e retorna SETOF UUID
-- Esta migration adiciona funções complementares para diferentes casos de uso
-- ============================================================================
