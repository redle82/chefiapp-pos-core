/**
 * AlertRules — Operational alert conditions with cooldown and notification
 *
 * Defines conditions that trigger alerts when system metrics exceed thresholds.
 * Includes 30-minute cooldown per condition to avoid alert fatigue.
 */

import { Logger } from "../logger";
import { MetricsCollector } from "./MetricsCollector";

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  /** Evaluate the rule; returns true if the condition is violated. */
  evaluate: () => boolean;
  severity: "warning" | "critical";
}

export interface TriggeredAlert {
  ruleId: string;
  ruleName: string;
  severity: "warning" | "critical";
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

class AlertRulesEngine {
  private rules: AlertRule[] = [];
  private lastTriggered = new Map<string, number>();
  private alertHistory: TriggeredAlert[] = [];
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.registerDefaultRules();
  }

  /**
   * Register the default set of operational alert rules.
   */
  private registerDefaultRules(): void {
    this.rules = [
      {
        id: "payment_failure_rate",
        name: "High Payment Failure Rate",
        description: "Payment failure rate > 10% in last 15 minutes",
        severity: "critical",
        evaluate: () => {
          const metrics = MetricsCollector.getMetrics();
          const successes = metrics.counters["payment.success"] ?? 0;
          const failures = metrics.counters["payment.failed"] ?? 0;
          const total = successes + failures;
          if (total < 5) return false; // Not enough data
          return failures / total > 0.1;
        },
      },
      {
        id: "sync_queue_stuck",
        name: "Sync Queue Backlog",
        description: "Sync queue length > 50 items stuck",
        severity: "critical",
        evaluate: () => {
          const metrics = MetricsCollector.getMetrics();
          const queueLength = metrics.gauges["sync.queue_length"] ?? 0;
          return queueLength > 50;
        },
      },
      {
        id: "printer_consecutive_failures",
        name: "Printer Consecutive Failures",
        description: "More than 3 consecutive printer failures",
        severity: "warning",
        evaluate: () => {
          const metrics = MetricsCollector.getMetrics();
          const failures = metrics.counters["printer.failed"] ?? 0;
          const successes = metrics.counters["printer.success"] ?? 0;
          // Simple heuristic: if failures > 3 and recent failures outnumber successes
          return failures > 3 && failures > successes;
        },
      },
      {
        id: "api_error_rate",
        name: "High API Error Rate",
        description: "API error rate > 5% in last 5 minutes",
        severity: "critical",
        evaluate: () => {
          const metrics = MetricsCollector.getMetrics();
          const errors = metrics.counters["api.error"] ?? 0;
          const timings = metrics.timings["api.latency"];
          const totalCalls = timings?.count ?? 0;
          if (totalCalls < 10) return false; // Not enough data
          return errors / totalCalls > 0.05;
        },
      },
      {
        id: "kds_no_events",
        name: "KDS No Events",
        description: "No KDS events for 10+ minutes during service",
        severity: "warning",
        evaluate: () => {
          // Check if KDS received any events recently via gauge
          const metrics = MetricsCollector.getMetrics();
          const received = metrics.counters["kds.order_received"] ?? 0;
          // This rule only makes sense if there were orders but KDS got none
          const ordersCreated = metrics.counters["order.created"] ?? 0;
          return ordersCreated > 5 && received === 0;
        },
      },
    ];
  }

  /**
   * Add a custom alert rule.
   */
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  /**
   * Evaluate all rules and return newly triggered alerts.
   * Respects cooldown: won't re-trigger the same rule within 30 minutes.
   */
  evaluate(): TriggeredAlert[] {
    const triggered: TriggeredAlert[] = [];
    const now = Date.now();

    for (const rule of this.rules) {
      // Check cooldown
      const lastTime = this.lastTriggered.get(rule.id) ?? 0;
      if (now - lastTime < COOLDOWN_MS) continue;

      try {
        if (rule.evaluate()) {
          const alert: TriggeredAlert = {
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            message: rule.description,
            timestamp: new Date().toISOString(),
          };

          triggered.push(alert);
          this.alertHistory.unshift(alert);
          this.lastTriggered.set(rule.id, now);

          // Log the alert
          if (rule.severity === "critical") {
            Logger.error(`[AlertRules] CRITICAL: ${rule.name}`, undefined, {
              ruleId: rule.id,
              description: rule.description,
            });
          } else {
            Logger.warn(`[AlertRules] WARNING: ${rule.name}`, {
              ruleId: rule.id,
              description: rule.description,
            });
          }

          // Browser notification for manager (if permitted)
          this.sendNotification(alert);
        }
      } catch (err) {
        Logger.warn(`[AlertRules] Rule evaluation failed: ${rule.id}`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Trim history
    while (this.alertHistory.length > 200) {
      this.alertHistory.pop();
    }

    return triggered;
  }

  /**
   * Get alert history.
   */
  getHistory(limit = 50): TriggeredAlert[] {
    return this.alertHistory.slice(0, limit);
  }

  /**
   * Get all registered rules.
   */
  getRules(): AlertRule[] {
    return [...this.rules];
  }

  /**
   * Start periodic evaluation (every 60 seconds).
   */
  start(): void {
    if (this.checkInterval) return;
    this.checkInterval = setInterval(() => {
      this.evaluate();
    }, 60_000);
  }

  /**
   * Stop periodic evaluation.
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Send browser push notification if Notification API is available and permitted.
   */
  private sendNotification(alert: TriggeredAlert): void {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {
      new Notification(`ChefIApp Alert: ${alert.ruleName}`, {
        body: alert.message,
        icon: "/favicon.ico",
        tag: alert.ruleId, // Prevents duplicate notifications
      });
    } catch {
      // Notification API not available in this context (e.g., insecure origin)
    }
  }
}

/** Singleton alert rules engine. */
export const AlertRulesEngine = new AlertRulesEngine();
