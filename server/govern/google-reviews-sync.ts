/**
 * google-reviews-sync.ts — Google Reviews Sync Worker
 * 
 * Syncs reviews from Google Business Profile API.
 * For now: stub implementation with interface ready for real API.
 */

import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface GoogleReview {
  reviewId: string;
  authorName: string;
  rating: number;
  text: string;
  publishedAt: string; // ISO timestamp
  language?: string;
}

export interface GoogleBusinessProfile {
  placeId: string;
  name: string;
  reviews?: GoogleReview[];
}

/**
 * Hash author name for deduplication (without exposing identity)
 */
function hashAuthorName(name: string): string {
  return crypto.createHash('sha256').update(name.toLowerCase().trim()).digest('hex').substring(0, 16);
}

/**
 * Stub: Fetch reviews from Google Business Profile API
 * TODO: Implement real Google Places API integration
 */
async function fetchGoogleReviews(placeId: string, apiKey?: string): Promise<GoogleReview[]> {
  // STUB: Return empty array for now
  // Real implementation would:
  // 1. Call Google Places API (New) - Reviews endpoint
  // 2. Parse response
  // 3. Return reviews array
  
  console.log(`[STUB] Fetching Google reviews for place_id: ${placeId}`);
  
  // Example structure (when implemented):
  // const response = await fetch(
  //   `https://places.googleapis.com/v1/places/${placeId}/reviews?key=${apiKey}`
  // );
  // const data = await response.json();
  // return data.reviews.map(...);
  
  return [];
}

/**
 * Sync reviews from Google for a restaurant
 */
export async function syncGoogleReviews(
  restaurantId: string,
  placeId: string,
  apiKey?: string
): Promise<{ synced: number; errors: number }> {
  try {
    // Fetch reviews from Google
    const reviews = await fetchGoogleReviews(placeId, apiKey);
    
    let synced = 0;
    let errors = 0;

    for (const review of reviews) {
      try {
        const authorHash = hashAuthorName(review.authorName);

        // Check if review already exists
        const existing = await pool.query(
          `SELECT id FROM govern_reviews
           WHERE restaurant_id = $1
             AND source = 'google'
             AND external_review_id = $2`,
          [restaurantId, review.reviewId]
        );

        if (existing.rows.length > 0) {
          // Update existing review
          await pool.query(
            `UPDATE govern_reviews
             SET rating = $1,
                 author_name = $2,
                 author_hash = $3,
                 text_raw = $4,
                 text_safe = $4, -- Will be processed by NLP pipeline
                 language = $5,
                 published_at = $6,
                 updated_at = NOW()
             WHERE restaurant_id = $7
               AND source = 'google'
               AND external_review_id = $8`,
            [
              review.rating,
              review.authorName,
              authorHash,
              review.text,
              review.language || 'pt',
              review.publishedAt,
              restaurantId,
              review.reviewId,
            ]
          );
        } else {
          // Insert new review
          await pool.query(
            `INSERT INTO govern_reviews
             (restaurant_id, source, external_review_id, rating, author_name, author_hash, text_raw, text_safe, language, published_at)
             VALUES ($1, 'google', $2, $3, $4, $5, $6, $6, $7, $8)`,
            [
              restaurantId,
              review.reviewId,
              review.rating,
              review.authorName,
              authorHash,
              review.text,
              review.language || 'pt',
              review.publishedAt,
            ]
          );
        }

        synced++;
      } catch (error: any) {
        console.error(`Error syncing review ${review.reviewId}:`, error);
        errors++;
      }
    }

    // Update last_sync_at
    await pool.query(
      `UPDATE govern_review_sources
       SET last_sync_at = NOW(), updated_at = NOW()
       WHERE restaurant_id = $1
         AND source = 'google'
         AND external_id = $2`,
      [restaurantId, placeId]
    );

    return { synced, errors };
  } catch (error: any) {
    console.error('Error syncing Google reviews:', error);
    throw error;
  }
}

/**
 * Sync all enabled review sources for a restaurant
 */
export async function syncAllReviewSources(restaurantId: string): Promise<{
  source: string;
  synced: number;
  errors: number;
}[]> {
  const sources = await pool.query(
    `SELECT source, external_id, settings
     FROM govern_review_sources
     WHERE restaurant_id = $1
       AND enabled = true`,
    [restaurantId]
  );

  const results = [];

  for (const source of sources.rows) {
    try {
      if (source.source === 'google') {
        const apiKey = source.settings?.api_key;
        const result = await syncGoogleReviews(restaurantId, source.external_id, apiKey);
        results.push({
          source: source.source,
          ...result,
        });
      }
      // TODO: Add other sources (TripAdvisor, TheFork, etc.)
    } catch (error: any) {
      console.error(`Error syncing ${source.source}:`, error);
      results.push({
        source: source.source,
        synced: 0,
        errors: 1,
      });
    }
  }

  return results;
}

/**
 * Register a review source for a restaurant
 */
export async function registerReviewSource(
  restaurantId: string,
  source: 'google' | 'tripadvisor' | 'thefork' | 'instagram' | 'yelp' | 'facebook',
  externalId: string,
  name?: string,
  settings?: Record<string, any>
): Promise<void> {
  await pool.query(
    `INSERT INTO govern_review_sources
     (restaurant_id, source, external_id, name, settings)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     ON CONFLICT (restaurant_id, source, external_id)
     DO UPDATE SET
       name = EXCLUDED.name,
       settings = EXCLUDED.settings,
       updated_at = NOW()`,
    [restaurantId, source, externalId, name || null, JSON.stringify(settings || {})]
  );
}

