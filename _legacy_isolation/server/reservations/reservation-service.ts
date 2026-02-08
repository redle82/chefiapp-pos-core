/**
 * reservation-service.ts — Reservation Management Service
 * 
 * Core service for managing reservations, inspired by CoverManager.
 */

import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface CreateReservationInput {
  restaurant_id: string;
  customer_id?: string;
  source_type: 'online' | 'phone' | 'walk_in' | 'external_channel' | 'appstaff';
  party_size: number;
  reservation_date: string; // YYYY-MM-DD
  reservation_time: string; // HH:mm
  special_requests?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  table_id?: string;
  pre_payment_amount?: number;
  external_reservation_id?: string;
}

export interface Reservation {
  id: string;
  restaurant_id: string;
  customer_id?: string;
  reservation_code: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  table_id?: string;
  special_requests?: string;
  created_at: string;
}

/**
 * Generate unique reservation code
 */
function generateReservationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Create a new reservation
 */
export async function createReservation(input: CreateReservationInput): Promise<Reservation> {
  const reservationCode = generateReservationCode();
  
  // Get or create customer profile if contact info provided
  let customerId = input.customer_id;
  if (!customerId && (input.customer_email || input.customer_phone)) {
    customerId = await getOrCreateCustomerProfile(
      input.restaurant_id,
      {
        email: input.customer_email,
        phone: input.customer_phone,
        full_name: input.customer_name,
      }
    );
  }

  // Get source_id
  let sourceId: string | null = null;
  if (input.source_type !== 'walk_in') {
    const sourceResult = await pool.query(
      `SELECT id FROM reservation_sources
       WHERE restaurant_id = $1
         AND source_type = $2
         AND enabled = true
       LIMIT 1`,
      [input.restaurant_id, input.source_type]
    );
    sourceId = sourceResult.rows[0]?.id || null;
  }

  // Insert reservation
  const result = await pool.query(
    `INSERT INTO reservations
     (restaurant_id, customer_id, source_id, reservation_code, party_size,
      reservation_date, reservation_time, status, table_id, special_requests,
      pre_payment_amount, external_reservation_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id, restaurant_id, customer_id, reservation_code, party_size,
               reservation_date, reservation_time, status, table_id, special_requests, created_at`,
    [
      input.restaurant_id,
      customerId || null,
      sourceId,
      reservationCode,
      input.party_size,
      input.reservation_date,
      input.reservation_time,
      'pending',
      input.table_id || null,
      input.special_requests || null,
      input.pre_payment_amount || null,
      input.external_reservation_id || null,
    ]
  );

  const reservation = result.rows[0];

  // If table assigned, mark as reserved
  if (input.table_id) {
    await pool.query(
      `UPDATE gm_tables
       SET status = 'RESERVED'
       WHERE id = $1`,
      [input.table_id]
    );
  }

  return {
    id: reservation.id,
    restaurant_id: reservation.restaurant_id,
    customer_id: reservation.customer_id,
    reservation_code: reservation.reservation_code,
    party_size: reservation.party_size,
    reservation_date: reservation.reservation_date,
    reservation_time: reservation.reservation_time,
    status: reservation.status,
    table_id: reservation.table_id,
    special_requests: reservation.special_requests,
    created_at: reservation.created_at,
  };
}

/**
 * Get or create customer profile
 */
async function getOrCreateCustomerProfile(
  restaurantId: string,
  customer: {
    email?: string;
    phone?: string;
    full_name?: string;
  }
): Promise<string> {
  // Try to find existing customer
  if (customer.email) {
    const existing = await pool.query(
      `SELECT id FROM customer_profiles
       WHERE restaurant_id = $1 AND email = $2`,
      [restaurantId, customer.email]
    );
    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }
  }

  if (customer.phone) {
    const existing = await pool.query(
      `SELECT id FROM customer_profiles
       WHERE restaurant_id = $1 AND phone = $2`,
      [restaurantId, customer.phone]
    );
    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }
  }

  // Create new customer profile
  const result = await pool.query(
    `INSERT INTO customer_profiles
     (restaurant_id, email, phone, full_name)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [restaurantId, customer.email || null, customer.phone || null, customer.full_name || null]
  );

  return result.rows[0].id;
}

/**
 * Confirm reservation
 */
export async function confirmReservation(reservationId: string): Promise<void> {
  await pool.query(
    `UPDATE reservations
     SET status = 'confirmed',
         confirmation_sent_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [reservationId]
  );
}

/**
 * Seat reservation (mark as seated)
 */
export async function seatReservation(reservationId: string, tableId: string): Promise<void> {
  await pool.query(
    `UPDATE reservations
     SET status = 'seated',
         table_id = $2,
         seated_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [reservationId, tableId]
  );

  // Update table status
  await pool.query(
    `UPDATE gm_tables
     SET status = 'OCCUPIED'
     WHERE id = $1`,
    [tableId]
  );
}

/**
 * Mark reservation as no-show
 */
export async function markNoShow(reservationId: string): Promise<void> {
  await pool.query(
    `UPDATE reservations
     SET status = 'no_show',
         no_show_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [reservationId]
  );

  // Update customer profile (add no-show tag)
  const reservation = await pool.query(
    `SELECT customer_id FROM reservations WHERE id = $1`,
    [reservationId]
  );

  if (reservation.rows[0]?.customer_id) {
    await pool.query(
      `UPDATE customer_profiles
       SET tags = array_append(COALESCE(tags, '{}'), 'no-show-risk'),
           updated_at = NOW()
       WHERE id = $1
         AND NOT ('no-show-risk' = ANY(COALESCE(tags, '{}')))`,
      [reservation.rows[0].customer_id]
    );
  }
}

/**
 * Cancel reservation
 */
export async function cancelReservation(reservationId: string, reason?: string): Promise<void> {
  const reservation = await pool.query(
    `SELECT table_id FROM reservations WHERE id = $1`,
    [reservationId]
  );

  await pool.query(
    `UPDATE reservations
     SET status = 'cancelled',
         cancelled_at = NOW(),
         cancellation_reason = $2,
         updated_at = NOW()
     WHERE id = $1`,
    [reservationId, reason || null]
  );

  // Free table if assigned
  if (reservation.rows[0]?.table_id) {
    await pool.query(
      `UPDATE gm_tables
       SET status = 'AVAILABLE'
       WHERE id = $1`,
      [reservation.rows[0].table_id]
    );
  }
}

/**
 * Get reservations for a date range
 */
export async function getReservations(
  restaurantId: string,
  startDate: string,
  endDate: string,
  status?: string
): Promise<Reservation[]> {
  let query = `
    SELECT id, restaurant_id, customer_id, reservation_code, party_size,
           reservation_date, reservation_time, status, table_id, special_requests, created_at
    FROM reservations
    WHERE restaurant_id = $1
      AND reservation_date >= $2
      AND reservation_date <= $3
  `;
  const params: any[] = [restaurantId, startDate, endDate];

  if (status) {
    query += ` AND status = $4`;
    params.push(status);
  }

  query += ` ORDER BY reservation_date, reservation_time`;

  const result = await pool.query(query, params);
  return result.rows;
}

