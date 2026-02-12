-- =============================================================================
-- Migration: 20260220_fix_order_state_machine_payment_path.sql
-- Purpose: Fix state machine to allow payment closing from any non-terminal state
--
-- Problem: process_order_payment() sets status = 'CLOSED' directly from any
--   state (typically OPEN). The trg_validate_order_status trigger from
--   20260219 only allows READY → CLOSED, rejecting OPEN → CLOSED.
--   This means paying for an order WITHOUT KDS flow causes a 500 error.
--
-- Fix: Allow ANY non-terminal state → CLOSED (payment) and → CANCELLED.
--   KDS ordering constraint preserved: OPEN → PREPARING → IN_PREP → READY.
--   The state machine enforces KDS forward progression, not payment blocking.
--
-- Real-world flows supported after fix:
--   1. Quick service (no KDS): OPEN → CLOSED
--   2. Full KDS:              OPEN → PREPARING → IN_PREP → READY → CLOSED
--   3. Pay before ready:      OPEN → IN_PREP → CLOSED
--   4. Cancel anytime:        ANY non-terminal → CANCELLED
-- =============================================================================

-- Replace the trigger function with updated transition rules
CREATE OR REPLACE FUNCTION public.validate_order_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Allow same-status updates (idempotent)
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Terminal states: CLOSED and CANCELLED cannot transition
    IF OLD.status IN ('CLOSED', 'CANCELLED') THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Cannot transition from terminal status %. Order: %',
            OLD.status, OLD.id;
    END IF;

    -- RULE 1: Any non-terminal state can go to CLOSED (payment closes the order)
    -- RULE 2: Any non-terminal state can go to CANCELLED
    IF NEW.status IN ('CLOSED', 'CANCELLED') THEN
        -- These are always allowed from non-terminal states (already filtered above)
        NULL; -- fall through to timestamp handling
    ELSE
        -- RULE 3: KDS forward progression only
        CASE OLD.status
            WHEN 'OPEN' THEN
                IF NEW.status NOT IN ('PREPARING', 'IN_PREP') THEN
                    RAISE EXCEPTION 'INVALID_TRANSITION: OPEN can only advance to PREPARING or IN_PREP (KDS). Got: %. Use CLOSED for payment, CANCELLED to cancel.', NEW.status;
                END IF;
            WHEN 'PREPARING' THEN
                IF NEW.status NOT IN ('IN_PREP') THEN
                    RAISE EXCEPTION 'INVALID_TRANSITION: PREPARING can only advance to IN_PREP. Got: %. Use CLOSED for payment, CANCELLED to cancel.', NEW.status;
                END IF;
            WHEN 'IN_PREP' THEN
                IF NEW.status NOT IN ('READY') THEN
                    RAISE EXCEPTION 'INVALID_TRANSITION: IN_PREP can only advance to READY. Got: %. Use CLOSED for payment, CANCELLED to cancel.', NEW.status;
                END IF;
            WHEN 'READY' THEN
                -- READY can only go to CLOSED or CANCELLED (handled above)
                RAISE EXCEPTION 'INVALID_TRANSITION: READY can only go to CLOSED or CANCELLED. Got: %', NEW.status;
            ELSE
                RAISE EXCEPTION 'INVALID_TRANSITION: Unknown status: %', OLD.status;
        END CASE;
    END IF;

    -- Auto-populate timestamp columns
    IF NEW.status = 'PREPARING' AND NEW.in_prep_at IS NULL THEN
        -- PREPARING uses in_prep_at as "sent to kitchen"
        NULL; -- no timestamp for PREPARING specifically
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
'Constitutional Law v2: Enforces valid order status transitions.
KDS forward: OPEN → PREPARING → IN_PREP → READY (strict ordering).
Payment: ANY non-terminal → CLOSED (never blocks payment).
Cancel: ANY non-terminal → CANCELLED.
Terminal states (CLOSED, CANCELLED) cannot transition.';
