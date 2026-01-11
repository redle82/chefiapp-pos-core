/**
 * restaurant-group-service.ts — Restaurant Group Service
 * 
 * Service for managing restaurant groups (multi-location UI - Q2 2026 Feature 2)
 */

import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';

export interface RestaurantGroup {
  id: string;
  ownerId: string;
  name: string;
  restaurantIds: string[];
  settings: {
    sharedMenu: boolean;
    sharedMarketplaceAccount: boolean;
    consolidatedBilling: boolean;
    allowLocationOverrides: boolean;
  };
  primaryBillingRestaurantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantGroupMembership {
  restaurantId: string;
  groupId: string;
  menuOverridesAllowed: boolean;
  localSettings?: {
    customMenu?: boolean;
    customMarketplacePrices?: boolean;
  };
  joinedAt: Date;
}

const CreateRestaurantGroupSchema = z.object({
  name: z.string().min(3).max(120),
  restaurantIds: z.array(z.string().uuid()).min(1),
  sharedMenu: z.boolean().default(false),
  sharedMarketplaceAccount: z.boolean().default(false),
  consolidatedBilling: z.boolean().default(false),
  allowLocationOverrides: z.boolean().default(true),
});

const AddRestaurantToGroupSchema = z.object({
  restaurantId: z.string().uuid(),
});

const SyncMenuSchema = z.object({
  sourceRestaurantId: z.string().uuid(),
  targetRestaurantIds: z.array(z.string().uuid()).min(1),
  overwriteExisting: z.boolean().default(false),
});

export class RestaurantGroupService {
  constructor(private pool: Pool) {}

  /**
   * Create a new restaurant group
   */
  async createGroup(ownerId: string, input: z.infer<typeof CreateRestaurantGroupSchema>): Promise<RestaurantGroup> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Validate that user owns all restaurants
      for (const restaurantId of input.restaurantIds) {
        const ownershipCheck = await client.query(
          `SELECT 1 FROM gm_restaurant_members 
           WHERE user_id = $1 AND restaurant_id = $2 AND role IN ('owner', 'manager')`,
          [ownerId, restaurantId]
        );
        if (ownershipCheck.rows.length === 0) {
          throw new Error(`User does not own restaurant ${restaurantId}`);
        }
      }

      // Create group
      const groupId = uuid();
      const settings = {
        sharedMenu: input.sharedMenu,
        sharedMarketplaceAccount: input.sharedMarketplaceAccount,
        consolidatedBilling: input.consolidatedBilling,
        allowLocationOverrides: input.allowLocationOverrides,
      };

      await client.query(
        `INSERT INTO restaurant_groups (id, owner_id, name, settings)
         VALUES ($1, $2, $3, $4)`,
        [groupId, ownerId, input.name, JSON.stringify(settings)]
      );

      // Add restaurants to group
      for (const restaurantId of input.restaurantIds) {
        await client.query(
          `INSERT INTO restaurant_group_memberships (group_id, restaurant_id, menu_overrides_allowed)
           VALUES ($1, $2, $3)`,
          [groupId, restaurantId, input.allowLocationOverrides]
        );
      }

      await client.query('COMMIT');

