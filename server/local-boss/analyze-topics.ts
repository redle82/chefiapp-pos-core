/**
 * analyze-topics.ts — Análise de Tópicos e Agregação Diária
 * Princípio: Agregar sentimentos por tema e gerar insights acionáveis.
 */

import { Pool } from 'pg';
import {
  Topic,
  TopicAnalysis,
  analyzeSentimentByTopic,
  analyzePriceSentiment,
  extractTopPhrases,
  generateWhySummary,
  generateActionRecommendations,
} from './analyze-sentiment';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Analisa reviews e gera insights por tema para um restaurante
 */
export async function analyzeTopicsForRestaurant(
  restaurantId: string,
  dateRange: { start: Date; end: Date } = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
    end: new Date(),
  }
): Promise<TopicAnalysis[]> {
  // Buscar reviews do período
  const { rows: reviews } = await pool.query(
    `SELECT id, text_safe, rating, published_at
     FROM local_boss_reviews
     WHERE restaurant_id = $1
       AND published_at >= $2
       AND published_at <= $3
     ORDER BY published_at DESC`,
    [restaurantId, dateRange.start, dateRange.end]
  );

  // Agregar por tema
  const topicData = new Map<Topic, {
    scores: number[];
    mentions: number;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
    phrases: string[];
  }>();

  // Inicializar map
  const topics: Topic[] = ['service', 'cleanliness', 'price', 'product', 'ambiance', 'wait_time'];
  topics.forEach(topic => {
    topicData.set(topic, {
      scores: [],
      mentions: 0,
      positiveCount: 0,
      neutralCount: 0,
      negativeCount: 0,
      phrases: [],
    });
  });

  // Processar cada review
  for (const review of reviews) {
    const sentimentMap = analyzeSentimentByTopic(review.text_safe);
    const priceSentiment = analyzePriceSentiment(review.text_safe);

    // Processar cada tema detectado
    for (const [topic, { score, mentions }] of sentimentMap.entries()) {
      const data = topicData.get(topic as Topic);
      if (data) {
        data.scores.push(score);
        data.mentions += mentions;
        
        if (score > 0) data.positiveCount++;
        else if (score === 0) data.neutralCount++;
        else data.negativeCount++;

        // Extrair frases top
        const phrases = extractTopPhrases(review.text_safe, topic as Topic, 2);
        data.phrases.push(...phrases);
      }
    }

    // Processar sentimento de preço separadamente
    if (priceSentiment.explicit !== 'not_mentioned' || priceSentiment.implicit) {
      const priceData = topicData.get('price');
      if (priceData) {
        const priceScore = priceSentiment.explicit === 'positive' ? 50 :
                          priceSentiment.explicit === 'negative' ? -50 :
                          priceSentiment.implicit ? -30 : 0;
        priceData.scores.push(priceScore);
        priceData.mentions++;
        
        if (priceScore > 0) priceData.positiveCount++;
        else if (priceScore === 0) priceData.neutralCount++;
        else priceData.negativeCount++;
      }
    }
  }

  // Gerar análises finais
  const analyses: TopicAnalysis[] = [];

  for (const topic of topics) {
    const data = topicData.get(topic);
    if (!data || data.mentions === 0) continue;

    // Calcular score médio
    const avgScore = data.scores.length > 0
      ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
      : 0;

    // Top frases (únicas, limitadas)
    const uniquePhrases = Array.from(new Set(data.phrases)).slice(0, 5);

    // Gerar resumo "Por quê"
    const whySummary = generateWhySummary(topic, avgScore, data.mentions);

    analyses.push({
      topic,
      sentimentScore: avgScore,
      volume: data.mentions,
      positiveCount: data.positiveCount,
      neutralCount: data.neutralCount,
      negativeCount: data.negativeCount,
      topPhrases: uniquePhrases,
      whySummary,
    });
  }

  // Salvar no banco (insights diários)
  const today = new Date().toISOString().split('T')[0];
  
  for (const analysis of analyses) {
    await pool.query(
      `INSERT INTO local_boss_topic_insights
       (restaurant_id, topic, date, sentiment_score, volume, positive_count, neutral_count, negative_count, top_phrases, why_summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (restaurant_id, topic, date)
       DO UPDATE SET
         sentiment_score = EXCLUDED.sentiment_score,
         volume = EXCLUDED.volume,
         positive_count = EXCLUDED.positive_count,
         neutral_count = EXCLUDED.neutral_count,
         negative_count = EXCLUDED.negative_count,
         top_phrases = EXCLUDED.top_phrases,
         why_summary = EXCLUDED.why_summary,
         updated_at = NOW()`,
      [
        restaurantId,
        analysis.topic,
        today,
        analysis.sentimentScore,
        analysis.volume,
        analysis.positiveCount,
        analysis.neutralCount,
        analysis.negativeCount,
        JSON.stringify(analysis.topPhrases),
        analysis.whySummary,
      ]
    );
  }

  // Gerar recomendações acionáveis
  for (const analysis of analyses) {
    if (analysis.sentimentScore < 0 && analysis.volume >= 2) {
      const recommendations = generateActionRecommendations(
        analysis.topic,
        analysis.sentimentScore,
        analysis.volume
      );

      for (const rec of recommendations) {
        // Verificar se já existe recomendação similar
        const { rows: existing } = await pool.query(
          `SELECT id FROM local_boss_actions
           WHERE restaurant_id = $1
             AND topic = $2
             AND action_text = $3
             AND status = 'pending'`,
          [restaurantId, analysis.topic, rec.action]
        );

        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO local_boss_actions
             (restaurant_id, topic, priority, action_text, reason_text, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')`,
            [restaurantId, analysis.topic, rec.priority, rec.action, rec.reason]
          );
        }
      }
    }
  }

  return analyses;
}

