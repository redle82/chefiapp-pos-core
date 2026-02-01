/**
 * customer-crm.ts — Customer CRM Service
 * 
 * Customer relationship management, inspired by CoverManager CRM.
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface CustomerProfile {
  id: string;
  restaurant_id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  preferred_name?: string;
  total_visits: number;
  total_spent: number;
  last_visit_at?: string;
  preferences: Record<string, any>;
  tags: string[];
}

/**
 * Get customer profile
 */
export async function getCustomerProfile(
  restaurantId: string,
  customerId: string
): Promise<CustomerProfile | null> {
  const result = await pool.query(
    `SELECT id, restaurant_id, email, phone, full_name, preferred_name,
            total_visits, total_spent, last_visit_at, preferences, tags
     FROM customer_profiles
     WHERE restaurant_id = $1 AND id = $2`,
    [restaurantId, customerId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Update customer profile after visit
 */
export async function updateCustomerAfterVisit(
  customerId: string,
  orderTotal: number
): Promise<void> {
  await pool.query(
    `UPDATE customer_profiles
     SET total_visits = total_visits + 1,
         total_spent = total_spent + $1,
         last_visit_at = NOW(),
         updated_at = NOW()
     WHERE id = $2`,
    [orderTotal, customerId]
  );
}

/**
 * Search customers
 */
export async function searchCustomers(
  restaurantId: string,
  query: string
): Promise<CustomerProfile[]> {
  const searchTerm = `%${query}%`;
  const result = await pool.query(
    `SELECT id, restaurant_id, email, phone, full_name, preferred_name,
            total_visits, total_spent, last_visit_at, preferences, tags
     FROM customer_profiles
     WHERE restaurant_id = $1
       AND (
         full_name ILIKE $2
         OR email ILIKE $2
         OR phone ILIKE $2
       )
     ORDER BY last_visit_at DESC NULLS LAST
     LIMIT 20`,
    [restaurantId, searchTerm]
  );

  return result.rows;
}

/**
 * Get customer reservation history
 */
export async function getCustomerReservations(
  customerId: string,
  limit: number = 10
): Promise<any[]> {
  const result = await pool.query(
    `SELECT id, reservation_code, party_size, reservation_date, reservation_time,
            status, table_id, created_at
     FROM reservations
     WHERE customer_id = $1
     ORDER BY reservation_date DESC, reservation_time DESC
     LIMIT $2`,
    [customerId, limit]
  );

  return result.rows;
}

/**
 * Get top customers by spending
 */
export async function getTopCustomers(
  restaurantId: string,
  limit: number = 10
): Promise<CustomerProfile[]> {
  const result = await pool.query(
    `SELECT id, restaurant_id, email, phone, full_name, preferred_name,
            total_visits, total_spent, last_visit_at, preferences, tags
     FROM customer_profiles
     WHERE restaurant_id = $1
     ORDER BY total_spent DESC
     LIMIT $2`,
    [restaurantId, limit]
  );

  return result.rows;
}

