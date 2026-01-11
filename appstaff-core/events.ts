// AppStaff Core — Events
import type { UUID, ISODateTime, Task, ComplianceItem, TrainingUnit } from "./types";

export interface BaseEvent {
  id: UUID;
  type:
    | "ShiftStarted"
    | "ShiftEnded"
    | "TaskAssigned"
    | "TaskCompleted"
    | "TaskRejected"
    | "ComplianceRecorded"
    | "ComplianceVerified"
    | "ComplianceViolation"
    | "TrainingEnrolled"
    | "TrainingCompleted";
  at: ISODateTime;
  actorId: UUID; // who caused the event
}

export interface ShiftStarted extends BaseEvent {
  type: "ShiftStarted";
  payload: { shiftId: UUID; workerId: UUID; role: string };
}

export interface ShiftEnded extends BaseEvent {
  type: "ShiftEnded";
  payload: { shiftId: UUID; workerId: UUID };
}

export interface TaskAssigned extends BaseEvent {
  type: "TaskAssigned";
  payload: { task: Task };
}

export interface TaskCompleted extends BaseEvent {
  type: "TaskCompleted";
  payload: { taskId: UUID; outcome?: Record<string, unknown> };
}

export interface TaskRejected extends BaseEvent {
  type: "TaskRejected";
  payload: { taskId: UUID; reason: string };
}

export interface ComplianceRecorded extends BaseEvent {
  type: "ComplianceRecorded";
  payload: { itemId: UUID; data: Record<string, unknown> };
}

export interface ComplianceVerified extends BaseEvent {
  type: "ComplianceVerified";
  payload: { itemId: UUID; verifierId: UUID };
}

export interface ComplianceViolation extends BaseEvent {
  type: "ComplianceViolation";
  payload: { itemId: UUID; code: string; message: string };
}

export interface TrainingEnrolled extends BaseEvent {
  type: "TrainingEnrolled";
  payload: { unit: TrainingUnit; workerId: UUID };
}

export interface TrainingCompleted extends BaseEvent {
  type: "TrainingCompleted";
  payload: { unitId: UUID; workerId: UUID };
}

export type AppStaffEvent =
  | ShiftStarted
  | ShiftEnded
  | TaskAssigned
  | TaskCompleted
  | TaskRejected
  | ComplianceRecorded
  | ComplianceVerified
  | ComplianceViolation
  | TrainingEnrolled
  | TrainingCompleted;
