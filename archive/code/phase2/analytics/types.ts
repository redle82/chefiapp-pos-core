/**
 * ANALYTICS — Phase 2 Core Feature
 * 
 * Restaurants get insights about:
 * - Orders (volume, trends, popular items)
 * - Revenue (by marketplace, by item, trends)
 * - Customers (retention, repeat rate, NPS)
 * - Performance (delivery time, cancellation rate, efficiency)
 */

import { Decimal } from 'decimal.js';

export interface DailyMetrics {
  restaurantId: string;
  date: Date;
  
  // Orders
  ordersCount: number;
  ordersConfirmed: number;
  ordersCancelled: number;
  ordersLate: number; // >estimated prep time
  
  // Revenue
  revenue: Decimal; // € (total)
  revenueJustEat: Decimal;
  revenueGlovo: Decimal;
  revenueUberEats: Decimal;
  revenueDeliveroo: Decimal;
  revenueWhatsApp: Decimal;
  revenueOther: Decimal;
  
  // Customers
  uniqueCustomers: number;
  repeatCustomers: number; // Customers with 2+ orders
  loyaltyPointsAwarded: number;
  loyaltyPointsRedeemed: number;
  
  // Items
  topItem: string; // Most ordered item
  topItemCount: number;
  avgOrderValue: Decimal;
  
  // Performance
  avgPrepTime: number; // seconds
  avgDeliveryTime?: number; // seconds (if tracked)
  onTimeRate: Decimal; // 0–1
  cancellationRate: Decimal; // 0–1
  
  // Feedback
  npsScore?: number; // If collected
  averageRating?: Decimal; // 1–5 stars
  
  // Metadata
  recordedAt: Date; // When this snapshot was taken
}

export interface MonthlyMetrics {
  restaurantId: string;
  year: number;
  month: number; // 1–12
  
  // Aggregated from daily metrics
  ordersTotal: number;
  revenueTotal: Decimal;
  uniqueCustomersTotal: number;
  repeatCustomerRate: Decimal; // 0–1
  avgOrderValue: Decimal;
  avgPrepTime: number;
  onTimeRate: Decimal;
  cancellationRate: Decimal;
  
  // Trends
  ordersTrend: 'up' | 'flat' | 'down'; // vs previous month
  revenueTrend: 'up' | 'flat' | 'down';
  customerTrend: 'up' | 'flat' | 'down';
  
  // Top performers
  topItem: string;
  topMarketplace: string; // 'just_eat' | 'glovo' | etc
  
  recordedAt: Date;
}

export interface ForecastingMetrics {
  restaurantId: string;
  forecastDate: Date; // What day is being forecast?
  
  // Predictions
  predictedOrders: number;
  predictedRevenue: Decimal;
  predictedCustomers: number;
  
  // Confidence
  confidence: Decimal; // 0–1 (how sure?)
  confidenceInterval: {
    lower: Decimal; // 68% confidence lower bound
    upper: Decimal; // 68% confidence upper bound
  };
  
  // Factors
  dayOfWeek: string; // 'Monday', 'Friday' (affects prediction)
  season: string; // 'summer', 'winter' (affects prediction)
  hasHoliday: boolean;
  specialEvent?: string; // e.g., "Football match", "Local festival"
  
  // Recommendations
  recommendations: string[];
  // e.g., ["Increase prep for Friday lunch", "Stock more fries"]
  
  // Actual (filled in after the day)
  actualOrders?: number;
  actualRevenue?: Decimal;
  accuracy?: Decimal; // 0–1 (how close was the forecast?)
  
  recordedAt: Date;
}

/**
 * CONTRACTS
 */

export interface GetRestaurantMetricsInput {
  restaurantId: string;
  dateRange: 'today' | 'week' | 'month' | 'custom';
  startDate?: Date;
  endDate?: Date;
}

export interface GetRestaurantMetricsOutput {
  daily?: DailyMetrics[];
  monthly?: MonthlyMetrics;
  summary: {
    totalOrders: number;
    totalRevenue: Decimal;
    totalCustomers: number;
    avgOrderValue: Decimal;
    avgPrepTime: number;
    onTimeRate: Decimal;
  };
}

export interface GetForecastInput {
  restaurantId: string;
  days: number; // Forecast next N days
}

export interface GetForecastOutput {
  forecasts: ForecastingMetrics[];
  summary: {
    forecastedRevenue: Decimal; // Sum of next N days
    confidence: Decimal;
    recommendations: string[];
  };
}

/**
 * ANALYTICS ENGINE
 */

export interface AnalyticsEngine {
  /**
   * Collect metrics for a day (run daily, async job)
   */
  collectDailyMetrics(restaurantId: string, date: Date): Promise<DailyMetrics>;

  /**
   * Generate forecast for next N days
   */
  generateForecast(
    restaurantId: string,
    daysAhead: number
  ): Promise<ForecastingMetrics[]>;

  /**
   * Get metrics for a date range
   */
  getMetrics(input: GetRestaurantMetricsInput): Promise<GetRestaurantMetricsOutput>;
}

/**
 * FORECASTING MODEL
 * 
 * Inputs:
 * - Historical orders (past 90 days minimum)
 * - Day of week (Monday–Sunday has different patterns)
 * - Time of year (seasonality)
 * - Special events (holidays, local events)
 * - Market growth (overall market trend)
 * 
 * Output:
 * - Expected orders
 * - Confidence interval
 * - Recommendations
 */

export interface ForecastingInput {
  restaurantId: string;
  historicalData: DailyMetrics[]; // Past 90 days
  dateToForecast: Date;
  specialEvents?: {
    date: Date;
    name: string;
    expectedImpact: 'high' | 'medium' | 'low';
  }[];
}

export function calculateForecast(input: ForecastingInput): ForecastingMetrics {
  // TODO: Implement ML model
  // For now, return stub

  return {
    restaurantId: input.restaurantId,
    forecastDate: input.dateToForecast,
    predictedOrders: 50,
    predictedRevenue: new Decimal('1500'),
    predictedCustomers: 40,
    confidence: new Decimal('0.7'),
    confidenceInterval: {
      lower: new Decimal('1200'),
      upper: new Decimal('1800'),
    },
    dayOfWeek: input.dateToForecast.toLocaleDateString('en-US', {
      weekday: 'long',
    }),
    season: 'summer',
    hasHoliday: false,
    recommendations: [
      'Increase fries preparation (trending up)',
      'Staff more fryers (peak time expected)',
    ],
    recordedAt: new Date(),
  };
}
