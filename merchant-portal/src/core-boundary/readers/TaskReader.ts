/**
 * TASK READER
 *
 * Lê tarefas do Core (gm_tasks).
 * TASK ENGINE: Tarefas automáticas baseadas em eventos operacionais.
 * TASK PACKS: Suporte para templates e evidências.
 *
 * PERFORMANCE: Cache TTL (5s) em readOpenTasks para evitar rajadas de
 * requests gm_tasks quando vários consumidores (Health, Tasks, KDS, etc.)
 * ou efeitos mal dependenciados disparam ao mesmo tempo.
 */

import { dockerCoreClient } from "../docker-core/connection";
import type { CoreTask } from "../docker-core/types";
import { isBackendUnavailable } from "../menuPilotFallback";

const OPEN_TASKS_CACHE_TTL_MS = 5000; // 5 segundos
let openTasksCache: { key: string; data: CoreTask[]; ts: number } | null = null;

function getOpenTasksCacheKey(
  restaurantId: string,
  station?: string,
  turnSessionId?: string,
): string {
  return `open:${restaurantId}:${station ?? "all"}:${turnSessionId ?? "none"}`;
}

/**
 * Lê tarefas abertas para um restaurante.
 * FASE 3 Passo 2: opcionalmente filtra por turn_session_id (tarefas do turno ou sem turno).
 * Cache TTL 5s para reduzir carga em gm_tasks.
 */
export async function readOpenTasks(
  restaurantId: string,
  station?: "BAR" | "KITCHEN" | "SERVICE",
  turnSessionId?: string | null,
): Promise<CoreTask[]> {
  const cacheKey = getOpenTasksCacheKey(
    restaurantId,
    station,
    turnSessionId ?? undefined,
  );
  const now = Date.now();
  if (
    openTasksCache &&
    openTasksCache.key === cacheKey &&
    now - openTasksCache.ts < OPEN_TASKS_CACHE_TTL_MS
  ) {
    return openTasksCache.data;
  }

  let query = dockerCoreClient
    .from("gm_tasks")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("status", "OPEN")
    .order("priority", { ascending: false }) // CRITICA primeiro
    .order("created_at", { ascending: false }); // Mais recente primeiro

  if (station) {
    query = query.eq("station", station);
  }

  // FASE 3 Passo 2: no contexto de um turno, mostrar tarefas deste turno ou sem turno atribuído
  if (turnSessionId) {
    query = query.or(
      `turn_session_id.eq.${turnSessionId},turn_session_id.is.null`,
    );
  }

  try {
    const { data, error } = await query;
    if (error) throw new Error(`Failed to read tasks: ${error.message}`);
    const result = (data || []).map((task: any) => ({
      ...task,
      evidence_json: task.evidence_json || {},
    })) as CoreTask[];
    openTasksCache = { key: cacheKey, data: result, ts: now };
    return result;
  } catch (err) {
    if (isBackendUnavailable(err)) return [];
    throw err;
  }
}

/**
 * Lê tarefas abertas por restaurante (alias para compatibilidade).
 */
export async function readOpenTasksByRestaurant(
  restaurantId: string,
): Promise<CoreTask[]> {
  return readOpenTasks(restaurantId);
}

/**
 * Lê tarefas abertas por estação.
 */
export async function readOpenTasksByStation(
  restaurantId: string,
  station: "BAR" | "KITCHEN" | "SERVICE",
): Promise<CoreTask[]> {
  return readOpenTasks(restaurantId, station);
}

/**
 * Lê tarefas relacionadas a um pedido específico.
 */
export async function readTasksByOrder(orderId: string): Promise<CoreTask[]> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_tasks")
      .select("*")
      .eq("order_id", orderId)
      .eq("status", "OPEN")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (error)
      throw new Error(`Failed to read tasks by order: ${error.message}`);
    return (data || []) as CoreTask[];
  } catch (err) {
    if (isBackendUnavailable(err)) return [];
    throw err;
  }
}

/**
 * Lê tarefas relacionadas a um item específico.
 */
