/**
 * Phase 3 — Predictive Analytics & AI
 *
 * Forecasts demand (orders, revenue), predicts churn, and provides
 * intelligent recommendations based on historical data.
 *
 * Core insight: More data = better predictions = better decisions.
 */

import { UUID, ISOTimestamp, Decimal } from '../shared/types';

/**
 * Demand Forecast: Predicted orders & revenue
 */
export interface DemandForecast {
  restaurant_id: UUID;
  forecast_date: string; // YYYY-MM-DD
  hour: number; // 0–23
  predicted_orders: number;
  predicted_revenue: Decimal;
  confidence: Decimal; // 0–1
  factors: DemandFactors;
  created_at: ISOTimestamp;
}

export interface DemandFactors {
  day_of_week: number; // 0–6 (Mon–Sun)
  is_weekend: boolean;
  is_holiday: boolean;
  is_peak_hours: boolean; // Lunch/dinner rush
  weather?: WeatherFactor;
  local_events?: string[]; // e.g., "sports game", "concert"
  seasonality?: number; // -1 to +1, seasonal trend
  historical_average: Decimal;
  trend: Decimal; // -1 to +1, recent trend (up/flat/down)
}

export interface WeatherFactor {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  impact_on_orders: Decimal; // -0.5 to +0.5, how much does weather affect demand?
}

/**
 * Customer Lifetime Value (CLV): How valuable is a customer?
 */
export interface CustomerLifetimeValue {
  customer_id: UUID;
  restaurant_id: UUID;
  total_spend: Decimal;
  order_count: number;
  average_order_value: Decimal;
  frequency: number; // orders per month
  retention_probability: Decimal; // 0–1, will they order again?
  churn_risk: ChurnRisk;
  last_order_date: ISOTimestamp;
  days_since_last_order: number;
  predicted_clv: Decimal; // 12-month value
  created_at: ISOTimestamp;
}

export enum ChurnRisk {
  LOW = 'low', // Unlikely to stop ordering
  MEDIUM = 'medium',
  HIGH = 'high', // Probably will stop soon
}

/**
 * Menu Item Profitability: Which items are actually profitable?
 */
export interface MenuItemProfitability {
  restaurant_id: UUID;
  menu_item_id: UUID;
  item_name: string;
  price: Decimal;
  ingredient_cost: Decimal;
  gross_margin: Decimal; // price - cost
  gross_margin_percent: Decimal; // (gross_margin / price) * 100
  units_sold_month: number;
  total_revenue_month: Decimal;
  total_cost_month: Decimal;
  total_profit_month: Decimal;
  ranking: 'high_profit' | 'medium_profit' | 'low_profit' | 'loss_leader';
  trend: 'increasing' | 'flat' | 'decreasing';
  recommendation?: string; // e.g., "Increase price", "Reduce portion"
  created_at: ISOTimestamp;
}

/**
 * Competitor Price Monitoring: How do we compare?
 */
export interface CompetitorPrice {
  restaurant_id: UUID;
  competitor_id: UUID; // Other restaurant on marketplace
  competitor_name: string;
  item_name: string;
  their_price: Decimal;
  our_price: Decimal;
  price_difference: Decimal; // +10 if we're higher, -10 if lower
  last_updated: ISOTimestamp;
}

/**
 * Trend Detection: What's emerging in the market?
 */
export interface TrendDetection {
  restaurant_id: UUID;
  trend_type: TrendType;
  trend_name: string; // e.g., "Vegan Substitutes", "Ghost Orders"
  confidence: Decimal; // 0–1
  growth_rate: Decimal; // orders increasing by X% per week
  affected_items: UUID[];
  recommendation?: string;
  discovered_at: ISOTimestamp;
}

export enum TrendType {
  EMERGING = 'emerging', // New trend appearing
  GROWING = 'growing', // Trend accelerating
  DECLINING = 'declining', // Trend slowing
  SEASONAL = 'seasonal', // Seasonal pattern detected
}

/**
 * Fraud Detection: Suspicious order patterns
 */
export interface FraudSignal {
  id: UUID;
  restaurant_id: UUID;
  order_id?: UUID;
  signal_type: FraudSignalType;
  risk_score: Decimal; // 0–1, how risky?
  factors: string[]; // What triggered this?
  action_taken?: FraudAction;
  created_at: ISOTimestamp;
}

export enum FraudSignalType {
  CHARGEBACK_PATTERN = 'chargeback_pattern', // Customer disputes multiple orders
  CARD_TESTING = 'card_testing', // Multiple small orders with different cards
  GEOGRAPHIC_ANOMALY = 'geographic_anomaly', // Order from unusual location
  VELOCITY_ABUSE = 'velocity_abuse', // Too many orders too quickly
  REFUND_ABUSE = 'refund_abuse', // Requesting refunds constantly
}

export enum FraudAction {
  BLOCK_ORDER = 'block_order',
  REQUIRE_VERIFICATION = 'require_verification',
  ALERT_MANAGER = 'alert_manager',
  BAN_CUSTOMER = 'ban_customer',
}

/**
 * AI Recommendation: ChefIApp suggests an action
 */
