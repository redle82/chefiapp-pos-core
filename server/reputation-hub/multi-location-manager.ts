/**
 * multi-location-manager.ts — Multi-Location Management
 * 
 * Manages multiple locations for a restaurant group, inspired by Local Boss.
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface Location {
  id: string;
  restaurant_id: string;
  location_name: string;
  google_place_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  current_rating?: number;
  total_reviews: number;
  enabled: boolean;
}

/**
 * Add a new location
 */
export async function addLocation(
  restaurantId: string,
  location: {
    location_name: string;
    google_place_id?: string;
    address?: string;
    phone?: string;
    email?: string;
  }
): Promise<Location> {
  const result = await pool.query(
    `INSERT INTO reputation_hub_locations
     (restaurant_id, location_name, google_place_id, address, phone, email)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, restaurant_id, location_name, google_place_id, address, phone, email,
               current_rating, total_reviews, enabled`,
    [
      restaurantId,
      location.location_name,
      location.google_place_id || null,
      location.address || null,
      location.phone || null,
      location.email || null,
    ]
  );

  return result.rows[0];
}

/**
 * Get all locations for a restaurant
 */
export async function getLocations(restaurantId: string): Promise<Location[]> {
  const result = await pool.query(
    `SELECT id, restaurant_id, location_name, google_place_id, address, phone, email,
            current_rating, total_reviews, enabled
     FROM reputation_hub_locations
     WHERE restaurant_id = $1
     ORDER BY location_name`,
    [restaurantId]
  );

  return result.rows;
}

/**
 * Update location rating (from sync)
 */
export async function updateLocationRating(
  locationId: string,
  rating: number,
  totalReviews: number
): Promise<void> {
  await pool.query(
    `UPDATE reputation_hub_locations
     SET current_rating = $1,
         total_reviews = $2,
         last_sync_at = NOW(),
         updated_at = NOW()
     WHERE id = $3`,
    [rating, totalReviews, locationId]
  );

  // Record in rating history
  await pool.query(
    `INSERT INTO reputation_hub_rating_history
     (location_id, rating, total_reviews)
     VALUES ($1, $2, $3)
     ON CONFLICT (location_id, recorded_at::date) DO NOTHING`,
    [locationId, rating, totalReviews]
  );
}

/**
 * Get rating evolution for a location
 */
export async function getRatingEvolution(
  locationId: string,
  days: number = 30
): Promise<Array<{ date: string; rating: number; total_reviews: number }>> {
  const result = await pool.query(
    `SELECT recorded_at::date as date, rating, total_reviews
     FROM reputation_hub_rating_history
     WHERE location_id = $1
       AND recorded_at >= NOW() - INTERVAL '${days} days'
     ORDER BY recorded_at ASC`,
    [locationId]
  );

  return result.rows.map(row => ({
    date: row.date,
    rating: parseFloat(row.rating),
    total_reviews: parseInt(row.total_reviews),
  }));
}

/**
 * Calculate reviews needed to reach target rating
 */
export async function calculateReviewsNeeded(
  locationId: string,
  targetRating: number
): Promise<number> {
  const location = await pool.query(
    `SELECT current_rating, total_reviews
     FROM reputation_hub_locations
     WHERE id = $1`,
    [locationId]
  );

  if (location.rows.length === 0) {
    return 0;
  }

  const currentRating = parseFloat(location.rows[0].current_rating || '0');
  const currentReviews = parseInt(location.rows[0].total_reviews || '0');

  if (currentRating >= targetRating) {
    return 0;
  }

  // Formula: (current_rating * current_reviews + 5 * new_reviews) / (current_reviews + new_reviews) >= target_rating
  // Solving for new_reviews:
  // new_reviews >= (current_reviews * (target_rating - current_rating)) / (5 - target_rating)
  
  const reviewsNeeded = Math.ceil(
    (currentReviews * (targetRating - currentRating)) / (5 - targetRating)
  );

  return Math.max(0, reviewsNeeded);
}

