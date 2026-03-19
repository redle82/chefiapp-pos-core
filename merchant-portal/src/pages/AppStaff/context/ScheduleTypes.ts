/**
 * ScheduleTypes — Tipos para o sistema de agendamento de turnos.
 *
 * Modelo:
 * - ShiftTemplate: padrão recorrente (ex: "Turno Manhã", 08:00-16:00, seg-sex)
 * - ScheduleEntry: atribuição concreta de um employee a um template num dia
 * - Availability: janelas em que o employee está disponível/indisponível
 */

import type { StaffRole } from "./StaffCoreTypes";

// ── Shift Templates ──────────────────────────────────────────────

export interface ShiftTemplate {
  id: string;
  restaurant_id: string;
  name: string; // "Manhã", "Tarde", "Noite", "Duplo"
  color: string; // hex for calendar UI
  start_time: string; // "08:00" (HH:mm, local time)
  end_time: string; // "16:00"
  break_minutes: number; // pausa inclusa
  roles_needed: RoleSlot[];
  is_active: boolean;
  created_at: string; // ISO
  updated_at: string;
}

export interface RoleSlot {
  role: StaffRole;
  count: number; // quantos deste role precisamos
}

// ── Schedule Entries (atribuições concretas) ─────────────────────

export type ScheduleStatus = "draft" | "published" | "confirmed" | "no_show";

export interface ScheduleEntry {
  id: string;
  restaurant_id: string;
  employee_id: string;
  employee_name: string; // desnormalizado para UI rápida
  employee_role: StaffRole;
  template_id: string | null; // null = turno custom/ad-hoc
  template_name: string | null;
  template_color: string | null;
  date: string; // "2026-03-18" (YYYY-MM-DD)
  start_time: string; // "08:00"
  end_time: string; // "16:00"
  break_minutes: number;
  status: ScheduleStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ── Availability ─────────────────────────────────────────────────

export type AvailabilityType = "available" | "unavailable" | "preferred";

export interface AvailabilityWindow {
  id: string;
  employee_id: string;
  day_of_week: DayOfWeek; // 0=dom ... 6=sáb
  start_time: string; // "08:00"
  end_time: string; // "22:00"
  type: AvailabilityType;
  reason?: string; // "Faculdade", "Pessoal"
  is_recurring: boolean; // true = toda semana, false = one-off
  specific_date?: string; // para one-off: "2026-03-20"
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// ── Calendar View helpers ────────────────────────────────────────

export interface WeekDay {
  date: string; // "2026-03-18"
  dayOfWeek: DayOfWeek;
  label: string; // "Seg 18"
  isToday: boolean;
}

export interface ScheduleConflict {
  type: "double_booking" | "unavailable" | "overtime" | "understaffed";
  message: string;
  severity: "warning" | "error";
  entry_ids: string[];
}

// ── Week schedule (aggregated view) ──────────────────────────────

export interface WeekSchedule {
  weekStart: string; // Monday date
  weekEnd: string; // Sunday date
  days: WeekDay[];
  entries: ScheduleEntry[];
  conflicts: ScheduleConflict[];
  coverage: DayCoverage[];
}

export interface DayCoverage {
  date: string;
  templateSlots: RoleSlot[]; // o que precisamos
  assignedSlots: RoleSlot[]; // o que temos
  isCovered: boolean;
}
