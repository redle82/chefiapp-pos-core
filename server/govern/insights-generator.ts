/**
 * insights-generator.ts — Generate Aggregated Insights
 * 
 * Generates insights from processed reviews:
 * - Overall rating trends
 * - Topic sentiment analysis
 * - Churn reasons
 * - Alerts
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface ChurnReason {
  topic: string;
  count: number;
  sentiment: number; // Average sentiment
  examples: string[];
}

export interface Alert {
  type: 'rating_drop' | 'negative_spike' | 'topic_trend' | 'low_rating';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  data?: Record<string, any>;
}

/**
 * Generate insights for a restaurant in a time window
 */
export async function generateInsights(
  restaurantId: string,
  windowStart: Date,
  windowEnd: Date,
  windowType: 'daily' | 'weekly' | 'monthly' = 'weekly'
): Promise<void> {
  // Get reviews in window
  const reviewsResult = await pool.query(
    `SELECT id, rating, text_safe
     FROM govern_reviews
     WHERE restaurant_id = $1
       AND published_at >= $2
       AND published_at < $3
       AND processed_at IS NOT NULL
     ORDER BY published_at DESC`,
    [restaurantId, windowStart, windowEnd]
  );

  const reviews = reviewsResult.rows;

  if (reviews.length === 0) {
    // Create empty insight
    await pool.query(
      `INSERT INTO govern_review_insights
       (restaurant_id, window_start, window_end, window_type, total_reviews)
       VALUES ($1, $2, $3, $4, 0)
       ON CONFLICT (restaurant_id, window_start, window_end, window_type)
       DO UPDATE SET updated_at = NOW()`,
      [restaurantId, windowStart, windowEnd, windowType]
    );
    return;
  }

  // Calculate overall metrics
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = totalRating / reviews.length;
  const positiveCount = reviews.filter(r => r.rating >= 4).length;
  const neutralCount = reviews.filter(r => r.rating === 3).length;
  const negativeCount = reviews.filter(r => r.rating <= 2).length;

  // Get topic sentiment
  const topicsResult = await pool.query(
    `SELECT topic, AVG(sentiment)::numeric(3,2) as avg_sentiment, COUNT(*) as count
     FROM govern_review_topics
     WHERE review_id = ANY($1::uuid[])
     GROUP BY topic
     ORDER BY count DESC`,
    [reviews.map(r => r.id)]
  );

  const topicSentiment: Record<string, number> = {};
  const churnReasons: ChurnReason[] = [];

  for (const row of topicsResult.rows) {
    const sentiment = parseFloat(row.avg_sentiment);
    topicSentiment[row.topic] = sentiment;

    // Negative topics are churn reasons
    if (sentiment < -0.2 && row.count >= 2) {
      // Get example phrases
      const examplesResult = await pool.query(
        `SELECT DISTINCT text_safe
         FROM govern_reviews
         WHERE id IN (
           SELECT review_id FROM govern_review_topics
           WHERE topic = $1 AND sentiment < -0.2
           LIMIT 3
         )`,
        [row.topic]
      );

      churnReasons.push({
        topic: row.topic,
        count: parseInt(row.count),
        sentiment,
        examples: examplesResult.rows.map(r => r.text_safe.substring(0, 100)),
      });
    }
  }

  // Sort churn reasons by impact (count * negative sentiment)
  churnReasons.sort((a, b) => (b.count * Math.abs(b.sentiment)) - (a.count * Math.abs(a.sentiment)));

  // Generate alerts
  const alerts: Alert[] = [];

  // Rating drop alert
  const previousInsight = await pool.query(
    `SELECT overall_rating
     FROM govern_review_insights
     WHERE restaurant_id = $1
       AND window_end < $2
     ORDER BY window_end DESC
     LIMIT 1`,
    [restaurantId, windowStart]
  );

  if (previousInsight.rows.length > 0) {
    const previousRating = parseFloat(previousInsight.rows[0].overall_rating);
    if (avgRating < previousRating - 0.5) {
      alerts.push({
        type: 'rating_drop',
        severity: avgRating < 3.0 ? 'critical' : 'high',
        message: `Avaliação média caiu de ${previousRating.toFixed(1)} para ${avgRating.toFixed(1)}`,
        data: { previous: previousRating, current: avgRating },
      });
    }
  }

  // Negative spike alert
  const negativeRatio = negativeCount / reviews.length;
  if (negativeRatio > 0.3) {
    alerts.push({
      type: 'negative_spike',
      severity: negativeRatio > 0.5 ? 'critical' : 'high',
      message: `${Math.round(negativeRatio * 100)}% dos reviews são negativos`,
      data: { ratio: negativeRatio, count: negativeCount, total: reviews.length },
    });
  }

  // Low rating alert
  if (avgRating < 3.0) {
    alerts.push({
      type: 'low_rating',
      severity: 'critical',
      message: `Avaliação média está abaixo de 3.0 (${avgRating.toFixed(1)})`,
      data: { rating: avgRating },
    });
  }

  // Topic trend alert (if a topic is consistently negative)
  for (const [topic, sentiment] of Object.entries(topicSentiment)) {
    if (sentiment < -0.5 && topicsResult.rows.find(r => r.topic === topic)?.count >= 5) {
      alerts.push({
        type: 'topic_trend',
        severity: sentiment < -0.7 ? 'high' : 'medium',
        message: `Tema "${topic}" está consistentemente negativo`,
        data: { topic, sentiment },
      });
    }
  }

  // Generate summary
  const summary = generateSummary(avgRating, reviews.length, topicSentiment, churnReasons);

  // Store insight
  await pool.query(
    `INSERT INTO govern_review_insights
     (restaurant_id, window_start, window_end, window_type, overall_rating, total_reviews,
      positive_count, neutral_count, negative_count, summary_md, churn_reasons_json,
      topic_sentiment_json, alerts_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb)
     ON CONFLICT (restaurant_id, window_start, window_end, window_type)
     DO UPDATE SET
       overall_rating = EXCLUDED.overall_rating,
       total_reviews = EXCLUDED.total_reviews,
       positive_count = EXCLUDED.positive_count,
       neutral_count = EXCLUDED.neutral_count,
       negative_count = EXCLUDED.negative_count,
       summary_md = EXCLUDED.summary_md,
       churn_reasons_json = EXCLUDED.churn_reasons_json,
       topic_sentiment_json = EXCLUDED.topic_sentiment_json,
       alerts_json = EXCLUDED.alerts_json,
       updated_at = NOW()`,
    [
      restaurantId,
      windowStart,
      windowEnd,
      windowType,
      avgRating,
      reviews.length,
      positiveCount,
      neutralCount,
      negativeCount,
      summary,
      JSON.stringify(churnReasons),
      JSON.stringify(topicSentiment),
      JSON.stringify(alerts),
    ]
  );
}

