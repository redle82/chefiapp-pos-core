-- Onda 3 · G1 — Pipeline de eventos: gm_audit_logs consumíveis via Realtime.
-- Adicionar gm_audit_logs à publication supabase_realtime para subscrições (dashboards, agregadores).
-- Ref: docs/ops/EVENT_PIPELINE.md, EVENT_TAXONOMY.md

-- Add table to supabase_realtime publication (INSERT only; UPDATE/DELETE blocked by immutability trigger)
ALTER PUBLICATION supabase_realtime ADD TABLE public.gm_audit_logs;

COMMENT ON TABLE public.gm_audit_logs IS 'Realtime enabled (G1 Onda 3): eventos consumíveis por dashboards/agregadores; RLS aplica-se às subscrições.';
