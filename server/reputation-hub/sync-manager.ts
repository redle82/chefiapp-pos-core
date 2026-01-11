/**
 * sync-manager.ts — Sync Manager for Multi-Location Reviews
 * 
 * Syncs reviews from Google for all locations and tracks unanswered reviews.
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Sync reviews for all locations
 */
export async function syncAllLocations(restaurantId: string): Promise<{
  location: string;
  synced: number;
  errors: number;
}[]> {
  const locations = await pool.query(
    `SELECT id, location_name, google_place_id
     FROM reputation_hub_locations
     WHERE restaurant_id = $1
       AND enabled = true
       AND google_place_id IS NOT NULL`,
    [restaurantId]
  );

  const results = [];

  for (const location of locations.rows) {
    try {
      // TODO: Implement real Google Places API sync
      // For now, this is a stub
      const synced = 0; // Would sync reviews from Google
      const errors = 0;

      // Update last_sync_at
      await pool.query(
        `UPDATE reputation_hub_locations
         SET last_sync_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [location.id]
      );

      results.push({
        location: location.location_name,
        synced,
        errors,
      });
    } catch (error: any) {
      console.error(`Error syncing location ${location.location_name}:`, error);
      results.push({
        location: location.location_name,
        synced: 0,
        errors: 1,
      });
    }
  }

  return results;
}

/**
 * Update unanswered reviews tracking
 */
export async function updateUnansweredTracking(restaurantId: string): Promise<void> {
  // Get all reviews without responses
  const reviews = await pool.query(
    `SELECT 
       r.id as review_id,
       'govern' as review_source,
       l.id as location_id
     FROM govern_reviews r
     JOIN reputation_hub_locations l ON l.restaurant_id = r.restaurant_id
     WHERE r.restaurant_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM reputation_hub_responses
         WHERE review_id = r.id::text AND review_source = 'govern'
       )
     UNION ALL
     SELECT 
       r.id as review_id,
       'local_boss' as review_source,
       l.id as location_id
     FROM local_boss_reviews r
     JOIN reputation_hub_locations l ON l.restaurant_id = r.restaurant_id
     WHERE r.restaurant_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM reputation_hub_responses
         WHERE review_id = r.id::text AND review_source = 'local_boss'
       )`,
    [restaurantId]
  );

  for (const review of reviews.rows) {
    // Calculate days unanswered
    const reviewDate = await pool.query(
      `SELECT published_at 
       FROM ${review.review_source === 'govern' ? 'govern_reviews' : 'local_boss_reviews'}
       WHERE id = $1`,
      [review.review_id]
    );

    if (reviewDate.rows.length === 0) continue;

    const publishedAt = new Date(reviewDate.rows[0].published_at);
    const daysUnanswered = Math.floor(
      (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine priority
    let priority: 'low' | 'medium' | 'high' | 'urgent';
    if (daysUnanswered >= 7) {
      priority = 'urgent';
    } else if (daysUnanswered >= 3) {
      priority = 'high';
    } else if (daysUnanswered >= 1) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    // Upsert unanswered tracking
    await pool.query(
      `INSERT INTO reputation_hub_unanswered
       (review_id, review_source, location_id, days_unanswered, priority)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (review_id, review_source)
       DO UPDATE SET
         days_unanswered = EXCLUDED.days_unanswered,
         priority = EXCLUDED.priority,
         updated_at = NOW()`,
      [review.review_id, review.review_source, review.location_id, daysUnanswered, priority]
    );
  }
}

