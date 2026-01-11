/**
 * waitlist-service.ts — Waitlist Service (OnTheGo)
 * 
 * Virtual queue for walk-in customers, inspired by CoverManager OnTheGo.
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface AddToWaitlistInput {
  restaurant_id: string;
  customer_id?: string;
  party_size: number;
  customer_name?: string;
  customer_phone: string;
  customer_email?: string;
}

export interface WaitlistEntry {
  id: string;
  restaurant_id: string;
  customer_id?: string;
  party_size: number;
  customer_name?: string;
  customer_phone: string;
  position: number;
  status: 'waiting' | 'notified' | 'seated' | 'cancelled' | 'expired';
  estimated_wait_time?: number;
  created_at: string;
}

/**
 * Add customer to waitlist
 */
export async function addToWaitlist(input: AddToWaitlistInput): Promise<WaitlistEntry> {
  // Get current max position
  const maxPositionResult = await pool.query(
    `SELECT COALESCE(MAX(position), 0) as max_position
     FROM waitlist_entries
     WHERE restaurant_id = $1
       AND status = 'waiting'`,
    [input.restaurant_id]
  );

  const nextPosition = (maxPositionResult.rows[0]?.max_position || 0) + 1;

  // Get or create customer profile
  let customerId = input.customer_id;
  if (!customerId && (input.customer_email || input.customer_phone)) {
    const customerResult = await pool.query(
      `INSERT INTO customer_profiles
       (restaurant_id, email, phone, full_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (restaurant_id, COALESCE(email, ''), COALESCE(phone, ''))
       DO UPDATE SET full_name = COALESCE(EXCLUDED.full_name, customer_profiles.full_name)
       RETURNING id`,
      [input.restaurant_id, input.customer_email || null, input.customer_phone, input.customer_name || null]
    );
    customerId = customerResult.rows[0]?.id;
  }

  // Estimate wait time (simple: 15 min per party ahead)
  const estimatedWaitTime = (nextPosition - 1) * 15;

  // Insert waitlist entry
  const result = await pool.query(
    `INSERT INTO waitlist_entries
     (restaurant_id, customer_id, party_size, customer_name, customer_phone, customer_email,
      position, estimated_wait_time, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '4 hours')
     RETURNING id, restaurant_id, customer_id, party_size, customer_name, customer_phone,
               position, status, estimated_wait_time, created_at`,
    [
      input.restaurant_id,
      customerId || null,
      input.party_size,
      input.customer_name || null,
      input.customer_phone,
      input.customer_email || null,
      nextPosition,
      estimatedWaitTime,
    ]
  );

  return result.rows[0];
}

/**
 * Get waitlist for restaurant
 */
export async function getWaitlist(
  restaurantId: string,
  status: 'waiting' | 'notified' | 'all' = 'waiting'
): Promise<WaitlistEntry[]> {
  let query = `
    SELECT id, restaurant_id, customer_id, party_size, customer_name, customer_phone,
           position, status, estimated_wait_time, created_at
    FROM waitlist_entries
    WHERE restaurant_id = $1
  `;

  const params: any[] = [restaurantId];

  if (status !== 'all') {
    query += ` AND status = $2`;
    params.push(status);
  }

  query += ` ORDER BY position ASC`;

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Notify customer (table ready)
 */
export async function notifyCustomer(entryId: string): Promise<void> {
  await pool.query(
    `UPDATE waitlist_entries
     SET status = 'notified',
         notified_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [entryId]
  );

  // TODO: Send SMS/email notification
  // This would integrate with SMS/email service
}

/**
 * Seat customer from waitlist
 */
export async function seatFromWaitlist(entryId: string, tableId: string): Promise<void> {
  await pool.query(
    `UPDATE waitlist_entries
     SET status = 'seated',
         seated_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [entryId]
  );

  // Update table status
  await pool.query(
    `UPDATE gm_tables
     SET status = 'OCCUPIED'
     WHERE id = $1`,
    [tableId]
  );

  // Recalculate positions for remaining entries
  await recalculateWaitlistPositions(entryId);
}

/**
 * Cancel waitlist entry
 */
export async function cancelWaitlistEntry(entryId: string): Promise<void> {
  await pool.query(
    `UPDATE waitlist_entries
     SET status = 'cancelled',
         cancelled_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [entryId]
  );

  // Recalculate positions
  await recalculateWaitlistPositions(entryId);
}

/**
 * Recalculate positions after entry removed
 */
async function recalculateWaitlistPositions(excludedEntryId: string): Promise<void> {
  const entry = await pool.query(
    `SELECT restaurant_id, position FROM waitlist_entries WHERE id = $1`,
    [excludedEntryId]
  );

  if (entry.rows.length === 0) return;

  const { restaurant_id, position } = entry.rows[0];

  // Update positions for entries after the removed one
  await pool.query(
    `UPDATE waitlist_entries
     SET position = position - 1,
         estimated_wait_time = (position - 1) * 15,
         updated_at = NOW()
     WHERE restaurant_id = $1
       AND status = 'waiting'
       AND position > $2`,
    [restaurant_id, position]
  );
}

