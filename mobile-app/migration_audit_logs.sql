-- =============================================================================
-- AUDIT LOGS TABLE - Bug #13 Fix
-- =============================================================================
-- Sistema de logs de auditoria para rastreabilidade de ações críticas
-- 
-- Ações registradas:
-- - void_item: Cancelamento de item de pedido
-- - apply_discount: Aplicação de desconto
-- - close_cash_drawer: Fechamento de caixa
-- - open_cash_drawer: Abertura de caixa
-- - pay_order: Pagamento de pedido
-- - cash_movement: Movimento de caixa (suprimento/sangria)

CREATE TABLE IF NOT EXISTS public.gm_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    action text NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    restaurant_id uuid REFERENCES public.gm_restaurants(id),
    shift_id uuid REFERENCES public.gm_shifts(id),
    order_id uuid REFERENCES public.gm_orders(id),
    amount_cents integer,
    reason text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.gm_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant_id ON public.gm_audit_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_shift_id ON public.gm_audit_logs(shift_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_order_id ON public.gm_audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.gm_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.gm_audit_logs(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE public.gm_audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ler logs do próprio restaurante
CREATE POLICY "Users can read audit logs from their restaurant"
    ON public.gm_audit_logs
    FOR SELECT
    TO authenticated
    USING (
        restaurant_id IN (
            SELECT id FROM public.gm_restaurants 
            WHERE owner_id = auth.uid()
        )
    );

-- Política: Sistema pode inserir logs (via service role ou authenticated)
CREATE POLICY "System can insert audit logs"
    ON public.gm_audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Nota: Logs de auditoria são apenas para leitura após inserção
-- Nenhuma política de UPDATE ou DELETE é necessária
