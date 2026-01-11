/**
 * ADVANCED KDS (Kitchen Display System) — Phase 2
 * 
 * Extends Phase 1 KDS with:
 * - Order routing (assign to kitchen stations)
 * - Prep time estimation (AI-powered)
 * - Kitchen stats (efficiency metrics)
 * - Smart alerts (visual + sound)
 */

export type KDSStation = 'grill' | 'fryer' | 'prep' | 'sauces' | 'expediting';
export type OrderPriority = 'normal' | 'high' | 'urgent';

export interface KDSOrder {
  id: string; // UUID
  restaurantId: string;
  orderId: string; // From TPV
  
  // Routing
  assignedStation?: KDSStation;
  isAssigned: boolean;
  
  // Status
  status: 'pending' | 'accepted' | 'in_progress' | 'ready' | 'picked_up';
  priority: OrderPriority;
  
  // Timing
  createdAt: Date;
  acceptedAt?: Date;
  readyAt?: Date;
  pickedUpAt?: Date;
  
  // Estimated vs Actual
  estimatedPrepTime: number; // seconds (e.g., 600 = 10 min)
  actualPrepTime?: number; // seconds
  wasOnTime: boolean; // true if ready by estimate
  
  // Items
  items: KDSOrderItem[];
  
  // Alerts
  isLate: boolean; // True if >estimatedPrepTime has passed
  shouldAlert: boolean; // Visual + sound alert needed?
}

export interface KDSOrderItem {
  id: string;
  name: string;
  quantity: number;
  specialInstructions?: string;
  isCompleted: boolean;
  completedAt?: Date;
  station: KDSStation;
}

export interface KDSStationStats {
  station: KDSStation;
  ordersToday: number;
  avgPrepTime: number; // seconds
  onTimeRate: number; // 0–1 (percentage of orders ready on time)
  lateOrders: number;
  efficiency: number; // 0–1 (on-time-rate × utilization)
}

export interface KDSMetrics {
  restaurantId: string;
  timestamp: Date;
  
  // Overall
  ordersInProgress: number;
  ordersReady: number;
  lateOrders: number;
  
  // By station
  stationStats: KDSStationStats[];
  
  // Trends
  avgPrepTime: number; // today
  avgPrepTimeLast7Days: number;
  onTimeRate: number; // today
  onTimeRateLast7Days: number;
}

/**
 * AI ESTIMATION
 * 
 * Prep time estimation based on:
 * - Historical data (how long did similar orders take?)
 * - Item complexity (burger = fast, cooked = slow)
 * - Current queue (how many orders ahead?)
 * - Time of day (lunch rush = slower)
 */

export interface PrepTimeEstimatorInput {
  items: { name: string; quantity: number }[];
  restaurantId: string;
  timeOfDay: Date;
  currentQueueLength: number; // How many orders in progress?
  historicalData?: {
    avgTimeForItem: Record<string, number>; // Item name → avg seconds
    avgQueueWaitTime: number; // seconds per item in queue
  };
}

export interface PrepTimeEstimatorOutput {
  estimatedSeconds: number;
  breakdown: {
    baseTime: number; // Time to cook items
    queueWaitTime: number; // Wait for available station
    rushMultiplier: number; // 1.0 = normal, 1.5 = peak time
    confidenceScore: number; // 0–1 (how accurate is this estimate?)
  };
}

/**
 * CONTRACTS
 */

export interface AssignOrderToStationInput {
  restaurantId: string;
  orderId: string;
  station: KDSStation;
}

export interface AssignOrderToStationOutput {
  success: boolean;
  orderId: string;
  station: KDSStation;
  estimatedReadyTime: Date;
}

export interface MarkOrderReadyInput {
  restaurantId: string;
  orderId: string;
}

export interface MarkOrderReadyOutput {
  success: boolean;
  orderId: string;
  actualPrepTime: number; // seconds
  wasOnTime: boolean;
  stationStats: KDSStationStats;
}

export interface GetKDSMetricsInput {
  restaurantId: string;
  timeRange: 'today' | 'week' | 'month';
}

export interface GetKDSMetricsOutput {
  metrics: KDSMetrics;
}

/**
 * ALERT RULES
 */

export interface KDSAlertRule {
  condition: 'late' | 'urgent' | 'stuck' | 'bottleneck';
  threshold?: number; // seconds or order count
  action: 'visual' | 'sound' | 'notification';
  priority: 'low' | 'high' | 'critical';
}

export const DEFAULT_KDS_ALERTS: KDSAlertRule[] = [
  {
    condition: 'late',
    threshold: 60, // if order is 60s past estimate
    action: 'visual',
    priority: 'high',
  },
  {
    condition: 'urgent',
    threshold: undefined, // high priority orders
    action: 'sound',
    priority: 'critical',
  },
  {
    condition: 'stuck',
    threshold: 300, // if order stuck for 5 min
    action: 'notification',
    priority: 'high',
  },
  {
    condition: 'bottleneck',
    threshold: 5, // if 5+ orders in one station
    action: 'visual',
    priority: 'high',
  },
];
