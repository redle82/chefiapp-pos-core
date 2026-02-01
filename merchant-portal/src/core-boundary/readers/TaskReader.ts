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

import { dockerCoreClient } from '../docker-core/connection';
import type { CoreTask } from '../docker-core/types';

const OPEN_TASKS_CACHE_TTL_MS = 5000; // 5 segundos
let openTasksCache: { key: string; data: CoreTask[]; ts: number } | null = null;

function getOpenTasksCacheKey(restaurantId: string, station?: string): string {
  return `open:${restaurantId}:${station ?? 'all'}`;
}

/**
 * Lê tarefas abertas para um restaurante.
 * TASK PACKS: Atualizado para incluir template_id e evidence_json.
 * Cache TTL 5s para reduzir carga em gm_tasks.
 */
export async function readOpenTasks(
  restaurantId: string,
  station?: 'BAR' | 'KITCHEN' | 'SERVICE'
): Promise<CoreTask[]> {
  const cacheKey = getOpenTasksCacheKey(restaurantId, station);
  const now = Date.now();
  if (openTasksCache && openTasksCache.key === cacheKey && now - openTasksCache.ts < OPEN_TASKS_CACHE_TTL_MS) {
    return openTasksCache.data;
  }

  let query = dockerCoreClient
    .from('gm_tasks')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('status', 'OPEN')
    .order('priority', { ascending: false }) // CRITICA primeiro
    .order('created_at', { ascending: false }); // Mais recente primeiro

  if (station) {
    query = query.eq('station', station);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to read tasks: ${error.message}`);
  }

  // Garantir que evidence_json existe (default para {})
  const result = (data || []).map((task: any) => ({
    ...task,
    evidence_json: task.evidence_json || {},
  })) as CoreTask[];

  openTasksCache = { key: cacheKey, data: result, ts: now };
  return result;
}

/**
 * Lê tarefas abertas por restaurante (alias para compatibilidade).
 */
export async function readOpenTasksByRestaurant(restaurantId: string): Promise<CoreTask[]> {
  return readOpenTasks(restaurantId);
}

/**
 * Lê tarefas abertas por estação.
 */
export async function readOpenTasksByStation(
  restaurantId: string,
  station: 'BAR' | 'KITCHEN' | 'SERVICE'
): Promise<CoreTask[]> {
  return readOpenTasks(restaurantId, station);
}

/**
 * Lê tarefas relacionadas a um pedido específico.
 */
export async function readTasksByOrder(orderId: string): Promise<CoreTask[]> {
  const { data, error } = await dockerCoreClient
    .from('gm_tasks')
    .select('*')
    .eq('order_id', orderId)
    .eq('status', 'OPEN')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to read tasks by order: ${error.message}`);
  }

  return (data || []) as CoreTask[];
}

/**
 * Lê tarefas relacionadas a um item específico.
 */
export async function readTasksByItem(itemId: string): Promise<CoreTask[]> {
  const { data, error } = await dockerCoreClient
    .from('gm_tasks')
    .select('*')
    .eq('order_item_id', itemId)
    .eq('status', 'OPEN')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to read tasks by item: ${error.message}`);
  }

  return (data || []) as CoreTask[];
}

/**
 * Lê tarefas para analytics (todos os status, opcionalmente filtradas por período).
 * Usado por TaskAnalytics.analyze.
 */
const ANALYTICS_TASKS_LIMIT = 1000;

export async function readTasksForAnalytics(
  restaurantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CoreTask[]> {
  const { data, error } = await dockerCoreClient
    .from('gm_tasks')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(ANALYTICS_TASKS_LIMIT);

  if (error) {
    throw new Error(`Failed to read tasks for analytics: ${error.message}`);
  }

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
}

/**
 * Lê uma tarefa por ID (qualquer status).
 * Usado pela página de detalhes da tarefa.
 */
export async function readTaskById(taskId: string): Promise<CoreTask | null> {
  const { data, error } = await dockerCoreClient
    .from('gm_tasks')
    .select('*')
    .eq('id', taskId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read task by id: ${error.message}`);
  }

  if (!data) return null;

  return {
    ...data,
    evidence_json: (data as any).evidence_json || {},
  } as CoreTask;
}
