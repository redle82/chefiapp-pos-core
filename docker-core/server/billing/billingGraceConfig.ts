/**
 * Billing Grace Period Config — Smart downgrade thresholds
 *
 * No hardcoded numbers in churn engine; read from here.
 */

export const GRACE_PERIODS = {
  /** After this many failures → past_due_limited */
  limitedAfterDays: 3,
  /** After this many failures → past_due_readonly */
  readonlyAfterDays: 5,
  /** After this many failed retries → paused (total failures = 1 + pauseAfterAttempts) */
  pauseAfterAttempts: 3,
} as const;

/** Derived: attempt count thresholds for status transitions */
export const GRACE_ATTEMPT_THRESHOLDS = {
  limitedAfterAttempts: 2,
  readonlyAfterAttempts: 3,
  pauseAfterAttempts: 4,
} as const;
