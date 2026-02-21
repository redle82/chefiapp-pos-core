/**
 * FailureClassifier — CORE_FAILURE_MODEL enforcement
 *
 * Classifies errors into: acceptable (retry), degradation (partial service), critical (block/alert).
 * See docs/architecture/CORE_FAILURE_MODEL.md. The Core defines; UI obeys (no reclassification).
 */
// @ts-nocheck


export type FailureClass = 'acceptable' | 'degradation' | 'critical';

export interface ClassifyResult {
  class: FailureClass;
  reason: string;
}

/**
 * Classify a caught error according to CORE_FAILURE_MODEL.
 * Used by KernelContext.executeSafe, SyncEngine, and other Core boundaries.
 */
export function classifyFailure(error: unknown): ClassifyResult {
  const msg = typeof (error as any)?.message === 'string' ? (error as any).message : '';
  const code = (error as any)?.code ?? (error as any)?.status;

  // Critical: persistence, auth in sensitive op, data inconsistency
  if (
    msg.includes('persist') ||
    msg.includes('Failed to create system identity') ||
    msg.includes('foreign key') ||
    code === '23503' ||
    (msg.includes('permission') && msg.includes('sensitive')) ||
    msg.includes('PGRST301') // RLS / auth
  ) {
    return { class: 'critical', reason: 'CRITICAL_PERSISTENCE_OR_AUTH' };
  }

  // Degradation: offline, no network, queue active
  if (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    msg.includes('offline') ||
    msg.includes('disconnected') ||
    msg.includes('Supabase client forbidden') ||
    msg.includes('dockerCoreClient')
  ) {
    return { class: 'degradation', reason: 'DEGRADATION_NETWORK_OR_OFFLINE' };
  }

  // Acceptable: transient, retry-able (reader timeout, printer busy, conflict retry)
  if (
    msg.includes('occupied') ||
    msg.includes('printer') ||
    msg.includes('duplicate key') ||
    code === '23505' ||
    msg.includes('CASH_REGISTER_CLOSED') ||
    msg.includes('TABLE_HAS_ACTIVE_ORDER') ||
    msg.includes('EMPTY_ORDER')
  ) {
    return { class: 'acceptable', reason: 'ACCEPTABLE_RETRY_OR_RULE' };
  }

  // Default: unknown → critical (fail-closed; do not hide)
  return { class: 'critical', reason: 'CRITICAL_UNKNOWN' };
}