export async function readTasksByItem(itemId: string): Promise<CoreTask[]> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_tasks")
      .select("*")
      .eq("order_item_id", itemId)
      .eq("status", "OPEN")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (error)
      throw new Error(`Failed to read tasks by item: ${error.message}`);
    return (data || []) as CoreTask[];
  } catch (err) {
    if (isBackendUnavailable(err)) return [];
    throw err;
  }
}

/**
 * Lê tarefas para analytics (todos os status, opcionalmente filtradas por período).
 * Usado por TaskAnalytics.analyze.
 */
const ANALYTICS_TASKS_LIMIT = 1000;

export async function readTasksForAnalytics(
  restaurantId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<CoreTask[]> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_tasks")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(ANALYTICS_TASKS_LIMIT);
    if (error)
      throw new Error(`Failed to read tasks for analytics: ${error.message}`);
    let list = (data || []).map((task: any) => ({
      ...task,
      evidence_json: task.evidence_json || {},
    })) as CoreTask[];
    if (startDate || endDate) {
      const start = startDate ? startDate.getTime() : 0;
      const end = endDate ? endDate.getTime() : Number.POSITIVE_INFINITY;
      list = list.filter((t) => {
        const created = new Date(t.created_at).getTime();
        return created >= start && created <= end;
      });
    }
    return list;
  } catch (err) {
    if (isBackendUnavailable(err)) return [];
    throw err;
  }
}

/**
 * Lê tarefas pendentes para a tela "Agora" (OPEN + ACKNOWLEDGED).
 * Opcionalmente filtra por estação; o caller pode filtrar por assigned_to (minhas + críticas não atribuídas).
 */
export async function readPendingTasksForAgora(
  restaurantId: string,
  station?: "BAR" | "KITCHEN" | "SERVICE" | null,
): Promise<CoreTask[]> {
  let query = dockerCoreClient
    .from("gm_tasks")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .in("status", ["OPEN", "ACKNOWLEDGED"])
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (station) {
    query = query.eq("station", station);
  }

  try {
    const { data, error } = await query;
    if (error)
      throw new Error(`Failed to read pending tasks: ${error.message}`);
    return (data || []).map((task: any) => ({
      ...task,
      evidence_json: task.evidence_json || {},
    })) as CoreTask[];
  } catch (err) {
    if (isBackendUnavailable(err)) return [];
    throw err;
  }
}

/**
 * Lê uma tarefa por ID (qualquer status).
 * Usado pela página de detalhes da tarefa.
 */
export async function readTaskById(taskId: string): Promise<CoreTask | null> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_tasks")
      .select("*")
      .eq("id", taskId)
      .maybeSingle();
    if (error) throw new Error(`Failed to read task by id: ${error.message}`);
    if (!data) return null;
    return {
      ...data,
      evidence_json: (data as any).evidence_json || {},
    } as CoreTask;
  } catch (err) {
    if (isBackendUnavailable(err)) return null;
    throw err;
  }
}

/**
 * Lê histórico de uma tarefa (task_history).
 * Usado por TaskAnalytics.getTaskHistory.
 */
export async function readTaskHistory(taskId: string): Promise<
  Array<{
    action: string;
    actor_id?: string;
    actor_role?: string;
    old_status?: string;
    new_status?: string;
    metadata?: Record<string, any>;
    created_at: string;
  }>
> {
  try {
    const { data, error } = await dockerCoreClient
      .from("task_history")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(`Failed to read task history: ${error.message}`);
    return (data || []) as any[];
  } catch (err) {
    if (isBackendUnavailable(err)) return [];
    throw err;
  }
}

/**
 * Lê histórico de ações de um funcionário em tarefas (task_history por actor_id).
 * Usado por TaskAnalytics.getEmployeeHistory.
 */
export async function readEmployeeTaskHistory(
  employeeId: string,
  limit: number = 100,
): Promise<
  Array<{
    task_id: string;
    action: string;
    new_status?: string;
    created_at: string;
    metadata?: Record<string, any>;
  }>
> {
  try {
    const { data, error } = await dockerCoreClient
      .from("task_history")
      .select("*")
      .eq("actor_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error)
      throw new Error(`Failed to read employee task history: ${error.message}`);
    return (data || []) as any[];
  } catch (err) {
    if (isBackendUnavailable(err)) return [];
    throw err;
  }
}
