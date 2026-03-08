import { readTaskById } from "../../infra/readers/TaskReader";
import {
  acknowledgeTask,
  dismissTask,
  resolveTask,
} from "../../infra/writers/TaskWriter";
import { BackendType, getBackendType } from "../infra/backendAdapter";
import { Logger } from "../logger";
import type { Task } from "./TaskFiltering";
import { mapCoreTaskToTask } from "./TaskFiltering";

/**
 * DOCKER MODE: Adapters ligados ao Docker Core para a página de detalhes de tarefa.
 * SUPABASE/OUTROS: updateTaskStatusFromCoreTODO é no-op.
 */

export async function fetchTaskByIdFromCoreTODO(
  taskId: string,
): Promise<Task | null> {
  try {
    const coreTask = await readTaskById(taskId);
    if (!coreTask) return null;
    return mapCoreTaskToTask(coreTask);
  } catch (error) {
    Logger.error("[TaskDetailCoreTODO] fetchTaskByIdFromCoreTODO:", error);
    return null;
  }
}

export async function updateTaskStatusFromCoreTODO(
  taskId: string,
  newStatus: Task["status"],
): Promise<void> {
  if (getBackendType() !== BackendType.docker) {
    return;
  }
  try {
    if (newStatus === "in_progress") {
      await acknowledgeTask(taskId);
    } else if (newStatus === "completed") {
      await resolveTask(taskId);
    } else if (newStatus === "cancelled") {
      await dismissTask(taskId);
    }
    // pending / overdue: não alteramos status no Core (OPEN permanece)
  } catch (error) {
    Logger.error("[TaskDetailCoreTODO] updateTaskStatusFromCoreTODO:", error);
    throw error;
  }
}
