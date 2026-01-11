// AppStaff Core — Types

export type UUID = string;
export type ISODateTime = string; // e.g., 2025-12-24T12:00:00Z

export type RoleName =
  | "WAITER"
  | "COOK"
  | "MANAGER"
  | "OWNER"
  | string;

export interface Role {
  id: UUID;
  name: RoleName;
  permissions: string[]; // e.g., ["ASSIGN_TASK", "VALIDATE_HACCP"]
}

export interface Worker {
  id: UUID;
  name: string;
  activeRoles: RoleName[];
}

export interface ShiftContext {
  locationId?: UUID;
  station?: string; // e.g., "KITCHEN", "FLOOR"
}

export interface Shift {
  id: UUID;
  workerId: UUID;
  role: RoleName;
  startAt: ISODateTime;
  endAt?: ISODateTime;
  context?: ShiftContext;
}

export type TaskStatus = "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";

export interface TaskSpec {
  type: string; // e.g., "SERVE_TABLE", "CLEAN_STATION", "HACCP_CHECK"
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  payload?: Record<string, unknown>;
}

export interface Task extends TaskSpec {
  id: UUID;
  assignedTo: UUID; // workerId
  shiftId?: UUID;
  status: TaskStatus;
}

export type ComplianceType = "HACCP" | "TEMPERATURE" | "CLEANING" | "CERTIFICATION" | string;

export interface ComplianceItem {
  id: UUID;
  type: ComplianceType;
  required: boolean;
  validityUntil?: ISODateTime;
}

export interface TrainingUnit {
  id: UUID;
  title: string;
  requiredForRoles?: RoleName[];
}

export type WorkerStatus = "EM_TURNO" | "FORA_DE_TURNO" | "EM_RISCO" | "EM_FORMACAO";

export interface Violation {
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface ContractResult<T> {
  ok: boolean;
  result?: T;
  violations?: Violation[];
}
