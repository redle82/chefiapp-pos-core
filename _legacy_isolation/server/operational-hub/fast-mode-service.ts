/**
 * fast-mode-service.ts — Fast Mode Service (Venda Ultrarrápida)
 * 
 * Ultra-fast sales mode for Fast Service restaurants, inspired by Last.app Fast Mode.
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface FastModeConfig {
  restaurant_id: string;
  enabled: boolean;
  quick_products: string[]; // Product IDs
  default_payment_method: 'cash' | 'card' | 'qr';
  auto_confirm: boolean;
  skip_modifications: boolean;
}

/**
 * Get Fast Mode configuration
 */
export async function getFastModeConfig(restaurantId: string): Promise<FastModeConfig | null> {
  const result = await pool.query(
    `SELECT restaurant_id, enabled, quick_products, default_payment_method, auto_confirm, skip_modifications
     FROM operational_hub_fast_mode
     WHERE restaurant_id = $1`,
    [restaurantId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return {
    restaurant_id: result.rows[0].restaurant_id,
    enabled: result.rows[0].enabled,
    quick_products: result.rows[0].quick_products || [],
    default_payment_method: result.rows[0].default_payment_method || 'card',
    auto_confirm: result.rows[0].auto_confirm || false,
    skip_modifications: result.rows[0].skip_modifications || true,
  };
}

/**
 * Update Fast Mode configuration
 */
export async function updateFastModeConfig(
  restaurantId: string,
  config: Partial<FastModeConfig>
): Promise<void> {
  await pool.query(
    `INSERT INTO operational_hub_fast_mode
     (restaurant_id, enabled, quick_products, default_payment_method, auto_confirm, skip_modifications)
     VALUES ($1, $2, $3::jsonb, $4, $5, $6)
     ON CONFLICT (restaurant_id)
     DO UPDATE SET
       enabled = EXCLUDED.enabled,
       quick_products = EXCLUDED.quick_products,
       default_payment_method = EXCLUDED.default_payment_method,
       auto_confirm = EXCLUDED.auto_confirm,
       skip_modifications = EXCLUDED.skip_modifications,
       updated_at = NOW()`,
    [
      restaurantId,
      config.enabled ?? false,
      JSON.stringify(config.quick_products || []),
      config.default_payment_method || 'card',
      config.auto_confirm ?? false,
      config.skip_modifications ?? true,
    ]
  );
}

/**
 * Get quick products (top sellers) for Fast Mode
 */
export async function getQuickProducts(restaurantId: string, limit: number = 20): Promise<Array<{
  product_id: string;
  product_name: string;
  total_sold: number;
}>> {
  // Get top products from orders in last 30 days
  const result = await pool.query(
    `SELECT 
       oi.product_id,
       COUNT(*) as total_sold
     FROM gm_order_items oi
     JOIN gm_orders o ON o.id = oi.order_id
     WHERE o.restaurant_id = $1
       AND o.created_at >= NOW() - INTERVAL '30 days'
       AND o.status != 'CANCELLED'
     GROUP BY oi.product_id
     ORDER BY total_sold DESC
     LIMIT $2`,
    [restaurantId, limit]
  );

  // TODO: Join with menu items to get product_name
  // For now, return with product_id
  return result.rows.map(row => ({
    product_id: row.product_id,
    product_name: `Product ${row.product_id.substring(0, 8)}`,
    total_sold: parseInt(row.total_sold),
  }));
}

