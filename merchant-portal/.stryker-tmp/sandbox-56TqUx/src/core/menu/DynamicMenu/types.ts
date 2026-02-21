/**
 * DYNAMIC CONTEXTUAL MENU - TYPE DEFINITIONS
 *
 * Intelligent menu system that auto-prioritizes products based on:
 * - Time of day
 * - Historical usage patterns
 * - Recent activity
 * - Manual favorites
 */
// @ts-nocheck


export interface ProductDynamics {
  id: string;
  restaurant_id: string;
  product_id: string;

  // Manual Controls
  is_favorite: boolean;
  favorite_order: number | null;

  // Time-Based Statistics (24-hour buckets)
  hour_stats: Record<string, number>; // { "09": 12, "14": 45 }

  // Recent Activity Tracking
  last_ordered_at: string | null;
  last_clicked_at: string | null;
  recent_order_count: number;

  // Cached Score
  cached_score: number;
  score_updated_at: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ScoreWeights {
  time_match: number; // Default: 0.4
  recent_frequency: number; // Default: 0.3
  click_recency: number; // Default: 0.2
  favorite_bonus: number; // Default: 0.1
}

export interface TimeSlotConfig {
  morning: [number, number]; // [6, 11]
  lunch: [number, number]; // [12, 16]
  afternoon: [number, number]; // [17, 19]
  night: [number, number]; // [20, 23]
}

export interface MenuSettings {
  dynamic_menu_enabled: boolean;
  score_weights: ScoreWeights;
  time_slots: TimeSlotConfig;
}

export interface DynamicMenuResponse {
  contextual: ProductWithScore[];
  favorites: ProductWithScore[];
  fullCatalog: CategoryWithProducts[];
}

export interface ProductWithScore {
  id: string;
  name: string;
  description?: string;
  photo_url?: string;
  category: string;
  price_cents: number;
  available: boolean;

  // Dynamic Data
  score: number;
  is_favorite: boolean;
  click_count_today?: number;

  /** IDs dos grupos de modificadores ligados ao produto */
  modifierGroupIds?: string[];
}

export interface CategoryWithProducts {
  id: string;
  name: string;
  products: ProductWithScore[];
}

export type TimeSlot = "morning" | "lunch" | "afternoon" | "night";

export interface ScoreComponents {
  time_match: number;
  recent_frequency: number;
  click_recency: number;
  favorite_bonus: number;
  final_score: number;
}
