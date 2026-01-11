// AppStaff Core — Contracts (Facade)
import type {
  UUID,
  ISODateTime,
  Worker,
  Shift,
  RoleName,
  TaskSpec,
  Task,
  ContractResult,
} from "./types";
import type { LegalProfile } from "../src/lib/legal-types";
import { hasActiveShift, checkNoOverlappingShifts, checkMinRestBetweenShifts, checkTaskContext } from "./invariants";
import type { AppStaffEvent } from "./events";

function now(): ISODateTime {
  return new Date().toISOString();
}

export function startShift(
  worker: Worker,
  role: RoleName,
  recentShifts: Shift[],
  legal: LegalProfile,
  at: ISODateTime = now(),
): ContractResult<AppStaffEvent> {
  const violations = [
    ...checkNoOverlappingShifts(recentShifts, worker.id),
    ...(hasActiveShift(recentShifts, worker.id) ? [{ code: "ACTIVE_SHIFT", message: "Worker already in active shift" }] : []),
    ...checkMinRestBetweenShifts(recentShifts, worker.id, legal),
  ];
  if (violations.length) return { ok: false, violations };
  const shiftId = crypto.randomUUID();
  const event: AppStaffEvent = {
    id: crypto.randomUUID(),
    type: "ShiftStarted",
    at,
    actorId: worker.id,
    payload: { shiftId, workerId: worker.id, role },
  } as any;
  return { ok: true, result: event };
}

export function endShift(shift: Shift, actorId: UUID, at: ISODateTime = now()): ContractResult<AppStaffEvent> {
  if (shift.endAt) {
    return { ok: false, violations: [{ code: "ALREADY_ENDED", message: "Shift already ended" }] };
  }
  const event: AppStaffEvent = {
    id: crypto.randomUUID(),
    type: "ShiftEnded",
    at,
    actorId,
    payload: { shiftId: shift.id, workerId: shift.workerId },
  } as any;
  return { ok: true, result: event };
}

export function assignTask(
  workerId: UUID,
  taskSpec: TaskSpec,
  currentShift?: Shift,
  at: ISODateTime = now(),
): ContractResult<AppStaffEvent> {
  const task: Task = {
    id: crypto.randomUUID(),
    assignedTo: workerId,
    shiftId: currentShift?.id,
    status: "ASSIGNED",
    ...taskSpec,
  };
  const violations = checkTaskContext(task, currentShift);
  if (violations.length) return { ok: false, violations };
  const event: AppStaffEvent = {
    id: crypto.randomUUID(),
    type: "TaskAssigned",
    at,
    actorId: workerId,
    payload: { task },
  } as any;
  return { ok: true, result: event };
}

export function completeTask(
  taskId: UUID,
  actorId: UUID,
  outcome?: Record<string, unknown>,
  at: ISODateTime = now(),
): ContractResult<AppStaffEvent> {
  const event: AppStaffEvent = {
    id: crypto.randomUUID(),
    type: "TaskCompleted",
    at,
    actorId,
    payload: { taskId, outcome },
  } as any;
  return { ok: true, result: event };
}

export function recordCompliance(
  itemId: UUID,
  data: Record<string, unknown>,
  actorId: UUID,
  at: ISODateTime = now(),
): ContractResult<AppStaffEvent> {
  const event: AppStaffEvent = {
    id: crypto.randomUUID(),
    type: "ComplianceRecorded",
    at,
    actorId,
    payload: { itemId, data },
  } as any;
  return { ok: true, result: event };
}

export function verifyCompliance(
  itemId: UUID,
  verifierId: UUID,
  at: ISODateTime = now(),
): ContractResult<AppStaffEvent> {
  const event: AppStaffEvent = {
    id: crypto.randomUUID(),
    type: "ComplianceVerified",
    at,
    actorId: verifierId,
    payload: { itemId, verifierId },
  } as any;
  return { ok: true, result: event };
}

export function enrollTraining(
  unitId: UUID,
  workerId: UUID,
  at: ISODateTime = now(),
): ContractResult<AppStaffEvent> {
  const event: AppStaffEvent = {
    id: crypto.randomUUID(),
    type: "TrainingEnrolled",
    at,
    actorId: workerId,
    payload: { unit: { id: unitId, title: "", requiredForRoles: [] }, workerId },
  } as any;
  return { ok: true, result: event };
}

export function completeTraining(
  unitId: UUID,
  workerId: UUID,
  at: ISODateTime = now(),
): ContractResult<AppStaffEvent> {
  const event: AppStaffEvent = {
    id: crypto.randomUUID(),
    type: "TrainingCompleted",
    at,
    actorId: workerId,
    payload: { unitId, workerId },
  } as any;
  return { ok: true, result: event };
}
