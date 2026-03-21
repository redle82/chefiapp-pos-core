-- Migration: Add churn_risk to gm_automation_events trigger CHECK constraint
-- Phase: Automation Engine v4
-- Timestamp: 20260227100000
--
-- The original table was created with:
--   CONSTRAINT gm_automation_events_trigger_check CHECK (trigger IN ('activation_velocity_low'))
--
-- We drop and recreate the constraint to include 'churn_risk'.
-- This is a non-destructive online operation — no data loss, no lock escalation
-- beyond what ALTER TABLE normally requires on Postgres 15.

BEGIN;

ALTER TABLE gm_automation_events
  DROP CONSTRAINT IF EXISTS gm_automation_events_trigger_check;

ALTER TABLE gm_automation_events
  ADD CONSTRAINT gm_automation_events_trigger_check
  CHECK (trigger IN ('activation_velocity_low', 'churn_risk'));

-- Also update the CI/contract schema mirror (ci-automation-contract.sql is a
-- separate file used by the CI workflow; update the live DB only here).

COMMIT;