      return {
        id: groupId,
        ownerId,
        name: input.name,
        restaurantIds: input.restaurantIds,
        settings,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Get all groups for a user
   */
  async getGroupsForUser(userId: string): Promise<RestaurantGroup[]> {
    const result = await this.pool.query(
      `SELECT 
        rg.id,
        rg.owner_id,
        rg.name,
        rg.settings,
        rg.primary_billing_restaurant_id,
        rg.created_at,
        rg.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'restaurantId', rgm.restaurant_id,
              'menuOverridesAllowed', rgm.menu_overrides_allowed,
              'joinedAt', rgm.joined_at
            )
          ) FILTER (WHERE rgm.restaurant_id IS NOT NULL),
          '[]'::json
        ) as restaurants
       FROM restaurant_groups rg
       LEFT JOIN restaurant_group_memberships rgm ON rgm.group_id = rg.id
       WHERE rg.owner_id = $1
       GROUP BY rg.id, rg.owner_id, rg.name, rg.settings, rg.primary_billing_restaurant_id, rg.created_at, rg.updated_at
       ORDER BY rg.created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      restaurantIds: (row.restaurants || []).map((r: any) => r.restaurantId),
      settings: row.settings,
      primaryBillingRestaurantId: row.primary_billing_restaurant_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Get a specific group by ID
   */
  async getGroup(groupId: string, userId: string): Promise<RestaurantGroup | null> {
    const result = await this.pool.query(
      `SELECT 
        rg.id,
        rg.owner_id,
        rg.name,
        rg.settings,
        rg.primary_billing_restaurant_id,
        rg.created_at,
        rg.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'restaurantId', rgm.restaurant_id,
              'menuOverridesAllowed', rgm.menu_overrides_allowed,
              'joinedAt', rgm.joined_at
            )
          ) FILTER (WHERE rgm.restaurant_id IS NOT NULL),
          '[]'::json
        ) as restaurants
       FROM restaurant_groups rg
       LEFT JOIN restaurant_group_memberships rgm ON rgm.group_id = rg.id
       WHERE rg.id = $1 AND rg.owner_id = $2
       GROUP BY rg.id, rg.owner_id, rg.name, rg.settings, rg.primary_billing_restaurant_id, rg.created_at, rg.updated_at`,
      [groupId, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      restaurantIds: (row.restaurants || []).map((r: any) => r.restaurantId),
      settings: row.settings,
      primaryBillingRestaurantId: row.primary_billing_restaurant_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Add a restaurant to a group
   */
  async addRestaurantToGroup(
    groupId: string,
    userId: string,
    restaurantId: string
  ): Promise<{ success: boolean; totalRestaurants: number }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verify user owns the group
      const groupCheck = await client.query(
        `SELECT id FROM restaurant_groups WHERE id = $1 AND owner_id = $2`,
        [groupId, userId]
      );
      if (groupCheck.rows.length === 0) {
        throw new Error('Group not found or user does not own it');
      }

      // Verify user owns the restaurant
      const restaurantCheck = await client.query(
        `SELECT 1 FROM gm_restaurant_members 
         WHERE user_id = $1 AND restaurant_id = $2 AND role IN ('owner', 'manager')`,
        [userId, restaurantId]
      );
      if (restaurantCheck.rows.length === 0) {
        throw new Error('User does not own restaurant');
      }

      // Check if restaurant is already in group
      const existing = await client.query(
        `SELECT id FROM restaurant_group_memberships WHERE group_id = $1 AND restaurant_id = $2`,
        [groupId, restaurantId]
      );
      if (existing.rows.length > 0) {
        throw new Error('Restaurant already in group');
      }

      // Add restaurant to group
      await client.query(
        `INSERT INTO restaurant_group_memberships (group_id, restaurant_id, menu_overrides_allowed)
         VALUES ($1, $2, $3)`,
        [groupId, restaurantId, true]
      );

      // Get total count
      const countResult = await client.query(
        `SELECT COUNT(*)::int as count FROM restaurant_group_memberships WHERE group_id = $1`,
        [groupId]
      );
      const totalRestaurants = countResult.rows[0].count;

      await client.query('COMMIT');

      return { success: true, totalRestaurants };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Get consolidated dashboard for a group
   */
  async getGroupDashboard(groupId: string, userId: string): Promise<{
    group: RestaurantGroup;
    restaurants: Array<{
      id: string;
      name: string;
      ordersToday: number;
      revenueToday: number;
      status: 'online' | 'offline';
    }>;
    consolidated: {
      totalOrdersToday: number;
      totalRevenueToday: number;
      totalCustomersToday: number;
    };
  }> {
    const group = await this.getGroup(groupId, userId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Get restaurant details with today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const restaurants = await Promise.all(
      group.restaurantIds.map(async (restaurantId) => {
        // Get restaurant name
        const restaurantResult = await this.pool.query(
          `SELECT name FROM gm_restaurants WHERE id = $1`,
          [restaurantId]
        );
        const name = restaurantResult.rows[0]?.name || 'Unknown';

        // Get today's orders count
        const ordersResult = await this.pool.query(
          `SELECT COUNT(*)::int as count, COALESCE(SUM(total_cents), 0)::bigint as revenue
           FROM gm_orders
           WHERE restaurant_id = $1 AND created_at >= $2 AND status != 'cancelled'`,
          [restaurantId, today]
        );
        const ordersToday = ordersResult.rows[0]?.count || 0;
        const revenueToday = Number(ordersResult.rows[0]?.revenue || 0) / 100; // Convert cents to euros

        // Get operation status
        const statusResult = await this.pool.query(
          `SELECT operation_status FROM gm_restaurants WHERE id = $1`,
          [restaurantId]
        );
        const operationStatus = statusResult.rows[0]?.operation_status || 'active';
        const status: 'online' | 'offline' = operationStatus === 'active' ? 'online' : 'offline';

        return {
          id: restaurantId,
          name,
          ordersToday,
          revenueToday,
          status,
        };
      })
    );

    // Calculate consolidated stats
    const consolidated = {
      totalOrdersToday: restaurants.reduce((sum, r) => sum + r.ordersToday, 0),
      totalRevenueToday: restaurants.reduce((sum, r) => sum + r.revenueToday, 0),
      totalCustomersToday: 0, // TODO: Calculate from orders
    };

    return {
      group,
      restaurants,
      consolidated,
    };
  }

  /**
   * Sync menu from one restaurant to others in the group
   */
  async syncMenu(
    groupId: string,
    userId: string,
    input: z.infer<typeof SyncMenuSchema>
  ): Promise<{ success: boolean; restaurantsSynced: number; itemsSynced: number }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verify user owns the group
      const groupCheck = await client.query(
        `SELECT id FROM restaurant_groups WHERE id = $1 AND owner_id = $2`,
        [groupId, userId]
      );
      if (groupCheck.rows.length === 0) {
        throw new Error('Group not found or user does not own it');
      }

      // Verify source restaurant is in group
      const sourceCheck = await client.query(
        `SELECT 1 FROM restaurant_group_memberships WHERE group_id = $1 AND restaurant_id = $2`,
        [groupId, input.sourceRestaurantId]
      );
      if (sourceCheck.rows.length === 0) {
        throw new Error('Source restaurant not in group');
      }

      // Get source menu items
      const sourceItems = await client.query(
        `SELECT 
          category_id,
          name,
          description,
          price_cents,
          currency,
          photo_url,
          tags,
          is_active
         FROM menu_items
         WHERE restaurant_id = $1 AND is_active = true`,
        [input.sourceRestaurantId]
      );

      let itemsSynced = 0;
      const restaurantsSynced = new Set<string>();

      // Sync to each target restaurant
      for (const targetRestaurantId of input.targetRestaurantIds) {
        // Verify target is in group
        const targetCheck = await client.query(
          `SELECT 1 FROM restaurant_group_memberships WHERE group_id = $1 AND restaurant_id = $2`,
          [groupId, targetRestaurantId]
        );
        if (targetCheck.rows.length === 0) {
          continue; // Skip if not in group
        }

        // Get or create categories (by name)
        const categoryMap = new Map<string, string>();
        const sourceCategories = await client.query(
          `SELECT DISTINCT mc.id, mc.name
           FROM menu_categories mc
           JOIN menu_items mi ON mi.category_id = mc.id
           WHERE mi.restaurant_id = $1`,
          [input.sourceRestaurantId]
        );

        for (const sourceCat of sourceCategories.rows) {
          // Check if category exists in target
          const existingCat = await client.query(
            `SELECT id FROM menu_categories WHERE restaurant_id = $1 AND name = $2`,
            [targetRestaurantId, sourceCat.name]
          );

          let targetCategoryId: string;
          if (existingCat.rows.length > 0) {
            targetCategoryId = existingCat.rows[0].id;
          } else {
            // Create category
            const newCatId = uuid();
            await client.query(
              `INSERT INTO menu_categories (id, restaurant_id, name, position)
               VALUES ($1, $2, $3, 0)`,
              [newCatId, targetRestaurantId, sourceCat.name]
            );
            targetCategoryId = newCatId;
          }

          categoryMap.set(sourceCat.id, targetCategoryId);
        }

        // Sync items
        for (const sourceItem of sourceItems.rows) {
          const targetCategoryId = categoryMap.get(sourceItem.category_id);
          if (!targetCategoryId) continue;

          if (input.overwriteExisting) {
            // Delete existing item with same name
            await client.query(
              `DELETE FROM menu_items WHERE restaurant_id = $1 AND name = $2`,
              [targetRestaurantId, sourceItem.name]
            );
          } else {
            // Check if item already exists
            const existing = await client.query(
              `SELECT id FROM menu_items WHERE restaurant_id = $1 AND name = $2`,
              [targetRestaurantId, sourceItem.name]
            );
            if (existing.rows.length > 0) {
              continue; // Skip if exists and not overwriting
            }
          }

          // Insert item
          const itemId = uuid();
          await client.query(
            `INSERT INTO menu_items (
              id, category_id, restaurant_id, name, description, price_cents, currency, photo_url, tags, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              itemId,
              targetCategoryId,
              targetRestaurantId,
              sourceItem.name,
              sourceItem.description,
              sourceItem.price_cents,
              sourceItem.currency,
              sourceItem.photo_url,
              sourceItem.tags || [],
              sourceItem.is_active,
            ]
          );
          itemsSynced++;
        }

        restaurantsSynced.add(targetRestaurantId);
      }

      await client.query('COMMIT');

      return {
        success: true,
        restaurantsSynced: restaurantsSynced.size,
        itemsSynced,
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
