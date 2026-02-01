/**
 * response-generator.ts — Review Response Generator
 * 
 * Generates and manages responses to reviews, with AI support and templates.
 * Inspired by Local Boss response features.
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface ResponseTemplate {
  id: string;
  template_name: string;
  tone: 'formal' | 'casual' | 'friendly' | 'professional';
  category: 'positive' | 'negative' | 'neutral' | 'apology' | 'thank_you';
  template_text: string;
  variables: Record<string, string>;
}

export interface ReviewResponse {
  id: string;
  review_id: string;
  review_source: 'govern' | 'local_boss';
  response_text: string;
  tone?: string;
  ai_generated: boolean;
  status: 'draft' | 'sent' | 'failed';
}

/**
 * Get response templates
 */
export async function getTemplates(
  restaurantId: string,
  category?: string
): Promise<ResponseTemplate[]> {
  let query = `
    SELECT id, template_name, tone, category, template_text, variables
    FROM reputation_hub_response_templates
    WHERE restaurant_id = $1
  `;
  const params: any[] = [restaurantId];

  if (category) {
    query += ` AND category = $2`;
    params.push(category);
  }

  query += ` ORDER BY is_default DESC, usage_count DESC`;

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Create response template
 */
export async function createTemplate(
  restaurantId: string,
  template: {
    template_name: string;
    tone: 'formal' | 'casual' | 'friendly' | 'professional';
    category: 'positive' | 'negative' | 'neutral' | 'apology' | 'thank_you';
    template_text: string;
    variables?: Record<string, string>;
    is_default?: boolean;
  }
): Promise<ResponseTemplate> {
  const result = await pool.query(
    `INSERT INTO reputation_hub_response_templates
     (restaurant_id, template_name, tone, category, template_text, variables, is_default)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
     RETURNING id, template_name, tone, category, template_text, variables`,
    [
      restaurantId,
      template.template_name,
      template.tone,
      template.category,
      template.template_text,
      JSON.stringify(template.variables || {}),
      template.is_default || false,
    ]
  );

  return result.rows[0];
}

/**
 * Generate AI response (stub - will use AI service later)
 */
export async function generateAIResponse(
  reviewText: string,
  reviewRating: number,
  tone: 'formal' | 'casual' | 'friendly' | 'professional' = 'friendly'
): Promise<string> {
  // STUB: Return template-based response
  // TODO: Integrate with OpenAI/Claude for real AI generation

  if (reviewRating >= 4) {
    const templates = {
      formal: 'Agradecemos sinceramente sua avaliação positiva. Ficamos honrados em tê-lo conosco.',
      casual: 'Obrigado pelo feedback! Ficamos felizes que tenha gostado!',
      friendly: 'Muito obrigado pela avaliação! Ficamos muito felizes em saber que você teve uma experiência positiva conosco!',
      professional: 'Agradecemos sua avaliação positiva. É um prazer saber que superamos suas expectativas.',
    };
    return templates[tone];
  } else if (reviewRating <= 2) {
    const templates = {
      formal: 'Lamentamos que sua experiência não tenha sido satisfatória. Gostaríamos de conversar pessoalmente para entender melhor e melhorar nossos serviços.',
      casual: 'Sentimos muito que não tenha gostado. Queremos melhorar - entre em contato conosco!',
      friendly: 'Lamentamos muito que sua experiência não tenha sido boa. Adoraríamos conversar com você para entender melhor e melhorar!',
      professional: 'Agradecemos seu feedback. Lamentamos não termos atendido suas expectativas e gostaríamos de discutir como podemos melhorar.',
    };
    return templates[tone];
  } else {
    return 'Agradecemos seu feedback. Estamos sempre trabalhando para melhorar nossos serviços.';
  }
}

/**
 * Create response to review
 */
export async function createResponse(
  reviewId: string,
  reviewSource: 'govern' | 'local_boss',
  locationId: string | null,
  response: {
    response_text: string;
    template_id?: string;
    tone?: string;
    ai_generated?: boolean;
  }
): Promise<ReviewResponse> {
  const result = await pool.query(
    `INSERT INTO reputation_hub_responses
     (review_id, review_source, location_id, template_id, response_text, response_tone, ai_generated, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
     RETURNING id, review_id, review_source, response_text, response_tone, ai_generated, status`,
    [
      reviewId,
      reviewSource,
      locationId,
      response.template_id || null,
      response.response_text,
      response.tone || null,
      response.ai_generated || false,
    ]
  );

  // Update template usage count
  if (response.template_id) {
    await pool.query(
      `UPDATE reputation_hub_response_templates
       SET usage_count = usage_count + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [response.template_id]
    );
  }

  return result.rows[0];
}

/**
 * Mark response as sent
 */
export async function markResponseSent(
  responseId: string,
  externalResponseId?: string
): Promise<void> {
  await pool.query(
    `UPDATE reputation_hub_responses
     SET status = 'sent',
         sent_at = NOW(),
         external_response_id = $2,
         updated_at = NOW()
     WHERE id = $1`,
    [responseId, externalResponseId || null]
  );
}

/**
 * Get unanswered reviews
 */
export async function getUnansweredReviews(
  restaurantId: string,
  limit: number = 20
): Promise<Array<{
  review_id: string;
  review_source: string;
  location_name?: string;
  rating: number;
  text: string;
  days_unanswered: number;
  priority: string;
}>> {
  const result = await pool.query(
    `SELECT 
       u.review_id,
       u.review_source,
       l.location_name,
       CASE 
         WHEN u.review_source = 'govern' THEN (SELECT rating FROM govern_reviews WHERE id::text = u.review_id)
         WHEN u.review_source = 'local_boss' THEN (SELECT rating FROM local_boss_reviews WHERE id::text = u.review_id)
       END as rating,
       CASE 
         WHEN u.review_source = 'govern' THEN (SELECT text_safe FROM govern_reviews WHERE id::text = u.review_id)
         WHEN u.review_source = 'local_boss' THEN (SELECT text_safe FROM local_boss_reviews WHERE id::text = u.review_id)
       END as text,
       u.days_unanswered,
       u.priority
     FROM reputation_hub_unanswered u
     LEFT JOIN reputation_hub_locations l ON l.id = u.location_id
     WHERE l.restaurant_id = $1
     ORDER BY 
       CASE u.priority 
         WHEN 'urgent' THEN 1 
         WHEN 'high' THEN 2 
         WHEN 'medium' THEN 3 
         ELSE 4 
       END,
       u.days_unanswered DESC
     LIMIT $2`,
    [restaurantId, limit]
  );

  return result.rows;
}

