/**
 * nlp-pipeline.ts — NLP Pipeline for Review Processing
 * 
 * Processes reviews through:
 * 1. Topic classification
 * 2. Sentiment analysis per topic
 * 3. NER for staff name detection
 * 4. Text sanitization
 */

import { Pool } from 'pg';
import {
  analyzeSentimentByTopic,
  analyzePriceSentiment,
  extractTopPhrases,
  anonymizeText,
  Topic,
} from '../local-boss/analyze-sentiment';
import { sanitizeReviewText } from '../local-boss/sanitize-review';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Get staff names for a restaurant
 */
async function getStaffNames(restaurantId: string): Promise<string[]> {
  const result = await pool.query(
    `SELECT DISTINCT full_name
     FROM restaurant_members
     WHERE restaurant_id = $1
       AND full_name IS NOT NULL
       AND full_name != ''`,
    [restaurantId]
  );

  const names: string[] = [];
  for (const row of result.rows) {
    if (row.full_name) {
      const parts = row.full_name.trim().split(/\s+/);
      if (parts.length > 0) {
        names.push(parts[0]); // First name
      }
      names.push(row.full_name.trim()); // Full name
    }
  }

  return [...new Set(names)];
}

/**
 * Process a single review through NLP pipeline
 */
export async function processReview(reviewId: string): Promise<void> {
  // Get review
  const reviewResult = await pool.query(
    `SELECT id, restaurant_id, text_raw, language
     FROM govern_reviews
     WHERE id = $1`,
    [reviewId]
  );

  if (reviewResult.rows.length === 0) {
    throw new Error(`Review ${reviewId} not found`);
  }

  const review = reviewResult.rows[0];
  const { restaurant_id, text_raw, language } = review;

  // Get staff names for sanitization
  const staffNames = await getStaffNames(restaurant_id);

  // 1. Sanitize text (remove staff names)
  const sanitizeResult = sanitizeReviewText(text_raw, {
    staffNames,
    languages: [language || 'pt'],
  });

  // 2. Detect entities (staff names) and store
  for (const detectedName of sanitizeResult.detectedNames) {
    await pool.query(
      `INSERT INTO govern_review_entities_redacted
       (review_id, entity_type, original_text, original_hash, masked_label, confidence)
       VALUES ($1, 'staff_name', $2, $3, '[EQUIPE]', 0.8)
       ON CONFLICT (review_id, entity_type, original_hash) DO NOTHING`,
      [
        reviewId,
        detectedName,
        Buffer.from(detectedName.toLowerCase()).toString('base64').substring(0, 16), // Simple hash
      ]
    );
  }

  // 3. Topic classification and sentiment
  const sentimentMap = analyzeSentimentByTopic(sanitizeResult.textSafe);
  const priceSentiment = analyzePriceSentiment(sanitizeResult.textSafe);

  // Store topics
  for (const [topic, { score, mentions }] of sentimentMap.entries()) {
    if (mentions > 0) {
      // Convert score (-100 to +100) to sentiment (-1 to +1)
      const sentiment = score / 100;
      const confidence = Math.min(0.9, 0.5 + (mentions * 0.1)); // Higher mentions = higher confidence

      await pool.query(
        `INSERT INTO govern_review_topics
         (review_id, topic, sentiment, confidence)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (review_id, topic)
         DO UPDATE SET
           sentiment = EXCLUDED.sentiment,
           confidence = EXCLUDED.confidence`,
        [reviewId, topic, sentiment, confidence]
      );
    }
  }

  // Handle price sentiment separately
  if (priceSentiment.explicit !== 'not_mentioned' || priceSentiment.implicit) {
    const priceScore = priceSentiment.explicit === 'positive' ? 0.5 :
                      priceSentiment.explicit === 'negative' ? -0.5 :
                      priceSentiment.implicit ? -0.3 : 0;
    
    await pool.query(
      `INSERT INTO govern_review_topics
       (review_id, topic, sentiment, confidence)
       VALUES ($1, 'price', $2, 0.7)
       ON CONFLICT (review_id, topic)
       DO UPDATE SET
         sentiment = EXCLUDED.sentiment,
         confidence = EXCLUDED.confidence`,
      [reviewId, priceScore]
    );
  }

  // 4. Update review with sanitized text and mark as processed
  await pool.query(
    `UPDATE govern_reviews
     SET text_safe = $1,
         processed_at = NOW(),
         updated_at = NOW()
     WHERE id = $2`,
    [sanitizeResult.textSafe, reviewId]
  );
}

/**
 * Process all unprocessed reviews
 */
export async function processUnprocessedReviews(limit: number = 100): Promise<number> {
  const unprocessed = await pool.query(
    `SELECT id FROM govern_reviews
     WHERE processed_at IS NULL
     ORDER BY ingested_at ASC
     LIMIT $1`,
    [limit]
  );

  let processed = 0;

  for (const row of unprocessed.rows) {
    try {
      await processReview(row.id);
      processed++;
    } catch (error: any) {
      console.error(`Error processing review ${row.id}:`, error);
    }
  }

  return processed;
}

