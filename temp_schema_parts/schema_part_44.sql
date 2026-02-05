-- FASE 3 Passo 1: Pessoas operacionais por restaurante (nome, função, código/QR para App Staff)
-- Dono cria pessoas (staff/gerente) com nome, função e identificação (código ou QR para check-in).

-- ==============================================================================
-- 1. Tabela gm_restaurant_people
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.gm_restaurant_people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('staff', 'manager')),
    staff_code TEXT NOT NULL,
    qr_token TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (restaurant_id, staff_code)
);

COMMENT ON TABLE public.gm_restaurant_people IS
  'Pessoas operacionais do restaurante (staff/gerente) com código ou QR para check-in no App Staff.';

CREATE INDEX IF NOT EXISTS idx_gm_restaurant_people_restaurant_id ON public.gm_restaurant_people(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_gm_restaurant_people_staff_code ON public.gm_restaurant_people(restaurant_id, staff_code);

-- ==============================================================================
-- 2. RLS
-- ==============================================================================
ALTER TABLE public.gm_restaurant_people ENABLE ROW LEVEL SECURITY;

-- Ver: membros do restaurante podem ver pessoas do seu restaurante
CREATE POLICY "Members can view restaurant people"
    ON public.gm_restaurant_people FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.gm_restaurant_members
            WHERE user_id = auth.uid() AND disabled_at IS NULL
        )
        OR restaurant_id IN (
            SELECT id FROM public.gm_restaurants WHERE owner_id = auth.uid()
        )
    );

-- Inserir/atualizar/apagar: apenas owner ou manager
CREATE POLICY "Owners and managers can manage restaurant people"
    ON public.gm_restaurant_people FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.gm_restaurant_members m
            WHERE m.restaurant_id = gm_restaurant_people.restaurant_id
              AND m.user_id = auth.uid()
              AND m.role IN ('owner', 'manager')
              AND m.disabled_at IS NULL
        )
        OR EXISTS (
            SELECT 1 FROM public.gm_restaurants r
            WHERE r.id = gm_restaurant_people.restaurant_id AND r.owner_id = auth.uid()
        )
    );

-- Política para INSERT (novo registo ainda não tem restaurant_id na cláusula USING do FOR ALL)
CREATE POLICY "Owners and managers can insert restaurant people"
    ON public.gm_restaurant_people FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gm_restaurant_members m
            WHERE m.restaurant_id = gm_restaurant_people.restaurant_id
              AND m.user_id = auth.uid()
              AND m.role IN ('owner', 'manager')
              AND m.disabled_at IS NULL
        )
        OR EXISTS (
            SELECT 1 FROM public.gm_restaurants r
            WHERE r.id = gm_restaurant_people.restaurant_id AND r.owner_id = auth.uid()
        )
    );
;
-- Onda 3 · G1 — Pipeline de eventos: gm_audit_logs consumíveis via Realtime.
-- Adicionar gm_audit_logs à publication supabase_realtime para subscrições (dashboards, agregadores).
-- Ref: docs/ops/EVENT_PIPELINE.md, EVENT_TAXONOMY.md

-- Add table to supabase_realtime publication (INSERT only; UPDATE/DELETE blocked by immutability trigger)
ALTER PUBLICATION supabase_realtime ADD TABLE public.gm_audit_logs;

COMMENT ON TABLE public.gm_audit_logs IS 'Realtime enabled (G1 Onda 3): eventos consumíveis por dashboards/agregadores; RLS aplica-se às subscrições.';
;
-- FASE 3 Passo 2: Tarefas ligadas a turnos; checklists por turno
-- Tarefas válidas no contexto do turno; staff vê e marca checklists; Dono vê progresso.

-- ==============================================================================
-- 1. gm_tasks: coluna turn_session_id (opcional se tabela existir)
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gm_tasks') THEN
    ALTER TABLE public.gm_tasks
      ADD COLUMN IF NOT EXISTS turn_session_id UUID REFERENCES public.turn_sessions(id) ON DELETE SET NULL;
    COMMENT ON COLUMN public.gm_tasks.turn_session_id IS 'Turno em que a tarefa é visível/executada (FASE 3 Passo 2).';
  END IF;
