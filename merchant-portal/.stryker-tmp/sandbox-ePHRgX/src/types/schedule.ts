/**
 * Schedule Types - Employee Time Engine
 */
// @ts-nocheck


export interface Shift {
  id: string;
  restaurant_id: string;
  user_id: string;
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
  role: 'WAITER' | 'KITCHEN' | 'BAR' | 'MANAGER' | 'CLEANING';
  station_id?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  shift_id: string;
  user_id: string;
  restaurant_id: string;
  check_in_at?: string; // ISO 8601
  check_out_at?: string; // ISO 8601
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE';
  notes?: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  restaurant_id: string;
  week_start_date: string; // YYYY-MM-DD
  week_end_date: string; // YYYY-MM-DD
  shifts: Shift[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  created_at: string;
  updated_at: string;
}

export interface ShiftCoverage {
  shift_id: string;
  required_staff: number;
  scheduled_staff: number;
  present_staff: number;
  coverage_status: 'UNDERSTAFFED' | 'ADEQUATE' | 'OVERSTAFFED';
}
