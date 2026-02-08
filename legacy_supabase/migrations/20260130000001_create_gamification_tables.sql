-- FASE 4: Gamificação Interna - Tabelas de Pontos e Achievements
-- Data: 2026-01-30

-- Tabela de pontuação dos usuários
CREATE TABLE IF NOT EXISTS public.user_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0,
    weekly_points INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    user_name TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, restaurant_id)
);

-- Tabela de achievements dos usuários
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, restaurant_id, achievement_id)
);

-- Tabela de histórico de pontos (para tracking)
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    action_type TEXT, -- 'task_completed', 'payment_processed', 'achievement', etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_scores_restaurant ON public.user_scores(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_user_scores_points ON public.user_scores(restaurant_id, total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_scores_weekly ON public.user_scores(restaurant_id, weekly_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id, restaurant_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON public.point_transactions(user_id, restaurant_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seus próprios scores e dos colegas do mesmo restaurante
CREATE POLICY "Users can view scores in their restaurant"
    ON public.user_scores FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.restaurant_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Sistema pode inserir/atualizar scores (via service)
CREATE POLICY "Service can manage scores"
    ON public.user_scores FOR ALL
    USING (true)
    WITH CHECK (true);

-- Policy: Usuários podem ver achievements do mesmo restaurante
CREATE POLICY "Users can view achievements in their restaurant"
    ON public.user_achievements FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.restaurant_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Sistema pode inserir achievements
CREATE POLICY "Service can manage achievements"
    ON public.user_achievements FOR ALL
    USING (true)
    WITH CHECK (true);

-- Policy: Usuários podem ver transações do mesmo restaurante
CREATE POLICY "Users can view transactions in their restaurant"
    ON public.point_transactions FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.restaurant_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Sistema pode inserir transações
CREATE POLICY "Service can insert transactions"
    ON public.point_transactions FOR INSERT
    WITH CHECK (true);

-- Função para resetar pontos semanais (executar via cron)
CREATE OR REPLACE FUNCTION public.reset_weekly_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.user_scores
    SET weekly_points = 0
    WHERE weekly_points > 0;
END;
$$;

-- Comentários
COMMENT ON TABLE public.user_scores IS 'Pontuação dos usuários por restaurante';
COMMENT ON TABLE public.user_achievements IS 'Achievements desbloqueados pelos usuários';
COMMENT ON TABLE public.point_transactions IS 'Histórico de transações de pontos';
