-- =============================================================================
-- Migration: 20260223 — KDS: OPEN→READY + garantir task RPCs
-- Purpose:
--   1. Allow OPEN → READY so mark_item_ready can set order READY when all items ready.
--   2. Ensure start_task, complete_task, reject_task exist (idempotent CREATE OR REPLACE).
-- =============================================================================

-- 1. Allow OPEN → READY (mark_item_ready path: all items ready → order READY)
CREATE OR REPLACE FUNCTION public.validate_order_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    IF OLD.status IN ('CLOSED', 'CANCELLED') THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Cannot transition from terminal status %. Order: %',
            OLD.status, OLD.id;
    END IF;

    IF NEW.status IN ('CLOSED', 'CANCELLED') THEN
        NULL;
    ELSE
        CASE OLD.status
            WHEN 'OPEN' THEN
                -- OPEN → PREPARING, IN_PREP (KDS), or READY (mark_item_ready when all items ready)
                IF NEW.status NOT IN ('PREPARING', 'IN_PREP', 'READY') THEN
                    RAISE EXCEPTION 'INVALID_TRANSITION: OPEN can only go to PREPARING, IN_PREP, or READY. Got: %. Use CLOSED for payment, CANCELLED to cancel.', NEW.status;
                END IF;
            WHEN 'PREPARING' THEN
                IF NEW.status NOT IN ('IN_PREP') THEN
                    RAISE EXCEPTION 'INVALID_TRANSITION: PREPARING can only advance to IN_PREP. Got: %.', NEW.status;
                END IF;
            WHEN 'IN_PREP' THEN
                IF NEW.status NOT IN ('READY') THEN
                    RAISE EXCEPTION 'INVALID_TRANSITION: IN_PREP can only advance to READY. Got: %.', NEW.status;
                END IF;
            WHEN 'READY' THEN
                RAISE EXCEPTION 'INVALID_TRANSITION: READY can only go to CLOSED or CANCELLED. Got: %', NEW.status;
            ELSE
                RAISE EXCEPTION 'INVALID_TRANSITION: Unknown status: %', OLD.status;
        END CASE;
    END IF;

    IF NEW.status = 'IN_PREP' AND NEW.in_prep_at IS NULL THEN
        NEW.in_prep_at := NOW();
    END IF;
    IF NEW.status = 'READY' AND NEW.ready_at IS NULL THEN
        NEW.ready_at := NOW();
    END IF;
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_order_status_transition IS
'Constitutional Law v3: OPEN→READY allowed for mark_item_ready (all items ready). KDS: OPEN→PREPARING→IN_PREP→READY. Payment: any non-terminal→CLOSED.';

-- 2. Ensure task RPCs exist (idempotent; 03-migrations-consolidated may already have them)
CREATE OR REPLACE FUNCTION public.start_task(
  p_task_id UUID,
  p_actor_id UUID DEFAULT NULL,
  p_restaurant_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  SELECT restaurant_id INTO v_restaurant_id FROM public.gm_tasks WHERE id = p_task_id;
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', p_task_id;
  END IF;
  IF p_restaurant_id IS NOT NULL AND v_restaurant_id != p_restaurant_id THEN
    RAISE EXCEPTION 'Task does not belong to restaurant %', p_restaurant_id;
  END IF;
  UPDATE public.gm_tasks
  SET status = 'ACKNOWLEDGED', acknowledged_at = NOW(), updated_at = NOW()
  WHERE id = p_task_id AND status = 'OPEN';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found or not in OPEN status', p_task_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_task(
  p_task_id UUID,
  p_actor_id UUID DEFAULT NULL,
  p_restaurant_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  SELECT restaurant_id INTO v_restaurant_id FROM public.gm_tasks WHERE id = p_task_id;
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', p_task_id;
  END IF;
  IF p_restaurant_id IS NOT NULL AND v_restaurant_id != p_restaurant_id THEN
    RAISE EXCEPTION 'Task does not belong to restaurant %', p_restaurant_id;
  END IF;
  UPDATE public.gm_tasks
  SET status = 'RESOLVED', resolved_at = COALESCE(resolved_at, NOW()), updated_at = NOW()
  WHERE id = p_task_id AND status IN ('OPEN', 'ACKNOWLEDGED');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found or already terminal', p_task_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_task(
  p_task_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_restaurant_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id UUID;
  v_context JSONB;
BEGIN
  SELECT restaurant_id, context INTO v_restaurant_id, v_context FROM public.gm_tasks WHERE id = p_task_id;
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', p_task_id;
  END IF;
  IF p_restaurant_id IS NOT NULL AND v_restaurant_id != p_restaurant_id THEN
    RAISE EXCEPTION 'Task does not belong to restaurant %', p_restaurant_id;
  END IF;
  UPDATE public.gm_tasks
  SET
    status = 'DISMISSED',
    resolved_at = COALESCE(resolved_at, NOW()),
    updated_at = NOW(),
    context = jsonb_set(COALESCE(context, '{}'::jsonb), '{reject_reason}', to_jsonb(COALESCE(p_reason, '')::TEXT))
  WHERE id = p_task_id AND status IN ('OPEN', 'ACKNOWLEDGED');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found or already terminal', p_task_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_task TO postgres;
GRANT EXECUTE ON FUNCTION public.complete_task TO postgres;
GRANT EXECUTE ON FUNCTION public.reject_task TO postgres;
