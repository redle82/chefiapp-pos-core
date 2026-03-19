/**
 * TaskFeedback - Sistema de Feedback de Tarefas
 *
 * Gerencia feedback, avaliação e impacto no SLA.
 *
 * DOCKER MODE: no-op seguro, sem log de CORE TODO no console.
 * SUPABASE/OUTROS: log CORE TODO ao usar operações ainda não ligadas ao Core.
 */

import { BackendType, getBackendType } from "../infra/backendAdapter";
import { Logger } from "../logger";

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
    try {
      await this.persistFeedback(feedback);
    } catch {
      Logger.warn("[TaskFeedback] Failed to persist feedback", { feedback });
    }
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
    try {
      return await this.readFeedback(taskId);
    } catch {
      Logger.warn("[TaskFeedback] Failed to read feedback", { taskId });
      return null;
    }
  }

  /**
   * Listar tarefas com feedback
   */
  async getTasksWithFeedback(
    _restaurantId: string,
    _limit: number = 50,
  ): Promise<Array<Task & { feedback: TaskFeedbackData }>> {
    // IndexedDB stores feedback by taskId, not by restaurant
    // Full implementation requires joining with task data from Core
    return [];
  }

  private async persistFeedback(feedback: TaskFeedbackData): Promise<void> {
    const DB_NAME = "chefiapp_task_feedback";
    const STORE = "feedback";
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "taskId" });
        }
      };
      req.onsuccess = () => {
        try {
          const tx = req.result.transaction(STORE, "readwrite");
          tx.objectStore(STORE).put({ ...feedback, updatedAt: new Date().toISOString() });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        } catch (e) { reject(e); }
      };
      req.onerror = () => reject(req.error);
    });
  }

  private async readFeedback(taskId: string): Promise<TaskFeedbackData | null> {
    const DB_NAME = "chefiapp_task_feedback";
    const STORE = "feedback";
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "taskId" });
        }
      };
      req.onsuccess = () => {
        try {
          const tx = req.result.transaction(STORE, "readonly");
          const getReq = tx.objectStore(STORE).get(taskId);
          getReq.onsuccess = () => resolve(getReq.result ?? null);
          getReq.onerror = () => reject(getReq.error);
        } catch (e) { reject(e); }
      };
      req.onerror = () => reject(req.error);
    });
  }
}

export const taskFeedback = new TaskFeedback();
