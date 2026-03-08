import type { SafeMetrics } from "./sentry";

interface NetworkWindow {
  fetch: typeof fetch;
  location: {
    origin: string;
  };
}

export function initFetchTelemetry(options: {
  metrics: SafeMetrics;
  windowObj?: NetworkWindow | undefined;
  performanceObj?: Performance | undefined;
}): void {
  const {
    metrics,
    windowObj = globalThis.window,
    performanceObj = globalThis.performance,
  } = options;

  if (!windowObj || !performanceObj) return;

  const originalFetch = windowObj.fetch.bind(windowObj);
  windowObj.fetch = async (...args: Parameters<typeof fetch>) => {
    const start = performanceObj.now();

    try {
      const response = await originalFetch(...args);
      const duration = performanceObj.now() - start;
      const url =
        typeof args[0] === "string" ? args[0] : (args[0] as Request).url;
      const path = new URL(url, windowObj.location.origin).pathname;

      metrics.distribution("http.request_duration", duration, {
        unit: "millisecond",
        tags: {
          method: (args[1]?.method || "GET").toUpperCase(),
          status: String(response.status),
          path: path.length > 50 ? path.slice(0, 50) : path,
        },
      });

      if (!response.ok) {
        metrics.increment("http.error", 1, {
          tags: { status: String(response.status), path },
        });
      }

      return response;
    } catch (error) {
      const duration = performanceObj.now() - start;
      metrics.distribution("http.request_duration", duration, {
        unit: "millisecond",
        tags: {
          method: (args[1]?.method || "GET").toUpperCase(),
          status: "network_error",
        },
      });
      metrics.increment("http.error", 1, {
        tags: { status: "network_error" },
      });
      throw error;
    }
  };
}
