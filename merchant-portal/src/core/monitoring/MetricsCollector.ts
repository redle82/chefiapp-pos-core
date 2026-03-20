/**
 * MetricsCollector — Lightweight in-memory metrics for browser-based observability
 *
 * Tracks counters, gauges, and timings. No external dependencies.
 * Auto-flushes structured JSON to console.info every 5 minutes for log aggregation.
 *
 * Key metrics:
 *   order.created, order.paid, order.cancelled
 *   payment.success, payment.failed, payment.refunded
 *   sync.push, sync.pull, sync.conflict, sync.queue_length
 *   printer.success, printer.failed
 *   api.latency, api.error
 *   kds.order_received, kds.order_completed, kds.avg_prep_time
 */

export interface MetricEntry {
  type: "counter" | "gauge" | "timing";
  metric: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: number;
}

interface TimingSummary {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
}

const MAX_TIMING_SAMPLES = 500;
const FLUSH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

class MetricsCollectorService {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private timings = new Map<string, number[]>();
  private tags = new Map<string, Record<string, string>>();
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private lastFlushAt: number = Date.now();

  constructor() {
    if (typeof window !== "undefined") {
      this.startAutoFlush();
    }
  }

  /** Build a composite key from metric name + tags for internal tracking. */
  private key(metric: string, metricTags?: Record<string, string>): string {
    if (!metricTags || Object.keys(metricTags).length === 0) return metric;
    const sorted = Object.entries(metricTags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    return `${metric}{${sorted}}`;
  }

  /**
   * Increment a counter metric.
   * @example MetricsCollector.increment("order.created", { type: "dine_in" })
   */
  increment(metric: string, metricTags?: Record<string, string>): void {
    const k = this.key(metric, metricTags);
    this.counters.set(k, (this.counters.get(k) ?? 0) + 1);
    if (metricTags) this.tags.set(k, metricTags);
  }

  /**
   * Set a gauge to a specific value.
   * @example MetricsCollector.gauge("sync.queue_length", 12)
   */
  gauge(metric: string, value: number, metricTags?: Record<string, string>): void {
    const k = this.key(metric, metricTags);
    this.gauges.set(k, value);
    if (metricTags) this.tags.set(k, metricTags);
  }

  /**
   * Record a timing measurement in milliseconds.
   * @example MetricsCollector.timing("api.latency", 142, { endpoint: "orders" })
   */
  timing(metric: string, durationMs: number, metricTags?: Record<string, string>): void {
    const k = this.key(metric, metricTags);
    const samples = this.timings.get(k) ?? [];
    samples.push(durationMs);

    // Evict oldest samples to bound memory
    while (samples.length > MAX_TIMING_SAMPLES) {
      samples.shift();
    }
    this.timings.set(k, samples);
    if (metricTags) this.tags.set(k, metricTags);
  }

  /**
   * Return all current metrics as a structured JSON snapshot.
   */
  getMetrics(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    timings: Record<string, TimingSummary>;
    collectedAt: string;
    flushIntervalMs: number;
  } {
    const timingSummaries: Record<string, TimingSummary> = {};
    for (const [k, samples] of this.timings.entries()) {
      if (samples.length === 0) continue;
      const sorted = [...samples].sort((a, b) => a - b);
      timingSummaries[k] = {
        count: sorted.length,
        sum: sorted.reduce((a, b) => a + b, 0),
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
      };
    }

    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      timings: timingSummaries,
      collectedAt: new Date().toISOString(),
      flushIntervalMs: FLUSH_INTERVAL_MS,
    };
  }

  /**
   * Reset all metrics. Useful after flush or for testing.
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.timings.clear();
    this.tags.clear();
  }

  /**
   * Flush metrics to console.info as structured JSON.
   */
  flush(): void {
    const metrics = this.getMetrics();
    const hasData =
      Object.keys(metrics.counters).length > 0 ||
      Object.keys(metrics.gauges).length > 0 ||
      Object.keys(metrics.timings).length > 0;

    if (!hasData) return;

    // eslint-disable-next-line no-console
    console.info(
      JSON.stringify({
        type: "metrics_flush",
        timestamp: new Date().toISOString(),
        sinceLastFlushMs: Date.now() - this.lastFlushAt,
        ...metrics,
      }),
    );

    this.lastFlushAt = Date.now();
  }

  private startAutoFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => {
      this.flush();
    }, FLUSH_INTERVAL_MS);
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

/** Singleton metrics collector instance. */
export const MetricsCollector = new MetricsCollectorService();
