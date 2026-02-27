/**
 * TaskMigrationEngine — Progressive Externalization (Law 6)
 *
 * Tasks that stay pending beyond a threshold must migrate to a more
 * visible surface (e.g., from a worker's queue to the owner dashboard).
 *
 * This engine calculates which tasks should be externalized based on:
 *   - Time-in-queue (SLA)
 *   - Priority escalation
 *   - Worker inactivity
 */

export interface TaskMigrationInput {
  taskId: string;
  createdAt: Date;
  priority: "low" | "medium" | "high" | "critical";
  assignedWorkerId?: string;
  lastWorkerActivityAt?: Date;
}

export interface TaskMigrationResult {
  taskId: string;
  shouldMigrate: boolean;
  reason?: string;
  targetSurface?: "owner-dashboard" | "team-alert" | "system-escalation";
}

const SLA_THRESHOLDS_MS = {
  critical: 5 * 60_000, // 5 min
  high: 15 * 60_000, // 15 min
  medium: 30 * 60_000, // 30 min
  low: 60 * 60_000, // 60 min
};

const WORKER_IDLE_THRESHOLD_MS = 10 * 60_000; // 10 min

/**
 * Calculate which tasks should migrate to a higher-visibility surface.
 */
export function calculateTaskMigration(
  tasks: TaskMigrationInput[],
  now: Date = new Date()
): TaskMigrationResult[] {
  return tasks.map((task) => {
    const ageMs = now.getTime() - task.createdAt.getTime();
    const slaMs = SLA_THRESHOLDS_MS[task.priority];

    // SLA breach — escalate
    if (ageMs > slaMs) {
      return {
        taskId: task.taskId,
        shouldMigrate: true,
        reason: `SLA breach: ${task.priority} task pending ${Math.round(
          ageMs / 60_000
        )}min (limit ${Math.round(slaMs / 60_000)}min)`,
        targetSurface:
          task.priority === "critical"
            ? "system-escalation"
            : "owner-dashboard",
      };
    }

    // Worker idle — reassign visibility
    if (task.lastWorkerActivityAt) {
      const idleMs = now.getTime() - task.lastWorkerActivityAt.getTime();
      if (idleMs > WORKER_IDLE_THRESHOLD_MS) {
        return {
          taskId: task.taskId,
          shouldMigrate: true,
          reason: `Worker idle ${Math.round(idleMs / 60_000)}min`,
          targetSurface: "team-alert",
        };
      }
    }

    return {
      taskId: task.taskId,
      shouldMigrate: false,
    };
  });
}
