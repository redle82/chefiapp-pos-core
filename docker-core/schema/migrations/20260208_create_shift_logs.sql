-- 20260208_create_shift_logs.sql
-- Creates shift_logs table for staff shift tracking

CREATE TABLE IF NOT EXISTS public.shift_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid NOT NULL REFERENCES public.gm_restaurants(id),
    employee_id uuid,
    role text NOT NULL DEFAULT 'waiter',
    start_time timestamptz NOT NULL DEFAULT now(),
    end_time timestamptz,
    duration_minutes integer,
    status text NOT NULL DEFAULT 'active',
    shift_score integer,
    meta jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shift_logs_restaurant_active
ON public.shift_logs(restaurant_id) WHERE status = 'active';

ALTER TABLE public.shift_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='shift_logs' AND policyname='shift_logs_all') THEN
    CREATE POLICY shift_logs_all ON public.shift_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
