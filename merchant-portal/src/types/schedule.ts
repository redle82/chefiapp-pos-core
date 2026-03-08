/**
 * Schedule Types — re-export from domain (Fase 2).
 * Prefer importing from @domain/shift in new code.
 */

export type {
  Shift,
  Attendance,
  Schedule,
  ShiftCoverage,
  ShiftRole,
  ShiftStatus,
  AttendanceStatus,
} from "../domain/shift";
