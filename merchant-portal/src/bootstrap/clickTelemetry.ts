import type { SafeMetrics } from "./sentry";

interface ClickWindow {
  location: {
    pathname: string;
  };
}

interface ClickDocument {
  addEventListener(event: "click", listener: (event: Event) => void): void;
}

export function initClickTelemetry(options: {
  metrics: SafeMetrics;
  windowObj?: ClickWindow | undefined;
  documentObj?: ClickDocument | undefined;
}): void {
  const {
    metrics,
    windowObj = globalThis.window,
    documentObj = globalThis.document,
  } = options;

  if (!windowObj || !documentObj) return;

  documentObj.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    if (
      tag === "button" ||
      tag === "a" ||
      target?.closest("button") ||
      target?.closest("a")
    ) {
      const label =
        target?.textContent?.trim().slice(0, 30) ||
        target?.getAttribute("aria-label") ||
        "unknown";

      metrics.increment("ui.button_click", 1, {
        tags: {
          element: tag,
          label,
          route: windowObj.location.pathname,
        },
      });
    }
  });
}
