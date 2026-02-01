/**
 * qr-generator.ts — QR Code Generator for Review Requests
 * 
 * Generates QR codes and links for requesting reviews, inspired by Local Boss.
 */

import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Generate Google Review Link
 * Based on Google Place ID
 */
export function generateGoogleReviewLink(placeId: string): string {
  // Google Review Link format: https://search.google.com/local/writereview?placeid={PLACE_ID}
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

/**
 * Generate QR Code URL (stub - would use QR code service)
 */
export function generateQRCodeURL(reviewLink: string): string {
  // STUB: In production, use a QR code service like qrcode.js or API
  // For now, return a placeholder URL
  const encoded = encodeURIComponent(reviewLink);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;
}

/**
 * Create QR code for review request
 */
export async function createQRCode(
  restaurantId: string,
  locationId: string | null,
  options: {
    campaign_name?: string;
    expires_days?: number;
  } = {}
): Promise<{
  id: string;
  qr_code_url: string;
  review_link: string;
  campaign_name?: string;
}> {
  // Get location's Google Place ID
  let placeId: string | null = null;
  if (locationId) {
    const location = await pool.query(
      `SELECT google_place_id FROM reputation_hub_locations WHERE id = $1`,
      [locationId]
    );
    placeId = location.rows[0]?.google_place_id || null;
  }

  if (!placeId) {
    // Fallback: use restaurant's default place ID or generate generic link
    const restaurant = await pool.query(
      `SELECT id FROM gm_restaurants WHERE id = $1`,
      [restaurantId]
    );
    // For now, generate a generic link (would need place_id in production)
    placeId = `PLACE_${restaurantId.substring(0, 8)}`;
  }

  const reviewLink = generateGoogleReviewLink(placeId);
  const qrCodeURL = generateQRCodeURL(reviewLink);

  const expiresAt = options.expires_days
    ? new Date(Date.now() + options.expires_days * 24 * 60 * 60 * 1000)
    : null;

  const result = await pool.query(
    `INSERT INTO reputation_hub_qr_codes
     (restaurant_id, location_id, qr_code_url, review_link, campaign_name, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, qr_code_url, review_link, campaign_name`,
    [
      restaurantId,
      locationId,
      qrCodeURL,
      reviewLink,
      options.campaign_name || null,
      expiresAt,
    ]
  );

  return result.rows[0];
}

/**
 * Get QR codes for restaurant
 */
export async function getQRCodes(
  restaurantId: string,
  enabledOnly: boolean = true
): Promise<Array<{
  id: string;
  qr_code_url: string;
  review_link: string;
  campaign_name?: string;
  usage_count: number;
  enabled: boolean;
}>> {
  let query = `
    SELECT id, qr_code_url, review_link, campaign_name, usage_count, enabled
    FROM reputation_hub_qr_codes
    WHERE restaurant_id = $1
  `;
  const params: any[] = [restaurantId];

  if (enabledOnly) {
    query += ` AND enabled = true AND (expires_at IS NULL OR expires_at > NOW())`;
  }

  query += ` ORDER BY created_at DESC`;

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Track QR code usage
 */
export async function trackQRUsage(qrCodeId: string): Promise<void> {
  await pool.query(
    `UPDATE reputation_hub_qr_codes
     SET usage_count = usage_count + 1,
         updated_at = NOW()
     WHERE id = $1`,
    [qrCodeId]
  );
}

/**
 * Create review request campaign
 */
export async function createCampaign(
  restaurantId: string,
  campaign: {
    campaign_name: string;
    target_rating: number;
    qr_code_id?: string;
    start_date: string;
    end_date?: string;
  }
): Promise<{
  id: string;
  reviews_needed: number;
}> {
  // Get current rating
  const location = await pool.query(
    `SELECT current_rating, total_reviews
     FROM reputation_hub_locations
     WHERE restaurant_id = $1
     ORDER BY created_at ASC
     LIMIT 1`,
    [restaurantId]
  );

  const currentRating = parseFloat(location.rows[0]?.current_rating || '0');
  const currentReviews = parseInt(location.rows[0]?.total_reviews || '0');

  // Calculate reviews needed
  const reviewsNeeded = Math.ceil(
    (currentReviews * (campaign.target_rating - currentRating)) / (5 - campaign.target_rating)
  );

  const result = await pool.query(
    `INSERT INTO reputation_hub_campaigns
     (restaurant_id, campaign_name, target_rating, current_rating, reviews_needed, qr_code_id, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, reviews_needed`,
    [
      restaurantId,
      campaign.campaign_name,
      campaign.target_rating,
      currentRating,
      reviewsNeeded,
      campaign.qr_code_id || null,
      campaign.start_date,
      campaign.end_date || null,
    ]
  );

  return result.rows[0];
}

