-- =============================================================================
-- shift_logs — Registo de turnos (check-in/check-out) por funcionário
-- =============================================================================
-- Objetivo: Tabela para AppStaff / LiveRoster; DEVICE_TURN_SHIFT_TASK_CONTRACT.
-- Referência: merchant-portal migrations 20260123_staff_audit (conceptual).
-- Docker Core usa gm_staff; não existe tabela "employees" no core.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.shift_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.gm_staff(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    meta JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shift_logs_restaurant_active
    ON public.shift_logs(restaurant_id)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_shift_logs_employee ON public.shift_logs(employee_id);

COMMENT ON TABLE public.shift_logs IS 'Registo de turnos (check-in/check-out). AppStaff LiveRoster e DEVICE_TURN_SHIFT_TASK_CONTRACT.';
