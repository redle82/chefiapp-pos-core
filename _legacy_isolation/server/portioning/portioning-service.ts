/**
 * portioning-service.ts — Porcionamento & Custo Real Service
 * 
 * Serviço para gerenciar porcionamento matemático e calcular custo real
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface BaseProduct {
  id: string;
  restaurant_id: string;
  name: string;
  cost_total_cents: number;
  weight_total_g: number;
  loss_percent: number;
  portion_weight_g: number;
  thickness_mm: number;
  currency: string; // EUR, USD, BRL, etc.
  // Calculated fields
  cost_per_gram_cents: number;
  cost_per_portion_cents: number;
  theoretical_portions: number;
  real_portions: number;
  created_at: string;
  updated_at: string;
}

export interface PortioningSession {
  id: string;
  restaurant_id: string;
  base_product_id: string;
  session_date: string;
  target_portions: number;
  actual_portions: number;
  total_variation_g: number;
  avg_variation_g: number;
  status: 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  completed_at?: string;
}

export interface PortionMeasurement {
  id: string;
  session_id: string;
  measured_weight_g: number;
  measured_thickness_mm: number;
  variation_g: number;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface PortioningAlert {
  id: string;
  session_id: string;
  alert_type: 'drift_detected' | 'high_variation' | 'cost_impact';
  message: string;
  severity: 'warning' | 'critical';
  base_product_id: string;
  avg_variation_g: number;
  impact_monthly_cents: number;
  impact_yearly_cents: number;
  currency: string;
  status: 'open' | 'acknowledged' | 'resolved';
  acknowledged_at?: string;
  acknowledged_by?: string;
  created_at: string;
}

export interface PortioningConfig {
  id: string;
  restaurant_id: string;
  portion_drift_threshold_g: number;
  monthly_sales_estimate: number;
  currency: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Check if portioning is enabled for a restaurant
 */
