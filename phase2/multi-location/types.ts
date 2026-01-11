/**
 * MULTI-LOCATION — Phase 2 Core Feature
 * 
 * One owner, multiple restaurants (locations)
 * Shared menu (optional), consolidated dashboard, unified billing
 */

export interface RestaurantGroup {
  id: string; // UUID
  ownerId: string; // UUID (user who owns the group)
  
  // Group name (for internal use)
  name: string; // e.g., "Sofia's Restaurant Group"
  
  // Restaurants in group
  restaurantIds: string[]; // Array of restaurant UUIDs
  
  // Settings
  settings: {
    sharedMenu: boolean; // If true, all restaurants use same menu
    sharedMarketplaceAccount: boolean; // Share marketplace accounts?
    consolidatedBilling: boolean; // One invoice per month?
    allowLocationOverrides: boolean; // Can each location customize menu?
  };
  
  // Billing
  primaryBillingRestaurantId?: string; // Which restaurant's email gets invoices?
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantGroupMembership {
  restaurantId: string;
  groupId: string;
  
  // Can this location customize menu?
  menuOverridesAllowed: boolean;
  
  // Local settings for this location
  localSettings?: {
    customMenu?: boolean;
    customMarketplacePrices?: boolean;
  };
  
  joinedAt: Date;
}

/**
 * CONTRACTS
 */

export interface CreateRestaurantGroupInput {
  ownerId: string;
  name: string;
  restaurantIds: string[]; // Initial restaurants (must be owned by this user)
  sharedMenu: boolean;
}

export interface CreateRestaurantGroupOutput {
  groupId: string;
  group: RestaurantGroup;
}

export interface AddRestaurantToGroupInput {
  groupId: string;
  restaurantId: string;
  ownerId: string; // Must own the group
}

export interface AddRestaurantToGroupOutput {
  success: boolean;
  groupId: string;
  restaurantId: string;
  totalRestaurants: number;
}

export interface GetGroupDashboardInput {
  groupId: string;
  ownerId: string;
}

export interface GetGroupDashboardOutput {
  group: RestaurantGroup;
  restaurants: Array<{
    id: string;
    name: string;
    ordersToday: number;
    revenueToday: number; // €
    status: 'online' | 'offline';
  }>;
  consolidated: {
    totalOrdersToday: number;
    totalRevenueToday: number;
    totalCustomersToday: number;
  };
}

export interface SyncMenuAcrossGroupInput {
  groupId: string;
  sourceRestaurantId: string; // Copy menu from this restaurant
  targetRestaurantIds: string[]; // To these restaurants
  overwriteExisting: boolean;
}

export interface SyncMenuAcrossGroupOutput {
  success: boolean;
  restaurantsSynced: number;
  itemsSynced: number;
}

/**
 * VALIDATION
 */

export function validateRestaurantGroupCreation(input: CreateRestaurantGroupInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.ownerId) errors.push('Owner ID required');
  if (!input.name || input.name.length < 3) errors.push('Group name must be 3+ chars');
  if (!input.restaurantIds || input.restaurantIds.length === 0) {
    errors.push('At least one restaurant required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateAddRestaurantToGroup(input: AddRestaurantToGroupInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.groupId) errors.push('Group ID required');
  if (!input.restaurantId) errors.push('Restaurant ID required');
  if (!input.ownerId) errors.push('Owner ID required');

  return {
    valid: errors.length === 0,
    errors,
  };
}
