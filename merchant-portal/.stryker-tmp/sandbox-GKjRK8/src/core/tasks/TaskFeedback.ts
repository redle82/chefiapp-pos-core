/**
 * TaskFeedback - Sistema de Feedback de Tarefas
 *
 * Gerencia feedback, avaliação e impacto no SLA.
 *
 * DOCKER MODE: no-op seguro, sem log de CORE TODO no console.
 * SUPABASE/OUTROS: log CORE TODO ao usar operações ainda não ligadas ao Core.
 */

import { BackendType, getBackendType } from "../infra/backendAdapter";

export interface TaskFeedbackData {
  taskId: string;
  feedback: string;
  rating: number; // 1-5
  impactSla?: {
    delayMinutes?: number;
    affectedOrders?: string[];
    notes?: string;
  };
  actorId?: string;
}

export interface Task {
  id: string;
  restaurantId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category: string;
  dueAt: Date;
  completedAt?: Date;
  startedAt?: Date;
}

export class TaskFeedback {
  /**
   * Adicionar feedback a uma tarefa
   */
  async addFeedback(feedback: TaskFeedbackData): Promise<void> {
    if (getBackendType() !== BackendType.docker) {
      console.warn(
        "[CORE TODO] TaskFeedback.addFeedback ainda não persiste no Core. Dados recebidos:",
        feedback,
      );
    }
    return;
  }

  /**
   * Calcular impacto no SLA automaticamente
   */
  calculateSlaImpact(task: {
    dueAt: Date;
    completedAt?: Date;
    startedAt?: Date;
    status: string;
  }): {
    delayMinutes: number;
    isOnTime: boolean;
    impact: "none" | "low" | "medium" | "high";
  } {
    if (!task.completedAt) {
      const now = new Date();
      const delay = Math.max(
        0,
        (now.getTime() - task.dueAt.getTime()) / (1000 * 60),
      );

      return {
        delayMinutes: delay,
        isOnTime: delay === 0,
        impact:
          delay > 60
            ? "high"
            : delay > 30
            ? "medium"
            : delay > 0
            ? "low"
            : "none",
      };
    }

    const delay = Math.max(
      0,
      (task.completedAt.getTime() - task.dueAt.getTime()) / (1000 * 60),
    );

    return {
      delayMinutes: delay,
      isOnTime: delay === 0,
      impact:
        delay > 60
          ? "high"
          : delay > 30
          ? "medium"
          : delay > 0
          ? "low"
          : "none",
    };
  }

  /**
   * Buscar feedback de uma tarefa
   */
  async getFeedback(taskId: string): Promise<TaskFeedbackData | null> {
    if (getBackendType() !== BackendType.docker) {
      console.warn(
        "[CORE TODO] TaskFeedback.getFeedback ainda não lê do Core. Retornando null.",
        { taskId },
      );
    }
    return null;
  }

  /**
   * Listar tarefas com feedback
   */
  async getTasksWithFeedback(
    restaurantId: string,
    limit: number = 50,
  ): Promise<Array<Task & { feedback: TaskFeedbackData }>> {
    if (getBackendType() !== BackendType.docker) {
      console.warn(
        "[CORE TODO] TaskFeedback.getTasksWithFeedback ainda não lê do Core. Retornando lista vazia.",
        { restaurantId, limit },
      );
    }
    return [];
  }
}

export const taskFeedback = new TaskFeedback();
