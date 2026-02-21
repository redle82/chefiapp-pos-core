/**
 * Reservation Types - Reservation Engine
 */

export interface Reservation {
  id: string;
  restaurant_id: string;
  table_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  party_size: number;
  reservation_date: string; // YYYY-MM-DD
  reservation_time: string; // HH:MM
  status: 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED';
  special_requests?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  cancelled_at?: string;
  completed_at?: string;
}

export interface ReservationSlot {
  id: string;
  restaurant_id: string;
  slot_date: string; // YYYY-MM-DD
  slot_time: string; // HH:MM
  available_tables: number;
  reserved_tables: number;
  capacity: number; // Total de pessoas que cabem
  blocked_tables: number;
  created_at: string;
  updated_at: string;
}

export interface DemandForecast {
  restaurant_id: string;
  date: string;
  time: string;
  reservations_count: number;
  total_people: number;
  large_parties: number;
  capacity_status: 'FULL' | 'NEAR_FULL' | 'AVAILABLE';
}