export async function isPortioningEnabled(restaurantId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT enabled FROM govern_feature_flags
     WHERE restaurant_id = $1 AND feature_key = 'portioning_cost_real_enabled'`,
    [restaurantId]
  );
  return result.rows[0]?.enabled === true;
}

/**
 * Get base products for a restaurant
 */
export async function getBaseProducts(restaurantId: string): Promise<BaseProduct[]> {
  const result = await pool.query(
    `SELECT * FROM portioning_base_products
     WHERE restaurant_id = $1
     ORDER BY name`,
    [restaurantId]
  );
  return result.rows;
}

/**
 * Get a single base product
 */
export async function getBaseProduct(productId: string): Promise<BaseProduct | null> {
  const result = await pool.query(
    `SELECT * FROM portioning_base_products WHERE id = $1`,
    [productId]
  );
  return result.rows[0] || null;
}

/**
 * Create or update a base product
 */
export async function upsertBaseProduct(params: {
  restaurant_id: string;
  id?: string;
  name: string;
  cost_total_cents: number;
  weight_total_g: number;
  loss_percent: number;
  portion_weight_g: number;
  thickness_mm: number;
  currency?: string;
}): Promise<BaseProduct> {
  // Check feature flag
  const enabled = await isPortioningEnabled(params.restaurant_id);
  if (!enabled && params.id) {
    throw new Error('Portioning is disabled for this restaurant');
  }

  const currency = params.currency || 'EUR';

  if (params.id) {
    // Update
    const result = await pool.query(
      `UPDATE portioning_base_products
       SET name = $1, cost_total_cents = $2, weight_total_g = $3, loss_percent = $4,
           portion_weight_g = $5, thickness_mm = $6, currency = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        params.name,
        params.cost_total_cents,
        params.weight_total_g,
        params.loss_percent,
        params.portion_weight_g,
        params.thickness_mm,
        currency,
        params.id,
      ]
    );
    return result.rows[0];
  } else {
    // Create
    const result = await pool.query(
      `INSERT INTO portioning_base_products
       (restaurant_id, name, cost_total_cents, weight_total_g, loss_percent, portion_weight_g, thickness_mm, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        params.restaurant_id,
        params.name,
        params.cost_total_cents,
        params.weight_total_g,
        params.loss_percent,
        params.portion_weight_g,
        params.thickness_mm,
        currency,
      ]
    );
    return result.rows[0];
  }
}

/**
 * Start a portioning session
 */
export async function startSession(params: {
  restaurant_id: string;
  base_product_id: string;
  target_portions: number;
  session_date?: string;
}): Promise<PortioningSession> {
  // Check feature flag
  const enabled = await isPortioningEnabled(params.restaurant_id);
  if (!enabled) {
    throw new Error('Portioning is disabled for this restaurant');
  }

  const sessionDate = params.session_date || new Date().toISOString().split('T')[0];

  const result = await pool.query(
    `INSERT INTO portioning_sessions
     (restaurant_id, base_product_id, session_date, target_portions, status)
     VALUES ($1, $2, $3, $4, 'in_progress')
     RETURNING *`,
    [params.restaurant_id, params.base_product_id, sessionDate, params.target_portions]
  );
  return result.rows[0];
}

/**
 * Register a measurement
 */
export async function registerMeasurement(params: {
  session_id: string;
  measured_weight_g: number;
  measured_thickness_mm: number;
  notes?: string;
  created_by?: string;
}): Promise<{ measurement: PortionMeasurement; alert?: PortioningAlert }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get session and base product
    const sessionResult = await client.query(
      `SELECT s.*, p.portion_weight_g, p.restaurant_id, p.currency, p.cost_per_gram_cents
       FROM portioning_sessions s
       JOIN portioning_base_products p ON p.id = s.base_product_id
       WHERE s.id = $1`,
      [params.session_id]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('Session not found');
    }

    const session = sessionResult.rows[0];
    const expectedWeight = session.portion_weight_g;
    const variation = params.measured_weight_g - expectedWeight;

    // Insert measurement
    const measurementResult = await client.query(
      `INSERT INTO portion_measurements
       (session_id, measured_weight_g, measured_thickness_mm, variation_g, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        params.session_id,
        params.measured_weight_g,
        params.measured_thickness_mm,
        variation,
        params.notes || null,
        params.created_by || null,
      ]
    );

    const measurement = measurementResult.rows[0];

    // Recalculate session averages
    const avgResult = await client.query(
      `SELECT AVG(variation_g) as avg_variation, COUNT(*) as count
       FROM portion_measurements
       WHERE session_id = $1`,
      [params.session_id]
    );

    const avgVariation = parseFloat(avgResult.rows[0].avg_variation || '0');
    const count = parseInt(avgResult.rows[0].count || '0');

    // Update session
    await client.query(
      `UPDATE portioning_sessions
       SET total_variation_g = $1, avg_variation_g = $2, actual_portions = $3
       WHERE id = $4`,
      [avgVariation * count, avgVariation, count, params.session_id]
    );

    // Check for drift
    const configResult = await client.query(
      `SELECT portion_drift_threshold_g, monthly_sales_estimate, currency
       FROM portioning_config
       WHERE restaurant_id = $1`,
      [session.restaurant_id]
    );

    let alert: PortioningAlert | undefined;

    if (configResult.rows.length > 0) {
      const config = configResult.rows[0];
      const threshold = config.portion_drift_threshold_g;
      const monthlySales = config.monthly_sales_estimate || 0;
      const currency = config.currency || session.currency || 'EUR';

      if (Math.abs(avgVariation) > threshold && count >= 3) {
        // Calculate impact
        const costPerGram = session.cost_per_gram_cents / 100; // Convert to currency units
        const impactPerPortion = Math.abs(avgVariation) * costPerGram;
        const impactMonthly = impactPerPortion * monthlySales;
        const impactYearly = impactMonthly * 12;

        // Create alert
        const alertResult = await client.query(
          `INSERT INTO portioning_alerts
           (session_id, alert_type, message, severity, base_product_id, avg_variation_g,
            impact_monthly_cents, impact_yearly_cents, currency, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open')
           RETURNING *`,
          [
            params.session_id,
            'drift_detected',
            `Variação média de ${avgVariation.toFixed(1)}g detectada. Impacto estimado: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(impactYearly / 100)}/ano`,
            Math.abs(avgVariation) > threshold * 2 ? 'critical' : 'warning',
            session.base_product_id,
            avgVariation,
            Math.round(impactMonthly * 100), // Convert to cents
            Math.round(impactYearly * 100), // Convert to cents
            currency,
          ]
        );

        alert = alertResult.rows[0];
      }
    }

    await client.query('COMMIT');
    return { measurement, alert };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Get open alerts
 */
export async function getOpenAlerts(restaurantId: string): Promise<PortioningAlert[]> {
  const result = await pool.query(
    `SELECT a.* FROM portioning_alerts a
     JOIN portioning_sessions s ON s.id = a.session_id
     WHERE s.restaurant_id = $1 AND a.status = 'open'
     ORDER BY a.created_at DESC`,
    [restaurantId]
  );
  return result.rows;
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
  alertId: string,
  params: { acknowledged_by: string }
): Promise<void> {
  await pool.query(
    `UPDATE portioning_alerts
     SET status = 'acknowledged', acknowledged_at = NOW(), acknowledged_by = $1
     WHERE id = $2`,
    [params.acknowledged_by, alertId]
  );
}

/**
 * Get portioning config
 */
export async function getConfig(restaurantId: string): Promise<PortioningConfig | null> {
  const result = await pool.query(
    `SELECT * FROM portioning_config WHERE restaurant_id = $1`,
    [restaurantId]
  );
  return result.rows[0] || null;
}

/**
 * Update portioning config
 */
export async function updateConfig(params: {
  restaurant_id: string;
  portion_drift_threshold_g?: number;
  monthly_sales_estimate?: number;
  currency?: string;
  enabled?: boolean;
}): Promise<PortioningConfig> {
  const existing = await getConfig(params.restaurant_id);

  if (existing) {
    const result = await pool.query(
      `UPDATE portioning_config
       SET portion_drift_threshold_g = COALESCE($1, portion_drift_threshold_g),
           monthly_sales_estimate = COALESCE($2, monthly_sales_estimate),
           currency = COALESCE($3, currency),
           enabled = COALESCE($4, enabled),
           updated_at = NOW()
       WHERE restaurant_id = $5
       RETURNING *`,
      [
        params.portion_drift_threshold_g,
        params.monthly_sales_estimate,
        params.currency,
        params.enabled,
        params.restaurant_id,
      ]
    );
    return result.rows[0];
  } else {
    const result = await pool.query(
      `INSERT INTO portioning_config
       (restaurant_id, portion_drift_threshold_g, monthly_sales_estimate, currency, enabled)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        params.restaurant_id,
        params.portion_drift_threshold_g || 10,
        params.monthly_sales_estimate || 0,
        params.currency || 'EUR',
        params.enabled !== false,
      ]
    );
    return result.rows[0];
  }
}

/**
 * Calculate impact for simulation
 */
export function calculateImpact(params: {
  error_g: number;
  monthly_sales: number;
  cost_per_gram_cents: number;
  currency: string;
}): {
  impact_per_portion_cents: number;
  impact_monthly_cents: number;
  impact_yearly_cents: number;
  impact_monthly_formatted: string;
  impact_yearly_formatted: string;
} {
  const costPerGram = params.cost_per_gram_cents / 100;
  const impactPerPortion = Math.abs(params.error_g) * costPerGram;
  const impactMonthly = impactPerPortion * params.monthly_sales;
  const impactYearly = impactMonthly * 12;

  return {
    impact_per_portion_cents: Math.round(impactPerPortion * 100),
    impact_monthly_cents: Math.round(impactMonthly * 100),
    impact_yearly_cents: Math.round(impactYearly * 100),
    impact_monthly_formatted: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: params.currency,
    }).format(impactMonthly),
    impact_yearly_formatted: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: params.currency,
    }).format(impactYearly),
  };
}

