// ============================================================================
// monitoring.ts - Monitoring & Metrics Service for Webhooks
// Purpose: Expose webhook health, performance, and failure metrics
// ============================================================================

import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

interface WebhookMetrics {
  delivery_count: number;
  success_count: number;
  failed_count: number;
  success_rate_percent: number;
  avg_delivery_time_ms: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  oldest_pending_delivery_at: string | null;
  pending_count: number;
}

interface FailedDelivery {
  delivery_id: string;
  restaurant_id: string;
  webhook_url: string;
  status: string;
  attempt_number: number;
  max_attempts: number;
  http_status_code: number;
  error_reason: string;
  created_at: string;
  next_retry_at: string | null;
  hours_since_creation: number;
}

interface PerformanceMetric {
  metric_name: string;
  metric_value: number;
  measurement_unit: string;
  time_window_hours: number;
  calculated_at: string;
}

interface LatencyMetric {
  metric_name: string;
  metric_value: number;
  measurement_unit: string;
  breakdown_hour: string | null;
  sample_count: number;
}

export class MonitoringService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || "http://localhost:3000",
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        "test-key",
    );
  }

  /**
   * Get per-restaurant webhook delivery metrics (success rate, latency, etc.)
   */
  async getRestaurantMetrics(
    restaurantId: string,
    hours: number = 24,
  ): Promise<WebhookMetrics | null> {
    try {
      const { data, error } = await this.supabase.rpc(
        "get_webhook_delivery_metrics",
        {
          p_restaurant_id: restaurantId,
          p_hours: hours,
        },
      );

      if (error) {
        console.error("[MonitoringService] Error fetching metrics:", error);
        return null;
      }

      return data?.[0] || null;
    } catch (err) {
      console.error(
        "[MonitoringService] Exception fetching restaurant metrics:",
        err,
      );
      return null;
    }
  }

  /**
   * Get failed deliveries that require manual intervention
   */
  async getFailedDeliveries(
    maxAgeHours: number = 1,
  ): Promise<FailedDelivery[]> {
    try {
      const { data, error } = await this.supabase.rpc(
        "get_failed_deliveries_alert",
        {
          p_max_age_hours: maxAgeHours,
        },
      );

      if (error) {
        console.error("[MonitoringService] Error fetching alerts:", error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error(
        "[MonitoringService] Exception fetching failed deliveries:",
        err,
      );
      return [];
    }
  }

  /**
   * Get system-wide performance metrics (24h aggregate)
   */
  async getPerformanceMetrics(): Promise<PerformanceMetric[]> {
    try {
      const { data, error } = await this.supabase.rpc(
        "get_webhook_performance_metrics",
      );

      if (error) {
        console.error(
          "[MonitoringService] Error fetching performance metrics:",
          error,
        );
        return [];
      }

      return data || [];
    } catch (err) {
      console.error(
        "[MonitoringService] Exception fetching performance metrics:",
        err,
      );
      return [];
    }
  }

  /**
   * Get payment-to-delivery latency metrics (end-to-end latency)
   */
  async getLatencyMetrics(hours: number = 24): Promise<LatencyMetric[]> {
    try {
      const { data, error } = await this.supabase.rpc(
        "get_payment_to_delivery_latency",
        {
          p_hours: hours,
        },
      );

      if (error) {
        console.error(
          "[MonitoringService] Error fetching latency metrics:",
          error,
        );
        return [];
      }

      return data || [];
    } catch (err) {
      console.error(
        "[MonitoringService] Exception fetching latency metrics:",
        err,
      );
      return [];
    }
  }

  /**
   * Get comprehensive monitoring dashboard data
   */
  async getDashboardSummary(restaurantId?: string) {
    const performance = await this.getPerformanceMetrics();
    const alerts = await this.getFailedDeliveries(1);
    const latency = await this.getLatencyMetrics(24);

    let restaurantMetrics = null;
    if (restaurantId) {
      restaurantMetrics = await this.getRestaurantMetrics(restaurantId, 24);
    }

    return {
      timestamp: new Date().toISOString(),
      system_performance: performance,
      failed_deliveries: alerts,
      latency_metrics: latency,
      restaurant_metrics: restaurantMetrics,
      health_status: this.calculateHealthStatus(performance, alerts, latency),
    };
  }

  /**
   * Calculate overall health status based on metrics
   */
  private calculateHealthStatus(
    performance: PerformanceMetric[],
    alerts: FailedDelivery[],
    latency: LatencyMetric[],
  ) {
    const successRateMetric = performance.find((m) =>
      m.metric_name.includes("success_rate"),
    );
    const successRate = successRateMetric?.metric_value || 0;

    const status =
      successRate >= 99 && alerts.length === 0
        ? "healthy"
        : successRate >= 95 && alerts.length <= 5
        ? "degraded"
        : "critical";

    return {
      status,
      success_rate_percent: successRate,
      active_alerts: alerts.length,
      description:
        status === "healthy"
          ? "All systems operational"
          : status === "degraded"
          ? "Some delivery failures detected"
          : "Critical issues detected - immediate attention required",
    };
  }
}

export default new MonitoringService();
