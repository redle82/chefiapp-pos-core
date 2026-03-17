/**
 * TaskReader — Leituras de tarefas (gm_tasks).
 */

import type { CoreTask } from "../docker-core/types";
import { dockerCoreClient } from "../docker-core/connection";

/**
 * Tarefas em estado OPEN (e opcionalmente ACKNOWLEDGED), filtradas por restaurante e opcionalmente estação/turno.
 */
export async function readOpenTasks(
  restaurantId: string,
  station?: string,
  _turnSessionId?: string
): Promise<CoreTask[]> {
  let q = dockerCoreClient
    .from("gm_tasks")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .in("status", ["OPEN", "ACKNOWLEDGED"])
    .order("created_at", { ascending: false });
  if (station) q = q.eq("station", station);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as CoreTask[];
}

/**
 * Todas as tarefas abertas do restaurante (alias para readOpenTasks sem filtro de estação).
 */
export async function readOpenTasksByRestaurant(
  restaurantId: string
): Promise<CoreTask[]> {
  return readOpenTasks(restaurantId);
}

/**
 * Tarefa por ID.
 */
export async function readTaskById(taskId: string): Promise<CoreTask | null> {
  const { data, error } = await dockerCoreClient
    .from("gm_tasks")
    .select("*")
    .eq("id", taskId)
    .maybeSingle();
  if (error || !data) return null;
  return data as CoreTask;
}

/**
 * Tarefas pendentes (OPEN/ACKNOWLEDGED) para a vista "Agora", opcionalmente por estação.
 */
export async function readPendingTasksForAgora(
  restaurantId: string,
  station?: string
): Promise<CoreTask[]> {
  return readOpenTasks(restaurantId, station);
}

/**
 * Tarefas para analytics (período opcional; todas se não especificado).
 */
export async function readTasksForAnalytics(
  restaurantId: string,
  _limit: number = 500
): Promise<CoreTask[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_tasks")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(_limit);
  if (error) return [];
  return (data ?? []) as CoreTask[];
}

/**
 * Histórico de tarefas do restaurante (todas os status).
 */
export async function readTaskHistory(
  restaurantId: string,
  limit: number = 100
): Promise<CoreTask[]> {
  return readTasksForAnalytics(restaurantId, limit);
}

/**
 * Histórico de tarefas por funcionário (assigned_to ou criador).
 */
export async function readEmployeeTaskHistory(
  restaurantId: string,
  _employeeId?: string | null,
  limit: number = 100
): Promise<CoreTask[]> {
  if (!_employeeId) return readTaskHistory(restaurantId, limit);
  const { data, error } = await dockerCoreClient
    .from("gm_tasks")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("assigned_to", _employeeId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as CoreTask[];
}

/**
 * All tasks for today (all statuses) -- for the execution board.
 * Returns OPEN, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, DISMISSED tasks created today.
 */
export async function readTodayTasks(
  restaurantId: string,
  station?: string
): Promise<CoreTask[]> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let q = dockerCoreClient
    .from("gm_tasks")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", todayStart.toISOString())
    .order("created_at", { ascending: false });
  if (station) q = q.eq("station", station);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as CoreTask[];
}

/**
 * Tasks in progress (IN_PROGRESS status).
 */
export async function readInProgressTasks(
  restaurantId: string,
  station?: string
): Promise<CoreTask[]> {
  let q = dockerCoreClient
    .from("gm_tasks")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("status", "IN_PROGRESS")
    .order("created_at", { ascending: false });
  if (station) q = q.eq("station", station);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as CoreTask[];
}

/**
 * Resolved tasks today.
 */
export async function readResolvedTodayTasks(
  restaurantId: string,
  station?: string
): Promise<CoreTask[]> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let q = dockerCoreClient
    .from("gm_tasks")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .in("status", ["RESOLVED", "DISMISSED"])
    .gte("created_at", todayStart.toISOString())
    .order("created_at", { ascending: false });
  if (station) q = q.eq("station", station);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as CoreTask[];
}
