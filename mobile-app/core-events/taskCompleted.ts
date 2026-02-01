/**
 * Core Event: Tarefa concluída
 * CORE_APPSTAFF_CONTRACT — AppStaff envia eventos; Core aplica consequências.
 * Mock: regista localmente como "pending sync" quando offline.
 */

export interface TaskCompletedPayload {
  taskId: string;
  staffId: string;
  shiftId: string | null;
  completedAt: number;
}

export type TaskCompletedResult = { ok: true } | { ok: false; error: Error };

/**
 * Envia evento "tarefa concluída" ao Core.
 * Arquitetura: Core regista e aplica; AppStaff apenas reporta.
 */
export async function sendTaskCompleted(payload: TaskCompletedPayload): Promise<TaskCompletedResult> {
  try {
    // TODO: chamada real ao Core (RPC ou REST)
    console.log('[core-events] taskCompleted (mock):', payload.taskId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
  }
}
