/**
 * stock-service.ts — Stock Management Service
 * 
 * Stock control for menu items, inspired by Last.app Stock feature.
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface StockItem {
  id: string;
  restaurant_id: string;
  product_id?: string;
  product_name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  max_stock?: number;
  cost_per_unit?: number;
  supplier?: string;
  auto_deduct: boolean;
}

/**
 * Create or update stock item
 */
export async function upsertStockItem(
  restaurantId: string,
  item: {
    product_id?: string;
    product_name: string;
    unit?: string;
    min_stock?: number;
    max_stock?: number;
    cost_per_unit?: number;
    supplier?: string;
    auto_deduct?: boolean;
  }
): Promise<StockItem> {
  const result = await pool.query(
    `INSERT INTO operational_hub_stock_items
     (restaurant_id, product_id, product_name, unit, min_stock, max_stock, cost_per_unit, supplier, auto_deduct)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT DO UPDATE SET
       product_name = EXCLUDED.product_name,
       unit = EXCLUDED.unit,
       min_stock = EXCLUDED.min_stock,
       max_stock = EXCLUDED.max_stock,
       cost_per_unit = EXCLUDED.cost_per_unit,
       supplier = EXCLUDED.supplier,
       auto_deduct = EXCLUDED.auto_deduct,
       updated_at = NOW()
     RETURNING id, restaurant_id, product_id, product_name, unit, current_stock, min_stock, max_stock, cost_per_unit, supplier, auto_deduct`,
    [
      restaurantId,
      item.product_id || null,
      item.product_name,
      item.unit || 'unit',
      item.min_stock || 0,
      item.max_stock || null,
      item.cost_per_unit || null,
      item.supplier || null,
      item.auto_deduct ?? true,
    ]
  );

  return result.rows[0];
}

/**
 * Get stock items with low stock alert
 */
export async function getLowStockItems(restaurantId: string): Promise<StockItem[]> {
  const result = await pool.query(
    `SELECT id, restaurant_id, product_id, product_name, unit, current_stock, min_stock, max_stock, cost_per_unit, supplier, auto_deduct
     FROM operational_hub_stock_items
     WHERE restaurant_id = $1
       AND current_stock <= min_stock
     ORDER BY (current_stock - min_stock) ASC`,
    [restaurantId]
  );

  // Emit events for low stock items (Event Bus integration)
  if (result.rows.length > 0) {
    try {
      const { emitStockLowEvent } = await import('../operational-event-bus/integrations');
      for (const item of result.rows) {
        await emitStockLowEvent(restaurantId, {
          id: item.id,
          product_name: item.product_name,
          current_stock: parseFloat(item.current_stock),
          min_stock: parseFloat(item.min_stock),
        });
      }
    } catch (err) {
      // Event Bus not available, continue silently
      console.warn('[StockService] Event Bus not available:', err);
    }
  }

  return result.rows;
}

/**
 * Deduct stock for order items
 */
export async function deductStockForOrder(
  restaurantId: string,
  orderId: string,
  items: Array<{ product_id: string; quantity: number }>
): Promise<void> {
  for (const item of items) {
    // Find stock item by product_id
    const stockItem = await pool.query(
      `SELECT id, auto_deduct FROM operational_hub_stock_items
       WHERE restaurant_id = $1
         AND product_id = $2
         AND auto_deduct = true`,
      [restaurantId, item.product_id]
    );

    if (stockItem.rows.length > 0) {
      const stockId = stockItem.rows[0].id;

      // Deduct stock
      await pool.query(
        `UPDATE operational_hub_stock_items
         SET current_stock = current_stock - $1,
             updated_at = NOW()
         WHERE id = $2
           AND current_stock >= $1`,
        [item.quantity, stockId]
      );

      // Record movement
      await pool.query(
        `INSERT INTO operational_hub_stock_movements
         (restaurant_id, stock_item_id, movement_type, quantity, order_id)
         VALUES ($1, $2, 'sale', $3, $4)`,
        [restaurantId, stockId, item.quantity, orderId]
      );
    }
  }
}

/**
 * Restock item
 */
export async function restockItem(
  restaurantId: string,
  stockItemId: string,
  quantity: number,
  userId?: string
): Promise<void> {
  // Get item before update
  const itemResult = await pool.query(
    `SELECT product_name FROM operational_hub_stock_items WHERE id = $1`,
    [stockItemId]
  );

  await pool.query(
    `UPDATE operational_hub_stock_items
     SET current_stock = current_stock + $1,
         last_restocked_at = NOW(),
         updated_at = NOW()
     WHERE id = $2`,
    [quantity, stockItemId]
  );

  // Record movement
  await pool.query(
    `INSERT INTO operational_hub_stock_movements
     (restaurant_id, stock_item_id, movement_type, quantity, user_id)
     VALUES ($1, $2, 'restock', $3, $4)`,
    [restaurantId, stockItemId, quantity, userId || null]
  );

  // Emit restocked event (Event Bus integration)
  if (itemResult.rows.length > 0) {
    try {
      const { emitStockRestockedEvent } = await import('../operational-event-bus/integrations');
      await emitStockRestockedEvent(restaurantId, {
        id: stockItemId,
        product_name: itemResult.rows[0].product_name,
        quantity,
      });
    } catch (err) {
      // Event Bus not available, continue silently
      console.warn('[StockService] Event Bus not available:', err);
    }
  }
}

/**
 * Get stock movements
 */
export async function getStockMovements(
  restaurantId: string,
  stockItemId?: string,
  limit: number = 50
): Promise<Array<{
  id: string;
  stock_item_id: string;
  product_name: string;
  movement_type: string;
  quantity: number;
  created_at: string;
}>> {
  let query = `
    SELECT 
      m.id,
      m.stock_item_id,
      s.product_name,
      m.movement_type,
      m.quantity,
      m.created_at
    FROM operational_hub_stock_movements m
    JOIN operational_hub_stock_items s ON s.id = m.stock_item_id
    WHERE m.restaurant_id = $1
  `;
  const params: any[] = [restaurantId];

  if (stockItemId) {
    query += ` AND m.stock_item_id = $2`;
    params.push(stockItemId);
  }

  query += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await pool.query(query, params);
  return result.rows;
}

