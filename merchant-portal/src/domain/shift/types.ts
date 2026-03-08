/**
 * Shift Domain Types
 *
 * Tipos para o domínio de turnos (schedule / attendance).
 * Sem dependências de React ou infraestrutura.
 */

/** Papel no turno */
export type ShiftRole =
  | "WAITER"
  | "KITCHEN"
  | "BAR"
  | "MANAGER"
  | "CLEANING";

/** Status do turno */
export type ShiftStatus = "SCHEDULED" | "CONFIRMED" | "CANCELLED";

/** Status de presença */
export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "EARLY_LEAVE";

export interface Shift {
  id: string;
  restaurant_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  role: ShiftRole;
  station_id?: string;
  status: ShiftStatus;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  shift_id: string;
  user_id: string;
  restaurant_id: string;
  check_in_at?: string;
  check_out_at?: string;
  status: AttendanceStatus;
  notes?: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  restaurant_id: string;
  week_start_date: string;
  week_end_date: string;
  shifts: Shift[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  created_at: string;
  updated_at: string;
}

export interface ShiftCoverage {
  shift_id: string;
  required_staff: number;
  scheduled_staff: number;
  present_staff: number;
  coverage_status: "UNDERSTAFFED" | "ADEQUATE" | "OVERSTAFFED";
}
