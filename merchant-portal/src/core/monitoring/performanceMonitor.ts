/**
 * Performance Monitor
 *
 * Monitora métricas de performance do sistema.
 */

import { isDevStableMode } from "../runtime/devStableMode";
import { getTabIsolated } from "../storage/TabIsolatedStorage";
import { supabase } from "../supabase";

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private remoteFlushDisabled: boolean = false;
  private readonly BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL_MS = 60000; // 1 minute

  constructor() {
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      this.initObservers();
      // DEV_STABLE_MODE: do not start remote flush loop
      if (!isDevStableMode()) {
        this.startFlushLoop();
      }
    }
  }

  /**
   * Inicializa observers de performance
   */
  private initObservers() {
    // Web Vitals
    try {
      const vitalsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: entry.name,
            value: entry.startTime,
            unit: "ms",
            timestamp: new Date().toISOString(),
          });
        }
      });

      vitalsObserver.observe({ entryTypes: ["measure", "navigation"] });
      this.observers.push(vitalsObserver);
    } catch (err) {
      console.warn("[PerformanceMonitor] Failed to init observers:", err);
    }
  }

  /**
   * Start automatic flushing loop
   */
  private startFlushLoop() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    this.flushInterval = setInterval(() => {
      this.flushMetricsToSupabase();
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * Registra uma métrica
   */
  recordMetric(metric: PerformanceMetric) {
    // SECURITY: never print/record URLs containing OAuth tokens (hash/query) in DEV logs.
    const safeName = (() => {
      const name = String(metric.name || "");
      if (!name.startsWith("http")) return name;
      try {
        const u = new URL(name);
        // strip query + hash completely
        return `${u.origin}${u.pathname}`;
      } catch {
        // fallback: drop anything after '?' or '#'
        return name.split("#")[0].split("?")[0];
      }
    })();

    this.metrics.push({ ...metric, name: safeName });

    // Debug log locally
    if (import.meta.env.DEV) {
      console.debug(`[Perf] ${safeName}: ${metric.value}${metric.unit}`);
    }

    // Flush if buffer full
    if (this.metrics.length >= this.BATCH_SIZE) {
      this.flushMetricsToSupabase();
    }
  }

  /**
   * Aggregates and flushes metrics to Supabase
   */
  private async flushMetricsToSupabase() {
    // DEV_STABLE_MODE: zero remote flush attempts
    if (isDevStableMode()) return;
    if (this.remoteFlushDisabled) return;
    if (this.metrics.length === 0) return;

    const metricsToFlush = [...this.metrics];
    this.metrics = []; // Clear buffer immediately

    try {
      // Aggregate metrics by name
      const aggregated: Record<
        string,
        { count: number; avg: number; max: number; min: number }
      > = {};

      metricsToFlush.forEach((m) => {
        if (!aggregated[m.name]) {
          aggregated[m.name] = {
            count: 0,
            avg: 0,
            max: -Infinity,
            min: Infinity,
          };
        }
        const agg = aggregated[m.name];
        agg.count++;
        agg.avg += m.value;
        agg.max = Math.max(agg.max, m.value);
        agg.min = Math.min(agg.min, m.value);
      });

      // Calculate final averages
      Object.keys(aggregated).forEach((key) => {
        aggregated[key].avg = aggregated[key].avg / aggregated[key].count;
      });

      // Log as "Heartbeat" via Logger (which sends to app_logs if warn/error, or we force it here)
      // Since Logger.info doesn't persist by default, we'll manually insert into app_logs for telemetry
      // OR we use Logger.warn if we consider performance data critical enough, but that's abusing levels.
      // Better: Direct insert to a lightweight metrics table OR leverage app_logs with a specific level/flag.
      // Let's use app_logs 'info' level but direct insert here to bypass Logger's filter for now,
      // OR assume we want to audit this.
      // Decision: Use Logger.info for local visibility, but insert directly to app_logs for persistence to save quota/noise in main logger flow if needed.
      // Actually, let's just use `Logger.info` and IF we want to persist info, we change Logger config.
      // BUT the requirement is to PERSIST. So direct Supabase insert for "monitoring heartbeats" is cleaner.

      const payload = {
        type: "performance_heartbeat",
        timestamp: new Date().toISOString(),
        metrics: aggregated,
        sample_size: metricsToFlush.length,
      };

      // IMPORTANT: avoid 409 storms by using idempotency_key + upsert(ignoreDuplicates).
      // If the DB schema doesn't have idempotency_key yet, fail closed (no crash, no loop).
      const restaurantId = getTabIsolated("chefiapp_restaurant_id") || null;
      const minuteBucket = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
      const idempotencyKey = `perf:${restaurantId || "none"}:${minuteBucket}`;

      const { error } = await supabase.from("app_logs").upsert(
        {
          level: "info",
          message: "Performance Heartbeat",
          details: payload,
          restaurant_id: restaurantId,
          created_at: new Date().toISOString(),
          idempotency_key: idempotencyKey,
        } as any,
        { onConflict: "idempotency_key", ignoreDuplicates: true } as any,
      );

      if (error) {
        // If idempotency_key doesn't exist / schema mismatch, DISABLE remote flush to stop interval spam.
        const msg = String((error as any)?.message || "");
        const status = (error as any)?.status;

        if (
          status === 400 ||
          msg.toLowerCase().includes("idempotency") ||
          msg.toLowerCase().includes("on_conflict")
        ) {
          this.remoteFlushDisabled = true;
          if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
          }
          // Don't keep retrying every minute; require migration to re-enable.
          console.warn(
            "[PerformanceMonitor] Remote flush disabled (app_logs schema mismatch). Apply migration to enable.",
          );
          return;
        }

        // Other non-fatal errors: avoid noise
        if (status === 409) return;
        console.warn("[PerformanceMonitor] Flush skipped (non-fatal):", msg);
      }
    } catch (err) {
      // Network/Supabase failures can happen (offline). Don't spam; just drop this batch.
      // If it's a schema mismatch, disable remote flush to stop interval spam.
      const status = (err as any)?.status;
      const msg = String((err as any)?.message || "");
      if (
        status === 400 ||
        msg.toLowerCase().includes("idempotency") ||
        msg.toLowerCase().includes("on_conflict")
      ) {
        this.remoteFlushDisabled = true;
        if (this.flushInterval) {
          clearInterval(this.flushInterval);
          this.flushInterval = null;
        }
        console.warn(
          "[PerformanceMonitor] Remote flush disabled (app_logs schema mismatch). Apply migration to enable.",
        );
        return;
      }
      console.warn(
        "[PerformanceMonitor] Failed to flush (non-fatal):",
        msg || err,
      );
    }
  }

  /**
   * Mede o tempo de execução de uma função
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric({
        name,
        value: duration,
        unit: "ms",
        timestamp: new Date().toISOString(),
      });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric({
        name: `${name}_error`,
        value: duration,
        unit: "ms",
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Obtém métricas recentes
   */
  getMetrics(limit: number = 50): PerformanceMetric[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Obtém métricas por nome
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Limpa observers
   */
  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    if (this.flushInterval) clearInterval(this.flushInterval);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