export interface AIRecommendation {
  id: UUID;
  restaurant_id: UUID;
  recommendation_type: RecommendationType;
  title: string;
  description: string;
  confidence: Decimal; // 0–1, how confident is this recommendation?
  expected_impact: {
    metric: string; // 'revenue', 'efficiency', 'retention'
    expected_change: Decimal; // +10 for +10%, -5 for -5%
  };
  action_required?: {
    type: string; // 'price_adjustment', 'menu_change', etc.
    parameters: Record<string, any>;
  };
  expires_at: ISOTimestamp;
  accepted?: boolean;
  created_at: ISOTimestamp;
}

export enum RecommendationType {
  PRICE_ADJUSTMENT = 'price_adjustment',
  MENU_CHANGE = 'menu_change',
  PROMOTION = 'promotion',
  STAFFING = 'staffing',
  INVENTORY = 'inventory',
}

/**
 * Analytics Engine Service Interface
 */
export interface AnalyticsEngineService {
  // Demand Forecasting
  forecastDemand(input: ForecastDemandInput): Promise<DemandForecast[]>;
  getDemandForecast(
    restaurantId: UUID,
    date: string,
  ): Promise<DemandForecast[] | null>;

  // Customer Analytics
  calculateCLV(customerId: UUID, restaurantId: UUID): Promise<CustomerLifetimeValue>;
  listCustomersAtRisk(restaurantId: UUID): Promise<CustomerLifetimeValue[]>;
  predictChurn(customerId: UUID): Promise<ChurnPrediction>;

  // Menu Analytics
  analyzeProfitability(restaurantId: UUID): Promise<MenuItemProfitability[]>;
  getMenuInsights(restaurantId: UUID): Promise<MenuInsight[]>;

  // Competitive Intelligence
  monitorCompetitorPrices(restaurantId: UUID): Promise<CompetitorPrice[]>;
  getPriceComparison(restaurantId: UUID, itemName: string): Promise<CompetitorPrice[]>;

  // Trend Detection
  detectTrends(restaurantId: UUID): Promise<TrendDetection[]>;

  // Fraud Detection
  detectFraud(orderId: UUID): Promise<FraudSignal | null>;
  recordChargeback(customerId: UUID, orderId: UUID): Promise<void>;

  // Recommendations
  getRecommendations(restaurantId: UUID): Promise<AIRecommendation[]>;
  acceptRecommendation(recommendationId: UUID): Promise<void>;
}

/**
 * Input/Output Contracts
 */

export interface ForecastDemandInput {
  restaurant_id: UUID;
  forecast_date: string; // YYYY-MM-DD
  include_hours?: number[]; // Specific hours (0–23) or all
}

export interface ChurnPrediction {
  customer_id: UUID;
  churn_probability: Decimal; // 0–1
  churn_risk: ChurnRisk;
  days_since_last_order: number;
  predicted_last_order_date: ISOTimestamp;
  factors: string[]; // What factors suggest churn?
  recommended_action?: string; // e.g., "Send special offer"
}

export interface MenuInsight {
  insight_type: 'high_margin' | 'trending' | 'underperforming' | 'loss_leader';
  items: {
    item_id: UUID;
    name: string;
    metric: Decimal;
  }[];
  recommendation?: string;
}

/**
 * Factory Functions
 */

export function createDemandForecast(
  restaurantId: UUID,
  date: string,
  hour: number,
  predictedOrders: number,
  predictedRevenue: Decimal,
  confidence: Decimal = new Decimal(0.85),
): DemandForecast {
  const forecastDate = new Date(date);
  const dayOfWeek = forecastDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isPeakHours = (hour >= 12 && hour <= 13) || (hour >= 19 && hour <= 20);

  return {
    restaurant_id: restaurantId,
    forecast_date: date,
    hour,
    predicted_orders: predictedOrders,
    predicted_revenue: predictedRevenue,
    confidence,
    factors: {
      day_of_week: dayOfWeek,
      is_weekend: isWeekend,
      is_holiday: false, // TODO: Check holiday calendar
      is_peak_hours: isPeakHours,
      historical_average: new Decimal(predictedOrders),
      trend: new Decimal(0),
    },
    created_at: new Date().toISOString() as ISOTimestamp,
  };
}

export function calculateGrossMarginPercent(
  price: Decimal,
  cost: Decimal,
): Decimal {
  if (price.equals(0)) return new Decimal(0);
  return price.minus(cost).dividedBy(price).times(100);
}

export function assessChurnRisk(daysSinceLastOrder: number): ChurnRisk {
  if (daysSinceLastOrder < 30) return ChurnRisk.LOW;
  if (daysSinceLastOrder < 60) return ChurnRisk.MEDIUM;
  return ChurnRisk.HIGH;
}

export function calculateFraudRiskScore(
  chargebackCount: number,
  orderVelocity: number,
  geographicAnomalies: number,
): Decimal {
  let score = new Decimal(0);
  score = score.plus(chargebackCount * 0.3); // 30% weight to chargebacks
  score = score.plus(orderVelocity * 0.4); // 40% weight to velocity
  score = score.plus(geographicAnomalies * 0.3); // 30% weight to anomalies
  return Decimal.min(score, new Decimal(1)); // Cap at 1.0
}
