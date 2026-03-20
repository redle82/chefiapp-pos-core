/**
 * ErrorBoundaryMonitor — Catch, categorize, and rate-limit unhandled errors
 *
 * Provides structured error reporting with breadcrumb trail.
 * Integrates with Sentry (if configured) or falls back to console.
 */

import { Logger } from "../logger";
import { captureException } from "../logger/transports/SentryTransport";

export type ErrorCategory = "network" | "auth" | "payment" | "sync" | "render" | "unknown";

export interface ErrorReport {
  id: string;
  category: ErrorCategory;
  message: string;
  stack?: string;
  context: Record<string, unknown>;
  breadcrumbs: Breadcrumb[];
  timestamp: string;
  count: number;
}

export interface Breadcrumb {
  action: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

const MAX_BREADCRUMBS = 20;
const MAX_REPORTS = 100;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_SAME_ERROR_PER_WINDOW = 5;

class ErrorBoundaryMonitorService {
  private breadcrumbs: Breadcrumb[] = [];
  private reports: ErrorReport[] = [];
  private errorCounts = new Map<string, { count: number; windowStart: number }>();
  private installed = false;

  /**
   * Record a user action as a breadcrumb.
   * The last 20 actions are kept to provide context when an error occurs.
   */
  addBreadcrumb(action: string, data?: Record<string, unknown>): void {
    this.breadcrumbs.push({
      action,
      timestamp: new Date().toISOString(),
      data,
    });
    while (this.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Report an error with structured metadata.
   * Rate-limited: same error fingerprint won't flood logs more than 5 times per minute.
   */
  reportError(error: unknown, context: Record<string, unknown> = {}): ErrorReport | null {
    const err = error instanceof Error ? error : new Error(String(error));
    const category = this.categorize(err);
    const fingerprint = `${category}:${err.message}`;

    // Rate limiting
    if (this.isRateLimited(fingerprint)) {
      return null;
    }

    const report: ErrorReport = {
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      category,
      message: err.message,
      stack: err.stack,
      context,
      breadcrumbs: [...this.breadcrumbs],
      timestamp: new Date().toISOString(),
      count: 1,
    };

    this.reports.unshift(report);
    while (this.reports.length > MAX_REPORTS) {
      this.reports.pop();
    }

    // Send to Sentry if available, otherwise console fallback
    try {
      captureException(err, { category, ...context });
    } catch {
      // Sentry not configured; already logged by Logger below
    }

    Logger.error(`[ErrorBoundary] ${category}: ${err.message}`, err, {
      category,
      reportId: report.id,
      ...context,
    });

    return report;
  }

  /**
   * Get recent error reports.
   */
  getReports(limit = 20): ErrorReport[] {
    return this.reports.slice(0, limit);
  }

  /**
   * Get error count by category in the last N minutes.
   */
  getCountByCategory(minutes = 60): Record<ErrorCategory, number> {
    const cutoff = Date.now() - minutes * 60_000;
    const counts: Record<ErrorCategory, number> = {
      network: 0,
      auth: 0,
      payment: 0,
      sync: 0,
      render: 0,
      unknown: 0,
    };

    for (const report of this.reports) {
      if (new Date(report.timestamp).getTime() >= cutoff) {
        counts[report.category]++;
      }
    }
    return counts;
  }

  /**
   * Install global error handlers (window.onerror, unhandledrejection).
   * Safe to call multiple times; only installs once.
   */
  install(): void {
    if (this.installed || typeof window === "undefined") return;
    this.installed = true;

    window.addEventListener("error", (event) => {
      this.reportError(event.error ?? new Error(event.message), {
        source: "window.onerror",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));
      this.reportError(error, { source: "unhandledrejection" });
    });
  }

  /**
   * Categorize an error based on message patterns.
   */
  private categorize(error: Error): ErrorCategory {
    const msg = (error.message || "").toLowerCase();
    const stack = (error.stack || "").toLowerCase();

    if (
      msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("timeout") ||
      msg.includes("cors") ||
      msg.includes("econnrefused") ||
      msg.includes("failed to fetch")
    ) {
      return "network";
    }

    if (
      msg.includes("auth") ||
      msg.includes("unauthorized") ||
      msg.includes("401") ||
      msg.includes("session") ||
      msg.includes("token")
    ) {
      return "auth";
    }

    if (
      msg.includes("payment") ||
      msg.includes("stripe") ||
      msg.includes("charge") ||
      msg.includes("refund")
    ) {
      return "payment";
    }

    if (
      msg.includes("sync") ||
      msg.includes("offline") ||
      msg.includes("queue") ||
      msg.includes("indexeddb")
    ) {
      return "sync";
    }

    if (
      msg.includes("render") ||
      msg.includes("react") ||
      msg.includes("component") ||
      stack.includes("react-dom") ||
      stack.includes("renderwithhooks")
    ) {
      return "render";
    }

    return "unknown";
  }

  /**
   * Rate-limit check: returns true if this error fingerprint has been reported
   * too many times within the current window.
   */
  private isRateLimited(fingerprint: string): boolean {
    const now = Date.now();
    const entry = this.errorCounts.get(fingerprint);

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      this.errorCounts.set(fingerprint, { count: 1, windowStart: now });
      return false;
    }

    entry.count++;
    if (entry.count > MAX_SAME_ERROR_PER_WINDOW) {
      return true;
    }
    return false;
  }
}

/** Singleton error boundary monitor. */
export const ErrorBoundaryMonitor = new ErrorBoundaryMonitorService();
