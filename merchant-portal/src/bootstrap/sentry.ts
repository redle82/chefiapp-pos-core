import * as Sentry from "@sentry/react";

const DEFAULT_SENTRY_DSN =
  "https://c507891630be22946aae6f4dc35daa2b@o4509651128942592.ingest.us.sentry.io/4510930062475264";

// Sentry v8+ removed the top-level metrics namespace.
// Use generic function signatures so the file compiles regardless of Sentry version.
type MetricFn = (name: string, value?: number, data?: Record<string, unknown>) => void;

export interface SafeMetrics {
  increment: MetricFn;
  distribution: MetricFn;
  gauge: MetricFn;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SentryMetricsLike = Record<string, any> | undefined;

interface SentryLike {
  getClient(): unknown;
  init(options: Record<string, unknown>): void;
  browserTracingIntegration(): unknown;
  replayIntegration(): unknown;
  metrics?: SentryMetricsLike;
}

export function shouldInitSentry(options: {
  mode: string;
  isElectronRuntime: boolean;
}): boolean {
  return options.mode === "production" && !options.isElectronRuntime;
}

export function initAppSentry(options: {
  mode: string;
  isElectronRuntime: boolean;
  sentry?: SentryLike;
  log?: Pick<Console, "log">;
}): void {
  const { mode, isElectronRuntime, sentry = Sentry, log = console } = options;

  if (!shouldInitSentry({ mode, isElectronRuntime }) || sentry.getClient()) {
    log.log(
      "[ChefIApp] Sentry init skipped (non-production or Electron runtime).",
    );
    return;
  }

  sentry.init({
    dsn: DEFAULT_SENTRY_DSN,
    environment: mode === "production" ? "production" : "development",
    release: import.meta.env.VITE_SENTRY_RELEASE || `merchant-portal@${mode}`,
    sendDefaultPii: true,
    tracesSampleRate: mode === "production" ? 0.2 : 1.0,
    replaysSessionSampleRate: mode === "production" ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,
    integrations:
      mode === "production"
        ? [sentry.browserTracingIntegration(), sentry.replayIntegration()]
        : [],
  });
}

export function createSafeMetrics(
  sentry: { metrics?: SentryMetricsLike } = Sentry as { metrics?: SentryMetricsLike },
): SafeMetrics {
  return {
    increment:
      typeof sentry.metrics?.increment === "function"
        ? sentry.metrics.increment.bind(sentry.metrics)
        : () => {},
    distribution:
      typeof sentry.metrics?.distribution === "function"
        ? sentry.metrics.distribution.bind(sentry.metrics)
        : () => {},
    gauge:
      typeof sentry.metrics?.gauge === "function"
        ? sentry.metrics.gauge.bind(sentry.metrics)
        : () => {},
  };
}
