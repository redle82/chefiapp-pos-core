-- ============================================================================
-- P0.1 FIX: TERMINAL STATE MUTATION BLOCK
-- Risk: R-032 (☠️ Unacceptable)
-- 
-- This trigger prevents ANY mutation on orders that have reached terminal state.
-- Terminal states: 'delivered', 'canceled'
-- 
-- Why this is critical:
-- - Financial audit requires immutable records
-- - No bug, retry, webhook, or race condition can revert a closed order
-- - This is the "judge" layer - Domain can't override
-- ============================================================================

-- Function that blocks mutations on terminal orders
CREATE OR REPLACE FUNCTION gm_block_terminal_order_mutation()
RETURNS trigger AS $$
BEGIN
  -- Log the attempt for audit
  RAISE WARNING '[SECURITY] Attempted mutation on terminal order (status: %, order_id: %, attempted_status: %)',
    OLD.status, OLD.id, NEW.status;
  
  -- Block the mutation
  RAISE EXCEPTION 'TERMINAL_STATE_IMMUTABLE: Cannot mutate order in terminal state (status: %, order_id: %)',
    OLD.status, OLD.id;
  
  -- This line is never reached, but required for type safety
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists (idempotent)
DROP TRIGGER IF EXISTS prevent_terminal_order_mutation_trigger ON gm_orders;

-- Create trigger that fires BEFORE any UPDATE on terminal orders
CREATE TRIGGER prevent_terminal_order_mutation_trigger
BEFORE UPDATE ON gm_orders
FOR EACH ROW
WHEN (OLD.status IN ('delivered', 'canceled'))
EXECUTE FUNCTION gm_block_terminal_order_mutation();

-- ============================================================================
-- VERIFICATION: List trigger to confirm it exists
-- ============================================================================
DO $$
DECLARE
  trigger_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'prevent_terminal_order_mutation_trigger'
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    RAISE NOTICE '✓ Trigger prevent_terminal_order_mutation_trigger created successfully';
  ELSE
    RAISE EXCEPTION '✗ Failed to create trigger prevent_terminal_order_mutation_trigger';
  END IF;
END $$;

-- ============================================================================
-- COMMENT: Document the invariant
-- ============================================================================
COMMENT ON TRIGGER prevent_terminal_order_mutation_trigger ON gm_orders IS 
  'P0 Security: Blocks ANY mutation on orders with status IN (delivered, canceled). ' ||
  'This enforces financial immutability at the database level. ' ||
  'Risk: R-032 | Status: ENFORCED | Date: 2026-01-14';