/**
 * Generate human-readable summary
 */
function generateSummary(
  avgRating: number,
  totalReviews: number,
  topicSentiment: Record<string, number>,
  churnReasons: ChurnReason[]
): string {
  const lines: string[] = [];

  lines.push(`## Resumo de ${totalReviews} reviews`);
  lines.push(`\nAvaliação média: **${avgRating.toFixed(1)}/5.0**\n`);

  if (churnReasons.length > 0) {
    lines.push('### Principais motivos de insatisfação:');
    for (const reason of churnReasons.slice(0, 3)) {
      const topicLabels: Record<string, string> = {
        price: 'Preço',
        cleanliness: 'Limpeza',
        service: 'Atendimento',
        food: 'Comida',
        ambience: 'Ambiente',
        wait_time: 'Tempo de espera',
        value: 'Custo-benefício',
      };
      const label = topicLabels[reason.topic] || reason.topic;
      lines.push(`- **${label}**: ${reason.count} menções negativas`);
    }
  }

  // Top positive topics
  const positiveTopics = Object.entries(topicSentiment)
    .filter(([_, sentiment]) => sentiment > 0.3)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 2);

  if (positiveTopics.length > 0) {
    lines.push('\n### Pontos fortes:');
    for (const [topic] of positiveTopics) {
      const topicLabels: Record<string, string> = {
        price: 'Preço',
        cleanliness: 'Limpeza',
        service: 'Atendimento',
        food: 'Comida',
        ambience: 'Ambiente',
        wait_time: 'Tempo de espera',
      };
      const label = topicLabels[topic] || topic;
      lines.push(`- **${label}**: Recebendo elogios`);
    }
  }

  return lines.join('\n');
}

