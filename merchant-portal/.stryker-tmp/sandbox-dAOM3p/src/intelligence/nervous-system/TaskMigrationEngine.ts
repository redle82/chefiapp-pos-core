// @ts-nocheck
import type { Task, StaffRole } from '../../pages/AppStaff/context/StaffContext';
import { SystemEvents } from '../../core/events/SystemEvents';

// ------------------------------------------------------------------
// 📡 TASK MIGRATION ENGINE (Progressive Externalization - Law 6)
// ------------------------------------------------------------------
// When a specialized device connects, tasks migrate from generalists to specialists.
// This prevents cognitive overload and enables true multi-device orchestration.

export interface DeviceProfile {
  deviceId: string;
  role: StaffRole;
  connectedAt: number;
  isActive: boolean;
}

export interface TaskMigrationEvent {
  taskId: string;
  to: string;
  reason: string;
  success: boolean;
}

export interface MigrationResult {
  tasksToMigrate: Task[];
  tasksToKeep: Task[];
  targetDeviceId?: string;
}

/**
 * Determines which tasks should migrate when a new specialized device connects
 */
export const calculateTaskMigration = (
  currentTasks: Task[],
  currentDeviceRole: StaffRole,
  newDeviceRole: StaffRole,
  devices: DeviceProfile[]
): MigrationResult => {

  const tasksToMigrate: Task[] = [];
  const tasksToKeep: Task[] = [];

  // Only migrate if new device is MORE specialized for the task context
  // const newDeviceSpecialization = roleSpecialization[newDeviceRole]; // UNUSED

  for (const task of currentTasks) {
    // Skip completed tasks
    if (task.status === 'done') {
      tasksToKeep.push(task);
      continue;
    }

    // Check if task matches new device's specialization
    const shouldMigrate = checkMigrationEligibility(
      task,
      currentDeviceRole,
      newDeviceRole
    );

    if (shouldMigrate) {
      tasksToMigrate.push(task);
    } else {
      tasksToKeep.push(task);
    }
  }

  // Find target device ID (newest active device with matching role)
  const targetDevice = devices
    .filter(d => d.role === newDeviceRole && d.isActive)
    .sort((a, b) => b.connectedAt - a.connectedAt)[0];

  return {
    tasksToMigrate,
    tasksToKeep,
    targetDeviceId: targetDevice?.deviceId
  };
};

function checkMigrationEligibility(
  task: Task,
  _currentRole: StaffRole, // Unused
  newRole: StaffRole
): boolean {
  // MIGRATION RULES

  // Rule 1: Task explicitly assigned to new role
  if (task.assigneeRole === newRole) {
    return true;
  }

  // Rule 2: Task context matches new role's domain
  if (task.context) {
    const contextRoleMap: Record<string, StaffRole[]> = {
      'kitchen': ['kitchen'],
      'floor': ['waiter'],
      'bar': ['waiter'],
      'global': ['worker', 'manager'], // Global tasks stay with generalists
      'storage': ['manager', 'worker'] // Inventory stays with coordinator
    };

    const matchingRoles = contextRoleMap[task.context] || [];
    if (matchingRoles.includes(newRole)) {
      return true;
    }
  }

  // Rule 3: Task type specialization
  // Cleaning tasks → cleaning role
  // Production tasks → kitchen role
  if (task.uiMode === 'check' && newRole === 'cleaning') {
    return true;
  }

  if (task.uiMode === 'production' && newRole === 'kitchen') {
    return true;
  }

  if ((task.uiMode as string) === 'order' && (newRole as string) === 'waiter') {
    return true;
  }

  // Rule 4: Don't migrate critical tasks (they need immediate attention)
  if (task.priority === 'critical') {
    return false;
  }

  // Default: no migration
  return false;
}

/**
 * Recalculates dominant tool after task migration
 */
export const recalculateDominantTool = (
  remainingTasks: Task[],
  deviceRole: StaffRole,
  hasActiveOrders: boolean
): 'order' | 'production' | 'check' | 'none' => {

  // Waiter: Sales First (Always)
  if (deviceRole === 'waiter') return 'order';

  // Kitchen: Production First (if busy), Prep First (if idle)
  if (deviceRole === 'kitchen') {
    return hasActiveOrders ? 'production' : 'check';
  }

  // Cleaning: Checklist First
  if (deviceRole === 'cleaning') return 'check';

  // Manager/Owner: Dashboard (no tool)
  if (deviceRole === 'manager' || deviceRole === 'owner') return 'none';

  // Generic Worker: Determine from remaining tasks
  if (deviceRole === 'worker') {
    // If mostly check tasks, switch to check mode
    const checkTasks = remainingTasks.filter(t => t.uiMode === 'check' && t.status === 'pending');
    if (checkTasks.length > 0) return 'check';

    // If order-related tasks, switch to order mode
    const orderTasks = remainingTasks.filter(t => (t.uiMode as string) === 'order' && t.status === 'pending');
    if (orderTasks.length > 0) return 'order';

    // Default: no dominant tool (stream mode)
    return 'none';
  }

  return 'none';
};

/**
 * Broadcasts task migration event (for multi-device sync)
 */
export const broadcastMigration = async (
  migration: TaskMigrationEvent,
  sourceDeviceId: string
): Promise<void> => {
  // 5. BROADCAST (Synaptic Transmission) 📡
  if (!migration.success) return;

  console.log(`[TaskMigration] Broadcasting: ${migration.taskId} -> ${migration.to}`);

  // Local Broadcast (Instant UI Update)
  SystemEvents.emit('task:migration', {
    sourceDeviceId,
    targetDeviceId: migration.to, // 'backlog' or staff UUID
    taskIds: [migration.taskId], // Single task for now
    ts: Date.now(),
    reason: migration.reason
  });
};
