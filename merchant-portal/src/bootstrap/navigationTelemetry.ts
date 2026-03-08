import type { SafeMetrics } from "./sentry";

interface NavigationWindow {
  location: {
    pathname: string;
  };
  addEventListener(event: "popstate", listener: () => void): void;
}

interface NavigationHistory {
  pushState: History["pushState"];
}

export function initNavigationTelemetry(options: {
  metrics: SafeMetrics;
  isElectronRuntime: boolean;
  windowObj?: NavigationWindow | undefined;
  historyObj?: NavigationHistory | undefined;
}): void {
  const {
    metrics,
    isElectronRuntime,
    windowObj = globalThis.window,
    historyObj = globalThis.history,
  } = options;

  if (!windowObj || !historyObj || isElectronRuntime) return;

  let lastPath = windowObj.location.pathname;
  const originalPushState = historyObj.pushState.bind(historyObj);

  historyObj.pushState = (...args: Parameters<History["pushState"]>) => {
    originalPushState(...args);
    const nextPath = windowObj.location.pathname;
    if (nextPath !== lastPath) {
      metrics.increment("navigation.page_view", 1, {
        tags: { from: lastPath, to: nextPath },
      });
      lastPath = nextPath;
    }
  };

  windowObj.addEventListener("popstate", () => {
    const nextPath = windowObj.location.pathname;
    if (nextPath !== lastPath) {
      metrics.increment("navigation.page_view", 1, {
        tags: { from: lastPath, to: nextPath },
      });
      lastPath = nextPath;
    }
  });
}
