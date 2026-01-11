/**
 * pattern-detector.ts — Pattern Detection
 * 
 * Detecta padrões recorrentes, anomalias, tendências e correlações.
 */

import { Pool } from 'pg';
import { OperationalEvent } from '../operational-event-bus/event-bus';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export type PatternType = 'recurring' | 'anomaly' | 'trend' | 'correlation';

export interface DetectedPattern {
  id: string;
  restaurant_id: string;
  pattern_type: PatternType;
  pattern_key: string;
  pattern_data: Record<string, any>;
  confidence: number;
  occurrence_count: number;
  first_detected_at: string;
  last_seen_at: string;
  is_active: boolean;
}

/**
 * Detect Pattern (Detectar Padrão)
 */
export async function detectPattern(
  restaurantId: string,
  event: OperationalEvent
): Promise<DetectedPattern | null> {
  // Check for recurring patterns
  const recurring = await detectRecurringPattern(restaurantId, event);
  if (recurring) {
    return recurring;
  }

  // Check for anomalies
  const anomaly = await detectAnomaly(restaurantId, event);
  if (anomaly) {
    return anomaly;
  }

  // Check for trends
  const trend = await detectTrend(restaurantId, event);
  if (trend) {
    return trend;
  }

  return null;
}

/**
 * Detect Recurring Pattern (Detectar Padrão Recorrente)
 */
async function detectRecurringPattern(
  restaurantId: string,
  event: OperationalEvent
): Promise<DetectedPattern | null> {
  // Build pattern key from event
  const patternKey = buildPatternKey(event);

  // Check if pattern already exists
  const existing = await pool.query(
    `SELECT * FROM govern_patterns
     WHERE restaurant_id = $1
       AND pattern_key = $2
       AND pattern_type = 'recurring'
       AND is_active = true`,
    [restaurantId, patternKey]
  );

  if (existing.rows.length > 0) {
    // Pattern exists, update occurrence
    const pattern = existing.rows[0];
    const newCount = pattern.occurrence_count + 1;
    const confidence = Math.min(0.99, 0.5 + (newCount * 0.1)); // Confidence increases with occurrences

    await pool.query(
      `UPDATE govern_patterns
       SET occurrence_count = $1,
           confidence = $2,
           last_seen_at = NOW(),
           pattern_data = jsonb_set(pattern_data, '{last_event_id}', $3::jsonb)
       WHERE id = $4`,
      [newCount, confidence, JSON.stringify(event.id), pattern.id]
    );

    return {
      ...pattern,
      occurrence_count: newCount,
      confidence,
      last_seen_at: new Date().toISOString(),
    };
  }

  // Check if this event type occurred recently (within 7 days)
  const recent = await pool.query(
    `SELECT COUNT(*) as count
     FROM operational_events
     WHERE restaurant_id = $1
       AND event_type = $2
       AND created_at >= NOW() - INTERVAL '7 days'
       AND status != 'ignored'`,
    [restaurantId, event.event_type]
  );

  const recentCount = parseInt(recent.rows[0].count);

  if (recentCount >= 3) {
    // Pattern detected: 3+ occurrences in 7 days
    const patternData = {
      event_type: event.event_type,
      source_module: event.source_module,
      context: event.context,
      recent_count: recentCount,
      first_event_id: event.id,
      last_event_id: event.id,
    };

    const result = await pool.query(
      `INSERT INTO govern_patterns
       (restaurant_id, pattern_type, pattern_key, pattern_data, confidence, occurrence_count)
       VALUES ($1, 'recurring', $2, $3::jsonb, $4, $5)
       RETURNING *`,
      [restaurantId, patternKey, JSON.stringify(patternData), 0.6, recentCount]
    );

    return result.rows[0];
  }

  return null;
}

/**
 * Detect Anomaly (Detectar Anomalia)
 */
async function detectAnomaly(
  restaurantId: string,
  event: OperationalEvent
): Promise<DetectedPattern | null> {
  // Anomaly: Event with P0 priority that's unusual
  if (event.priority !== 'P0') {
    return null;
  }

  // Check if this event type is unusual for this restaurant
  const historical = await pool.query(
    `SELECT COUNT(*) as count
     FROM operational_events
     WHERE restaurant_id = $1
       AND event_type = $2
       AND priority = 'P0'
       AND created_at >= NOW() - INTERVAL '30 days'`,
    [restaurantId, event.event_type]
  );

  const historicalCount = parseInt(historical.rows[0].count);

  if (historicalCount === 0) {
    // First P0 of this type = anomaly
    const patternKey = `anomaly_${event.event_type}_${new Date().toISOString().split('T')[0]}`;
    const patternData = {
      event_type: event.event_type,
      priority: event.priority,
      context: event.context,
      event_id: event.id,
      reason: 'First P0 event of this type in 30 days',
    };

    const result = await pool.query(
      `INSERT INTO govern_patterns
       (restaurant_id, pattern_type, pattern_key, pattern_data, confidence, occurrence_count)
       VALUES ($1, 'anomaly', $2, $3::jsonb, 0.8, 1)
       RETURNING *`,
      [restaurantId, patternKey, JSON.stringify(patternData)]
    );

    return result.rows[0];
  }

  return null;
}

/**
 * Detect Trend (Detectar Tendência)
 */
async function detectTrend(
  restaurantId: string,
  event: OperationalEvent
): Promise<DetectedPattern | null> {
  // TODO: Implement trend detection
  // For now, return null
  return null;
}

/**
 * Build Pattern Key (Construir Chave de Padrão)
 */
function buildPatternKey(event: OperationalEvent): string {
  const parts = [
    event.event_type,
    event.source_module,
  ];

  // Add context keys if relevant
  if (event.context.table_number) {
    parts.push(`table_${event.context.table_number}`);
  }
  if (event.context.product_name) {
    parts.push(event.context.product_name.replace(/\s+/g, '_').toLowerCase());
  }

  return parts.join('_');
}

/**
 * Get Active Patterns (Buscar Padrões Ativos)
 */
export async function getActivePatterns(
  restaurantId: string,
  patternType?: PatternType
): Promise<DetectedPattern[]> {
  let query = `SELECT * FROM govern_patterns
                WHERE restaurant_id = $1
                  AND is_active = true`;
  const params: any[] = [restaurantId];

  if (patternType) {
    query += ` AND pattern_type = $2`;
    params.push(patternType);
  }

  query += ` ORDER BY last_seen_at DESC, confidence DESC`;

  const result = await pool.query(query, params);
  return result.rows;
}

