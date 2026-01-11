/**
 * delivery-integration-service.ts — Delivery Platform Integration
 * 
 * Centralizes delivery orders from multiple platforms (Glovo, Uber Eats, etc.), inspired by Last.app.
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface DeliveryChannel {
  id: string;
  restaurant_id: string;
  channel_name: 'glovo' | 'uber_eats' | 'just_eat' | 'deliveroo' | 'rappi' | 'ifood' | 'custom';
  channel_type: 'api' | 'webhook' | 'manual';
  enabled: boolean;
  auto_accept: boolean;
}

export interface DeliveryOrder {
  id: string;
  channel: string;
  external_order_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  created_at: string;
}

/**
 * Register delivery channel
 */
export async function registerDeliveryChannel(
  restaurantId: string,
  channel: {
    channel_name: 'glovo' | 'uber_eats' | 'just_eat' | 'deliveroo' | 'rappi' | 'ifood' | 'custom';
    channel_type: 'api' | 'webhook' | 'manual';
    api_credentials_enc?: Buffer;
    webhook_url?: string;
    webhook_secret?: string;
    enabled?: boolean;
    auto_accept?: boolean;
  }
): Promise<DeliveryChannel> {
  const result = await pool.query(
    `INSERT INTO operational_hub_delivery_channels
     (restaurant_id, channel_name, channel_type, api_credentials_enc, webhook_url, webhook_secret, enabled, auto_accept)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (restaurant_id, channel_name)
     DO UPDATE SET
       channel_type = EXCLUDED.channel_type,
       api_credentials_enc = EXCLUDED.api_credentials_enc,
       webhook_url = EXCLUDED.webhook_url,
       webhook_secret = EXCLUDED.webhook_secret,
       enabled = EXCLUDED.enabled,
       auto_accept = EXCLUDED.auto_accept,
       updated_at = NOW()
     RETURNING id, restaurant_id, channel_name, channel_type, enabled, auto_accept`,
    [
      restaurantId,
      channel.channel_name,
      channel.channel_type,
      channel.api_credentials_enc || null,
      channel.webhook_url || null,
      channel.webhook_secret || null,
      channel.enabled ?? true,
      channel.auto_accept ?? false,
    ]
  );

  return result.rows[0];
}

/**
 * Get delivery channels
 */
export async function getDeliveryChannels(restaurantId: string): Promise<DeliveryChannel[]> {
  const result = await pool.query(
    `SELECT id, restaurant_id, channel_name, channel_type, enabled, auto_accept
     FROM operational_hub_delivery_channels
     WHERE restaurant_id = $1
     ORDER BY channel_name`,
    [restaurantId]
  );

  return result.rows;
}

/**
 * Sync delivery orders (stub - would integrate with real APIs)
 */
export async function syncDeliveryOrders(
  restaurantId: string,
  channelName: string
): Promise<{ synced: number; errors: number }> {
  // STUB: In production, this would:
  // 1. Get channel credentials
  // 2. Call channel API (Glovo, Uber Eats, etc.)
  // 3. Create orders in system
  // 4. Return sync results

  console.log(`[STUB] Syncing delivery orders for ${channelName}`);

  return { synced: 0, errors: 0 };
}

/**
 * Handle webhook from delivery platform
 */
export async function handleDeliveryWebhook(
  restaurantId: string,
  channelName: string,
  payload: any
): Promise<void> {
  // STUB: In production, this would:
  // 1. Verify webhook signature
  // 2. Parse order data
  // 3. Create order in system
  // 4. Auto-accept if configured

  console.log(`[STUB] Handling webhook from ${channelName}`, payload);
}

