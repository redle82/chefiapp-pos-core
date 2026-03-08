import type { SafeMetrics } from "./sentry";

type PerformanceObserverCtor = typeof PerformanceObserver;

export function initWebVitals(options: {
  metrics: SafeMetrics;
  windowObj?: Window | undefined;
  performanceObj?: Performance | undefined;
  performanceObserverCtor?: PerformanceObserverCtor | undefined;
  setTimeoutFn?: typeof setTimeout;
}): void {
  const {
    metrics,
    windowObj = globalThis.window,
    performanceObj = globalThis.performance,
    performanceObserverCtor = globalThis.PerformanceObserver,
    setTimeoutFn = globalThis.setTimeout,
  } = options;

  if (!windowObj || !performanceObj || !performanceObserverCtor) return;

  try {
    const lcpObserver = new performanceObserverCtor((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        metrics.distribution("web_vital.lcp", last.startTime, {
          unit: "millisecond",
          tags: { route: windowObj.location.pathname },
        });
      }
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
    // browser may not support
  }

  try {
    const fcpObserver = new performanceObserverCtor((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          metrics.distribution("web_vital.fcp", entry.startTime, {
            unit: "millisecond",
            tags: { route: windowObj.location.pathname },
          });
        }
      }
    });
    fcpObserver.observe({ type: "paint", buffered: true });
  } catch {
    // browser may not support
  }

  try {
    let clsValue = 0;
    const clsObserver = new performanceObserverCtor((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value ?? 0;
        }
      }
      metrics.gauge("web_vital.cls", clsValue, {
        tags: { route: windowObj.location.pathname },
      });
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });
  } catch {
    // browser may not support
  }

  windowObj.addEventListener("load", () => {
    setTimeoutFn(() => {
      const navigation = performanceObj.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      if (!navigation) return;

      metrics.distribution(
        "page.load_time",
        navigation.loadEventEnd - navigation.startTime,
        {
          unit: "millisecond",
          tags: { route: windowObj.location.pathname },
        },
      );
      metrics.distribution(
        "page.dom_interactive",
        navigation.domInteractive - navigation.startTime,
        {
          unit: "millisecond",
          tags: { route: windowObj.location.pathname },
        },
      );
      metrics.distribution(
        "page.ttfb",
        navigation.responseStart - navigation.requestStart,
        {
          unit: "millisecond",
          tags: { route: windowObj.location.pathname },
        },
      );
    }, 0);
  });
}
