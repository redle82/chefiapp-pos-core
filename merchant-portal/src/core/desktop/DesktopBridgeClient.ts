const DEFAULT_BRIDGE_PORT = Number(
  (import.meta.env.VITE_DESKTOP_BRIDGE_PORT ?? "4310").toString(),
);

const LOG_COOLDOWN_MS = 10_000;
const warningLogTimes = new Map<string, number>();

function shouldLogWarning(key: string): boolean {
  const now = Date.now();
  const last = warningLogTimes.get(key) ?? 0;
  if (now - last < LOG_COOLDOWN_MS) return false;
  warningLogTimes.set(key, now);
  return true;
}

function getBridgeBaseUrl(): string {
  const port = Number.isFinite(DEFAULT_BRIDGE_PORT)
    ? DEFAULT_BRIDGE_PORT
    : 4310;
  return `http://127.0.0.1:${port}/chefiapp`;
}

export interface DesktopHealth {
  ok: boolean;
  version?: string | null;
  instanceId?: string | null;
  terminalType?: string | null;
  restaurantId?: string | null;
  error?: string;
}

async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = 1200, ...rest } = init;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...rest, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function checkDesktopHealth(
  timeoutMs: number = 1200,
): Promise<DesktopHealth> {
  const baseUrl = getBridgeBaseUrl();
  try {
    const res = await fetchWithTimeout(`${baseUrl}/health`, {
      method: "GET",
      timeoutMs,
    });
    if (!res.ok) {
      if (shouldLogWarning(`healthcheck_failed_${res.status}`)) {
        console.warn("[DesktopBridge] healthcheck failed", {
          status: res.status,
        });
      }
      return {
        ok: false,
        error: `HTTP_${res.status}`,
      };
    }
    const data = (await res.json()) as {
      running?: boolean;
      version?: string;
      instanceId?: string;
      kdsEnabled?: boolean;
      terminalType?: string | null;
      restaurantId?: string | null;
    };
    if (!data?.running) {
      return {
        ok: false,
        error: "DESKTOP_NOT_RUNNING",
      };
    }
    console.info("[DesktopBridge] healthcheck ok", {
      version: data.version ?? null,
      instanceId: data.instanceId ?? null,
    });
    return {
      ok: true,
      version: data.version ?? null,
      instanceId: data.instanceId ?? null,
      terminalType: data.terminalType ?? null,
      restaurantId: data.restaurantId ?? null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "DESKTOP_HEALTHCHECK_FAILED";
    if (shouldLogWarning(`healthcheck_error_${message}`)) {
      console.warn("[DesktopBridge] healthcheck error", { error: message });
    }
    return {
      ok: false,
      error: message.includes("Failed to fetch")
        ? "DESKTOP_OFFLINE"
        : message.includes("aborted")
        ? "DESKTOP_TIMEOUT"
        : message,
    };
  }
}

export async function openKdsPanelViaDesktop(
  presetId: "kitchen" | "bar" | "delivery" | "late",
): Promise<{ ok: boolean; error?: string }> {
  const health = await checkDesktopHealth();
  if (!health.ok) {
    return { ok: false, error: health.error ?? "DESKTOP_OFFLINE" };
  }

  const baseUrl = getBridgeBaseUrl();
  try {
    const res = await fetchWithTimeout(`${baseUrl}/open-kds-panel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ presetId }),
      timeoutMs: 1500,
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[DesktopBridge] open-kds-panel failed", {
        status: res.status,
        body: body.slice(0, 200),
      });
      return {
        ok: false,
        error: `HTTP_${res.status}`,
      };
    }
    console.info("[DesktopBridge] open-kds-panel ok", { presetId });
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "DESKTOP_OPEN_KDS_FAILED";
    console.error("[DesktopBridge] open-kds-panel error", { error: message });
    return { ok: false, error: message };
  }
}
