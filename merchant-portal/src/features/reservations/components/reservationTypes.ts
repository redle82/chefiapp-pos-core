/**
 * Shared types for reservation feature components.
 */

export type ReservationStatus =
  | "CONFIRMED"
  | "CANCELLED"
  | "NO_SHOW"
  | "COMPLETED"
  | "SEATED"
  | "PENDING";

export interface ReservationRow {
  id: string;
  restaurant_id: string;
  table_id?: string | null;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  party_size: number;
  reservation_date: string; // YYYY-MM-DD
  reservation_time: string; // HH:MM
  duration_minutes: number;
  status: ReservationStatus;
  special_requests?: string | null;
  notes?: string | null;
  source?: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at?: string | null;
  seated_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
}

export interface ReservationFormData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  duration_minutes: number;
  special_requests: string;
  table_preference: string;
}

export interface WaitlistEntry {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  estimated_wait_minutes: number;
  position: number;
  status: "waiting" | "seated" | "left";
  added_at: string;
  seated_at?: string | null;
}