END $$;

-- ==============================================================================
-- 2. gm_shift_checklist_templates — definição dos itens do checklist por restaurante
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.gm_shift_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL DEFAULT 'general' CHECK (kind IN ('opening', 'closing', 'general')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.gm_shift_checklist_templates IS
  'Templates de itens do checklist do turno (abertura, fecho, geral). FASE 3 Passo 2.';

CREATE INDEX IF NOT EXISTS idx_gm_shift_checklist_templates_restaurant
  ON public.gm_shift_checklist_templates(restaurant_id);

ALTER TABLE public.gm_shift_checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view checklist templates"
  ON public.gm_shift_checklist_templates FOR SELECT
  USING (
    restaurant_id IN (SELECT public.get_user_restaurants())
    OR restaurant_id IN (SELECT id FROM public.gm_restaurants WHERE owner_id = auth.uid())
  );

CREATE POLICY "Owners and managers can manage checklist templates"
  ON public.gm_shift_checklist_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.gm_restaurant_members m
      WHERE m.restaurant_id = gm_shift_checklist_templates.restaurant_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'manager')
        AND m.disabled_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM public.gm_restaurants r
      WHERE r.id = gm_shift_checklist_templates.restaurant_id AND r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners and managers can insert checklist templates"
  ON public.gm_shift_checklist_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gm_restaurant_members m
      WHERE m.restaurant_id = gm_shift_checklist_templates.restaurant_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'manager')
        AND m.disabled_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM public.gm_restaurants r
      WHERE r.id = gm_shift_checklist_templates.restaurant_id AND r.owner_id = auth.uid()
    )
  );

-- ==============================================================================
-- 3. gm_shift_checklist_completions — conclusões por turno
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.gm_shift_checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_session_id UUID NOT NULL REFERENCES public.turn_sessions(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.gm_shift_checklist_templates(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (turn_session_id, template_id)
);

COMMENT ON TABLE public.gm_shift_checklist_completions IS
  'Itens do checklist marcados como concluídos num turno. FASE 3 Passo 2.';

CREATE INDEX IF NOT EXISTS idx_gm_shift_checklist_completions_turn
  ON public.gm_shift_checklist_completions(turn_session_id);

ALTER TABLE public.gm_shift_checklist_completions ENABLE ROW LEVEL SECURITY;

-- Ver: quem tem acesso ao turno (participante ou manager/owner do restaurante)
CREATE POLICY "Participants and managers can view completions"
  ON public.gm_shift_checklist_completions FOR SELECT
  USING (
    turn_session_id IN (
      SELECT id FROM public.turn_sessions
      WHERE user_id = auth.uid()
         OR restaurant_id IN (SELECT public.get_user_restaurants())
         OR restaurant_id IN (SELECT id FROM public.gm_restaurants WHERE owner_id = auth.uid())
    )
  );

-- Inserir/apagar: participante do turno ou manager/owner
CREATE POLICY "Participants and managers can manage completions"
  ON public.gm_shift_checklist_completions FOR ALL
  USING (
    turn_session_id IN (
      SELECT t.id FROM public.turn_sessions t
      WHERE t.user_id = auth.uid()
         OR EXISTS (
           SELECT 1 FROM public.gm_restaurant_members m
           WHERE m.restaurant_id = t.restaurant_id
             AND m.user_id = auth.uid()
             AND m.role IN ('owner', 'manager')
             AND m.disabled_at IS NULL
         )
         OR t.restaurant_id IN (SELECT id FROM public.gm_restaurants WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "Participants and managers can insert completions"
  ON public.gm_shift_checklist_completions FOR INSERT
  WITH CHECK (
    turn_session_id IN (
      SELECT t.id FROM public.turn_sessions t
      WHERE t.user_id = auth.uid()
         OR EXISTS (
           SELECT 1 FROM public.gm_restaurant_members m
           WHERE m.restaurant_id = t.restaurant_id
             AND m.user_id = auth.uid()
             AND m.role IN ('owner', 'manager')
             AND m.disabled_at IS NULL
         )
         OR t.restaurant_id IN (SELECT id FROM public.gm_restaurants WHERE owner_id = auth.uid())
    )
  );
;
