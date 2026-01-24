-- Migration: Sistema de Tickets de Suporte
-- Data: 2026-01-22
-- Objetivo: Criar sistema básico de tickets de suporte

-- ============================================================================
-- TABELA: gm_support_tickets
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gm_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_support_tickets_restaurant 
ON public.gm_support_tickets(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user 
ON public.gm_support_tickets(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status 
ON public.gm_support_tickets(status, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned 
ON public.gm_support_tickets(assigned_to) 
WHERE assigned_to IS NOT NULL;

-- ============================================================================
-- TABELA: gm_support_ticket_comments
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gm_support_ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.gm_support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Comentários internos (equipe) vs externos (cliente)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket 
ON public.gm_support_ticket_comments(ticket_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_user 
ON public.gm_support_ticket_comments(user_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.gm_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_support_ticket_comments ENABLE ROW LEVEL SECURITY;

-- Policies para tickets
CREATE POLICY "Users can view tickets from their restaurants"
ON public.gm_support_tickets
FOR SELECT
USING (
  restaurant_id IN (SELECT public.get_user_restaurants())
  OR user_id = auth.uid()
);

CREATE POLICY "Users can create tickets for their restaurants"
ON public.gm_support_tickets
FOR INSERT
WITH CHECK (
  restaurant_id IN (SELECT public.get_user_restaurants())
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update their own tickets"
ON public.gm_support_tickets
FOR UPDATE
USING (
  user_id = auth.uid()
  OR restaurant_id IN (SELECT public.get_user_restaurants())
)
WITH CHECK (
  user_id = auth.uid()
  OR restaurant_id IN (SELECT public.get_user_restaurants())
);

-- Policies para comments
CREATE POLICY "Users can view comments from their restaurant tickets"
ON public.gm_support_ticket_comments
FOR SELECT
USING (
  ticket_id IN (
    SELECT id FROM public.gm_support_tickets
    WHERE restaurant_id IN (SELECT public.get_user_restaurants())
  )
);

CREATE POLICY "Users can create comments on their restaurant tickets"
ON public.gm_support_ticket_comments
FOR INSERT
WITH CHECK (
  ticket_id IN (
    SELECT id FROM public.gm_support_tickets
    WHERE restaurant_id IN (SELECT public.get_user_restaurants())
  )
  AND user_id = auth.uid()
);

-- ============================================================================
-- TRIGGER: Atualizar updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_support_ticket_updated_at
BEFORE UPDATE ON public.gm_support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_support_ticket_updated_at();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE public.gm_support_tickets IS 'Tickets de suporte por restaurante';
COMMENT ON TABLE public.gm_support_ticket_comments IS 'Comentários em tickets de suporte';
COMMENT ON COLUMN public.gm_support_tickets.restaurant_id IS 'Restaurante que abriu o ticket';
COMMENT ON COLUMN public.gm_support_tickets.user_id IS 'Usuário que abriu o ticket';
COMMENT ON COLUMN public.gm_support_ticket_comments.is_internal IS 'Comentário interno (equipe) ou externo (cliente)';
