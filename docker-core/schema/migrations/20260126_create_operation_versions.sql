-- =============================================================================
-- OPERATION VERSIONS - Versionamento de Configuração Operacional
-- =============================================================================
-- Data: 2026-01-26
-- Objetivo: Versionar Menu, Tarefas e Mapa (evitar mudanças em horário de pico)
-- =============================================================================

-- =============================================================================
-- 1. OPERATION VERSIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_operation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  
  -- Versões
  menu_version TEXT NOT NULL DEFAULT '1.0.0',
  task_version TEXT NOT NULL DEFAULT '1.0.0',
  map_version TEXT NOT NULL DEFAULT '1.0.0',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_draft BOOLEAN DEFAULT false, -- Modo rascunho
  
  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadados
  published_by UUID, -- ID do usuário que publicou
  notes TEXT -- Notas sobre esta versão
);

-- Constraint único para versão ativa (apenas uma versão ativa por restaurante)
CREATE UNIQUE INDEX IF NOT EXISTS idx_operation_versions_unique_active 
ON public.gm_operation_versions(restaurant_id) 
WHERE is_active = true;

-- =============================================================================
-- 2. VERSÕES DE RASCUNHO (DRAFTS)
-- =============================================================================
-- Permite múltiplos rascunhos, mas apenas uma versão ativa

-- =============================================================================
-- 3. ÍNDICES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_operation_versions_restaurant ON public.gm_operation_versions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_operation_versions_active ON public.gm_operation_versions(restaurant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_operation_versions_draft ON public.gm_operation_versions(restaurant_id, is_draft) WHERE is_draft = true;

-- =============================================================================
-- 4. FUNÇÃO: PUBLICAR VERSÃO
-- =============================================================================
CREATE OR REPLACE FUNCTION public.publish_operation_version(
  p_restaurant_id UUID,
  p_version_id UUID,
  p_published_by UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Desativar versão ativa anterior
  UPDATE public.gm_operation_versions
  SET is_active = false, updated_at = NOW()
  WHERE restaurant_id = p_restaurant_id
    AND is_active = true
    AND id != p_version_id;
  
  -- Ativar nova versão
  UPDATE public.gm_operation_versions
  SET 
    is_active = true,
    is_draft = false,
    published_at = NOW(),
    published_by = p_published_by,
    updated_at = NOW()
  WHERE id = p_version_id
    AND restaurant_id = p_restaurant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Version not found or does not belong to restaurant'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'version_id', p_version_id,
    'published_at', NOW()
  );
END;
$$;

-- =============================================================================
-- 5. COMENTÁRIOS
-- =============================================================================
COMMENT ON TABLE public.gm_operation_versions IS 'Versionamento de configuração operacional (Menu, Tarefas, Mapa)';
COMMENT ON COLUMN public.gm_operation_versions.menu_version IS 'Versão do menu (ex: 1.0.0, 1.1.0)';
COMMENT ON COLUMN public.gm_operation_versions.task_version IS 'Versão das tarefas (ex: 1.0.0, 1.1.0)';
COMMENT ON COLUMN public.gm_operation_versions.map_version IS 'Versão do mapa (ex: 1.0.0, 1.1.0)';
COMMENT ON COLUMN public.gm_operation_versions.is_draft IS 'Se true, é rascunho (não usado em produção)';
COMMENT ON FUNCTION public.publish_operation_version IS 'Publica uma versão de configuração operacional (desativa anterior, ativa nova)';
