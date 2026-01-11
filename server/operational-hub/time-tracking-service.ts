/**
 * time-tracking-service.ts — Employee Time Tracking (Fichaje)
 * 
 * Employee shift management and time tracking, inspired by Last.app Fichaje.
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface TimeTracking {
  id: string;
  restaurant_id: string;
  user_id: string;
  shift_date: string;
  clock_in?: string;
  clock_out?: string;
  break_start?: string;
  break_end?: string;
  total_hours?: number;
  status: string;
}

/**
 * Clock in (start shift)
 */
export async function clockIn(
  restaurantId: string,
  userId: string,
  shiftDate: string = new Date().toISOString().split('T')[0]
): Promise<TimeTracking> {
  // Check if already clocked in
  const existing = await pool.query(
    `SELECT id FROM operational_hub_time_tracking
     WHERE restaurant_id = $1
       AND user_id = $2
       AND shift_date = $3
       AND status = 'in_progress'`,
    [restaurantId, userId, shiftDate]
  );

  if (existing.rows.length > 0) {
    throw new Error('Already clocked in for this shift');
  }

  const result = await pool.query(
    `INSERT INTO operational_hub_time_tracking
     (restaurant_id, user_id, shift_date, clock_in, status)
     VALUES ($1, $2, $3, NOW(), 'in_progress')
     RETURNING id, restaurant_id, user_id, shift_date, clock_in, clock_out, break_start, break_end, total_hours, status`,
    [restaurantId, userId, shiftDate]
  );

  return result.rows[0];
}

/**
 * Clock out (end shift)
 */
export async function clockOut(
  restaurantId: string,
  userId: string,
  shiftDate: string = new Date().toISOString().split('T')[0]
): Promise<TimeTracking> {
  // Get current shift
  const shift = await pool.query(
    `SELECT id, clock_in, break_start, break_end
     FROM operational_hub_time_tracking
     WHERE restaurant_id = $1
       AND user_id = $2
       AND shift_date = $3
       AND status = 'in_progress'
     ORDER BY clock_in DESC
     LIMIT 1`,
    [restaurantId, userId, shiftDate]
  );

  if (shift.rows.length === 0) {
    throw new Error('No active shift found');
  }

  const shiftData = shift.rows[0];
  const clockIn = new Date(shiftData.clock_in);
  const clockOut = new Date();
  
  // Calculate total hours (subtract break time)
  let totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
  
  if (shiftData.break_start && shiftData.break_end) {
    const breakStart = new Date(shiftData.break_start);
    const breakEnd = new Date(shiftData.break_end);
    const breakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
    totalHours -= breakHours;
  }

  const result = await pool.query(
    `UPDATE operational_hub_time_tracking
     SET clock_out = NOW(),
         total_hours = $1,
         status = 'completed',
         updated_at = NOW()
     WHERE id = $2
     RETURNING id, restaurant_id, user_id, shift_date, clock_in, clock_out, break_start, break_end, total_hours, status`,
    [totalHours, shiftData.id]
  );

  return result.rows[0];
}

/**
 * Start break
 */
export async function startBreak(
  restaurantId: string,
  userId: string,
  shiftDate: string = new Date().toISOString().split('T')[0]
): Promise<void> {
  await pool.query(
    `UPDATE operational_hub_time_tracking
     SET break_start = NOW(),
         updated_at = NOW()
     WHERE restaurant_id = $1
       AND user_id = $2
       AND shift_date = $3
       AND status = 'in_progress'
       AND break_start IS NULL`,
    [restaurantId, userId, shiftDate]
  );
}

/**
 * End break
 */
export async function endBreak(
  restaurantId: string,
  userId: string,
  shiftDate: string = new Date().toISOString().split('T')[0]
): Promise<void> {
  await pool.query(
    `UPDATE operational_hub_time_tracking
     SET break_end = NOW(),
         updated_at = NOW()
     WHERE restaurant_id = $1
       AND user_id = $2
       AND shift_date = $3
       AND status = 'in_progress'
       AND break_start IS NOT NULL
       AND break_end IS NULL`,
    [restaurantId, userId, shiftDate]
  );
}

/**
 * Get shifts for user
 */
export async function getUserShifts(
  restaurantId: string,
  userId: string,
  startDate: string,
  endDate: string
): Promise<TimeTracking[]> {
  const result = await pool.query(
    `SELECT id, restaurant_id, user_id, shift_date, clock_in, clock_out, break_start, break_end, total_hours, status
     FROM operational_hub_time_tracking
     WHERE restaurant_id = $1
       AND user_id = $2
       AND shift_date >= $3
       AND shift_date <= $4
     ORDER BY shift_date DESC, clock_in DESC`,
    [restaurantId, userId, startDate, endDate]
  );

  return result.rows;
}

/**
 * Get all shifts for restaurant
 */
export async function getAllShifts(
  restaurantId: string,
  startDate: string,
  endDate: string
): Promise<TimeTracking[]> {
  const result = await pool.query(
    `SELECT id, restaurant_id, user_id, shift_date, clock_in, clock_out, break_start, break_end, total_hours, status
     FROM operational_hub_time_tracking
     WHERE restaurant_id = $1
       AND shift_date >= $2
       AND shift_date <= $3
     ORDER BY shift_date DESC, clock_in DESC`,
    [restaurantId, startDate, endDate]
  );

  return result.rows;
}

