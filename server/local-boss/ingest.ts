/**
 * Local Boss - Review Ingestion Handler
 * 
 * Receives reviews (demo or real) and stores them with sanitization.
 */

import { Pool } from 'pg';
import { sanitizeReviewText, SanitizeOptions } from './sanitize-review';
import { analyzeSentimentByTopic, analyzePriceSentiment } from './analyze-sentiment';

export interface IngestReview {
    source: 'google' | 'yelp' | 'tripadvisor' | 'facebook';
    review_id: string;
    rating: number;
    author?: string;
    text: string;
    published_at: string; // ISO timestamp
    language?: string;
}

export interface IngestRequest {
    restaurant_id: string;
    reviews: IngestReview[];
}

/**
 * Get staff names for a restaurant
 */
async function getStaffNames(pool: Pool, restaurantId: string): Promise<string[]> {
    const result = await pool.query(
        `SELECT DISTINCT full_name, email
         FROM restaurant_members
         WHERE restaurant_id = $1
         AND full_name IS NOT NULL
         AND full_name != ''`,
        [restaurantId]
    );
    
    const names: string[] = [];
    for (const row of result.rows) {
        if (row.full_name) {
            // Extract first name and full name
            const parts = row.full_name.trim().split(/\s+/);
            if (parts.length > 0) {
                names.push(parts[0]); // First name
            }
            names.push(row.full_name.trim()); // Full name
        }
    }
    
    return [...new Set(names)]; // Remove duplicates
}

/**
 * Ingest reviews into database
 */
export async function ingestReviews(
    pool: Pool,
    request: IngestRequest
): Promise<{ ingested: number; errors: number }> {
    const { restaurant_id, reviews } = request;
    
    // Get staff names for sanitization
    const staffNames = await getStaffNames(pool, restaurant_id);
    
    let ingested = 0;
    let errors = 0;

    for (const review of reviews) {
        try {
            // Sanitize text
            const sanitizeResult = sanitizeReviewText(review.text, {
                staffNames,
                languages: [review.language || 'pt']
            });

            // Analyze sentiment
            const sentimentMap = analyzeSentimentByTopic(sanitizeResult.textSafe);
            const priceSentiment = analyzePriceSentiment(sanitizeResult.textSafe);
            
            // Calculate overall sentiment score (average of all topics)
            const sentimentScores = Array.from(sentimentMap.values()).map(v => v.score);
            const avgSentimentScore = sentimentScores.length > 0
                ? Math.round(sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length)
                : 0;

            // Extract topics
            const topics = Array.from(sentimentMap.keys());

            // Log if names were detected
            if (sanitizeResult.detectedNames.length > 0) {
                // Store learning signal
                await pool.query(
                    `INSERT INTO local_boss_learning (restaurant_id, signal_type, payload)
                     VALUES ($1, 'staff_name_detected', $2::jsonb)
                     ON CONFLICT DO NOTHING`,
                    [restaurant_id, JSON.stringify({
                        review_id: review.review_id,
                        detected_names: sanitizeResult.detectedNames,
                        source: review.source
                    })]
                );
            }

            // Determine price sentiment category
            let priceSentimentCategory: 'positive' | 'neutral' | 'negative' | 'not_mentioned' = 'not_mentioned';
            if (priceSentiment.explicit === 'positive') {
                priceSentimentCategory = 'positive';
            } else if (priceSentiment.explicit === 'negative') {
                priceSentimentCategory = 'negative';
            } else if (priceSentiment.explicit === 'neutral' || priceSentiment.implicit) {
                priceSentimentCategory = 'neutral';
            }

            // Insert or update review
            await pool.query(
                `INSERT INTO local_boss_reviews 
                 (restaurant_id, source, review_id, rating, author, text_raw, text_safe, language, published_at, sentiment_score, topics, price_sentiment)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 ON CONFLICT (restaurant_id, source, review_id)
                 DO UPDATE SET
                     rating = EXCLUDED.rating,
                     author = EXCLUDED.author,
                     text_raw = EXCLUDED.text_raw,
                     text_safe = EXCLUDED.text_safe,
                     language = EXCLUDED.language,
                     published_at = EXCLUDED.published_at,
                     sentiment_score = EXCLUDED.sentiment_score,
                     topics = EXCLUDED.topics,
                     price_sentiment = EXCLUDED.price_sentiment,
                     updated_at = NOW()`,
                [
                    restaurant_id,
                    review.source,
                    review.review_id,
                    review.rating,
                    review.author || null,
                    review.text, // text_raw
                    sanitizeResult.textSafe, // text_safe
                    review.language || 'pt',
                    review.published_at,
                    avgSentimentScore,
                    JSON.stringify(topics),
                    priceSentimentCategory
                ]
            );

            ingested++;
        } catch (error: any) {
            console.error(`Error ingesting review ${review.review_id}:`, error);
            errors++;
        }
    }

    return { ingested, errors };
}

