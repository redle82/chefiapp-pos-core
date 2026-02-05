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
