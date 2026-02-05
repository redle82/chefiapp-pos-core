-- Onda 3 · F2 — Eventos cash_register_opened e cash_register_closed em gm_audit_logs (AUDIT_LOG_SPEC §3.4).
-- Triggers em gm_cash_registers: abertura (INSERT status=open) e fecho (UPDATE open→closed).
-- Ref: docs/architecture/AUDIT_LOG_SPEC.md

-- 1. Trigger: abertura de caixa (INSERT com status = 'open')
CREATE OR REPLACE FUNCTION public.gm_cash_registers_audit_opened()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'open' THEN
    INSERT INTO public.gm_audit_logs (
      tenant_id, actor_id, action, resource_entity, resource_id,
      metadata, event_type, actor_type, result
    ) VALUES (
      NEW.restaurant_id,
      auth.uid(),
      'CASH_REGISTER_OPENED',
      'cash_register',
      NEW.id::text,
      jsonb_build_object(
        'name', NEW.name,
        'opening_balance_cents', COALESCE(NEW.opening_balance_cents, 0),
        'opened_by', COALESCE(NEW.opened_by, '')
      ),
      'cash_register_opened',
      'user',
      'success'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_gm_cash_registers_audit_opened ON public.gm_cash_registers;
CREATE TRIGGER tr_gm_cash_registers_audit_opened
  AFTER INSERT ON public.gm_cash_registers
  FOR EACH ROW
  EXECUTE FUNCTION public.gm_cash_registers_audit_opened();

COMMENT ON FUNCTION public.gm_cash_registers_audit_opened() IS
  'F2 Onda 3: regista cash_register_opened em gm_audit_logs (AUDIT_LOG_SPEC §3.4).';

-- 2. Trigger: fecho de caixa (UPDATE de status 'open' para 'closed')
CREATE OR REPLACE FUNCTION public.gm_cash_registers_audit_closed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'open' AND NEW.status = 'closed' THEN
    INSERT INTO public.gm_audit_logs (
      tenant_id, actor_id, action, resource_entity, resource_id,
      metadata, event_type, actor_type, result
    ) VALUES (
      NEW.restaurant_id,
      auth.uid(),
      'CASH_REGISTER_CLOSED',
      'cash_register',
      NEW.id::text,
      jsonb_build_object(
        'opening_balance_cents', COALESCE(OLD.opening_balance_cents, 0),
        'closing_balance_cents', COALESCE(NEW.closing_balance_cents, 0),
        'total_sales_cents', COALESCE(NEW.total_sales_cents, 0),
        'closed_by', COALESCE(NEW.closed_by, '')
      ),
      'cash_register_closed',
      'user',
      'success'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_gm_cash_registers_audit_closed ON public.gm_cash_registers;
CREATE TRIGGER tr_gm_cash_registers_audit_closed
  AFTER UPDATE ON public.gm_cash_registers
  FOR EACH ROW
  EXECUTE FUNCTION public.gm_cash_registers_audit_closed();

COMMENT ON FUNCTION public.gm_cash_registers_audit_closed() IS
  'F2 Onda 3: regista cash_register_closed em gm_audit_logs (AUDIT_LOG_SPEC §3.4).';
