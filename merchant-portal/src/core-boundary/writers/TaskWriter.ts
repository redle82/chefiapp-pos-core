/**
 * TASK WRITER
 *
 * Escreve/atualiza tarefas no Core (gm_tasks).
 * TASK ENGINE: Tarefas automáticas baseadas em eventos operacionais.
 * AppStaff: RPCs create_task, assign_task, start_task, complete_task, reject_task (TASKS_CONTRACT_v1).
 */

import { dockerCoreClient } from "../docker-core/connection";

const DOCKER_CORE_URL = import.meta.env.VITE_DOCKER_CORE_URL || "";
const DOCKER_CORE_ANON_KEY =
  import.meta.env.VITE_DOCKER_CORE_ANON_KEY ||
  "chefiapp-core-secret-key-min-32-chars-long";

/**
 * Gera tarefas automáticas a partir de pedidos.
 */
export async function generateTasks(
  restaurantId: string
): Promise<{ success: boolean; tasks_created: number }> {
  const url = `${DOCKER_CORE_URL}/rest/v1/rpc/generate_tasks_from_orders`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_restaurant_id: restaurantId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to generate tasks: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();

  if (!data || !data.success) {
    throw new Error(
      `Task generation failed: ${data?.error || "Unknown error"}`
    );
  }

  return {
    success: data.success,
    tasks_created: data.tasks_created || 0,
  };
}

/**
 * Gera tarefas agendadas a partir de templates.
 */
export async function generateScheduledTasks(
  restaurantId: string,
  now?: Date
): Promise<{ success: boolean; tasks_created: number }> {
  const url = `${DOCKER_CORE_URL}/rest/v1/rpc/generate_scheduled_tasks`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: DOCKER_CORE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_restaurant_id: restaurantId,
      p_now: (now || new Date()).toISOString(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to generate scheduled tasks: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();

  if (!data || !data.success) {
    throw new Error(
      `Scheduled task generation failed: ${data?.error || "Unknown error"}`
    );
  }

  return {
    success: data.success,
    tasks_created: data.tasks_created || 0,
  };
}

/**
 * Marca uma tarefa como reconhecida (acknowledged).
 * TASK PACKS: Suporte para userId.
 */
export async function acknowledgeTask(
  taskId: string,
  userId?: string
): Promise<void> {
  const { error } = await dockerCoreClient
    .from("gm_tasks")
    .update({
      status: "ACKNOWLEDGED",
      acknowledged_at: new Date().toISOString(),
      assigned_to: userId || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) {
    throw new Error(`Failed to acknowledge task: ${error.message}`);
  }
}

/**
 * Marca uma tarefa como resolvida (resolved).
 * TASK PACKS: Suporte para evidence (temperatura, foto, etc).
 */
export async function resolveTask(
  taskId: string,
  userId?: string,
  evidence?: {
    temperature?: number;
    photo_url?: string;
    signature?: string;
    text?: string;
    [key: string]: any;
  }
): Promise<void> {
  const updateData: any = {
    status: "RESOLVED",
    resolved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (userId) {
    updateData.assigned_to = userId;
  }

  if (evidence) {
    // Mesclar com evidence_json existente
    const { data: currentTask } = await dockerCoreClient
      .from("gm_tasks")
      .select("evidence_json")
      .eq("id", taskId)
      .single();

    const currentEvidence = (currentTask?.evidence_json as any) || {};
    updateData.evidence_json = { ...currentEvidence, ...evidence };
  }

  const { error } = await dockerCoreClient
    .from("gm_tasks")
    .update(updateData)
    .eq("id", taskId);

  if (error) {
    throw new Error(`Failed to resolve task: ${error.message}`);
  }
}

/**
 * Dispensa uma tarefa (dismissed).
 * TASK PACKS: Suporte para userId.
 */
export async function dismissTask(
  taskId: string,
  userId?: string
): Promise<void> {
  const updateData: any = {
    status: "DISMISSED",
    updated_at: new Date().toISOString(),
  };

  if (userId) {
    updateData.assigned_to = userId;
  }

  const { error } = await dockerCoreClient
    .from("gm_tasks")
    .update(updateData)
    .eq("id", taskId);

  if (error) {
    throw new Error(`Failed to dismiss task: ${error.message}`);
  }
}

// =============================================================================
// APPSTAFF RPCs (TASKS_CONTRACT_v1, CORE_TASK_EXECUTION_CONTRACT)
// =============================================================================

export interface CreateTaskParams {
  restaurantId: string;
  taskType: string;
  message: string;
  station?: string | null;
  priority?: string;
  orderId?: string | null;
  orderItemId?: string | null;
  context?: Record<string, unknown>;
  autoGenerated?: boolean;
}

/** Cria tarefa no Core via RPC (status OPEN). */
export async function createTaskRpc(params: CreateTaskParams): Promise<string> {
  const { data, error } = await dockerCoreClient.rpc("create_task", {
    p_restaurant_id: params.restaurantId,
    p_task_type: params.taskType,
    p_message: params.message,
    p_station: params.station ?? null,
    p_priority: params.priority ?? "MEDIA",
    p_order_id: params.orderId ?? null,
    p_order_item_id: params.orderItemId ?? null,
    p_context: params.context ?? {},
    p_auto_generated: params.autoGenerated ?? false,
  });
  if (error) throw new Error(`create_task failed: ${error.message}`);
  if (data == null) throw new Error("create_task returned no id");
  return data as string;
}

/** Atribui tarefa a um utilizador (RPC). */
export async function assignTaskRpc(
  taskId: string,
  assignedTo: string,
  restaurantId?: string | null
): Promise<void> {
  const { error } = await dockerCoreClient.rpc("assign_task", {
    p_task_id: taskId,
    p_assigned_to: assignedTo,
    p_restaurant_id: restaurantId ?? null,
  });
  if (error) throw new Error(`assign_task failed: ${error.message}`);
}

/** Marca tarefa como em execução OPEN → ACKNOWLEDGED (RPC). */
export async function startTaskRpc(
  taskId: string,
  actorId?: string | null,
  restaurantId?: string | null
): Promise<void> {
  const { error } = await dockerCoreClient.rpc("start_task", {
    p_task_id: taskId,
    p_actor_id: actorId ?? null,
    p_restaurant_id: restaurantId ?? null,
  });
  if (error) throw new Error(`start_task failed: ${error.message}`);
}

/** Marca tarefa como concluída RESOLVED (RPC). */
export async function completeTaskRpc(
  taskId: string,
  actorId?: string | null,
  restaurantId?: string | null
): Promise<void> {
  const { error } = await dockerCoreClient.rpc("complete_task", {
    p_task_id: taskId,
    p_actor_id: actorId ?? null,
    p_restaurant_id: restaurantId ?? null,
  });
  if (error) throw new Error(`complete_task failed: ${error.message}`);
}

/** Rejeita tarefa com motivo DISMISSED (RPC). */
export async function rejectTaskRpc(
  taskId: string,
  reason?: string | null,
  actorId?: string | null,
  restaurantId?: string | null
): Promise<void> {
  const { error } = await dockerCoreClient.rpc("reject_task", {
    p_task_id: taskId,
    p_reason: reason ?? null,
    p_actor_id: actorId ?? null,
    p_restaurant_id: restaurantId ?? null,
  });
  if (error) throw new Error(`reject_task failed: ${error.message}`);
}
