/**
 * useDesktopHealth — React hook for detecting a running Desktop app via
 * the local HTTP bridge at 127.0.0.1:4310.
 *
 * Probes `checkDesktopHealth()` once on mount (auto-poll) and exposes a
 * `recheck()` function for manual verification (e.g. "Verificar instalación"
 * button). Results are cached in sessionStorage with a 30 s TTL to avoid
 * redundant probes during SPA navigation.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { checkDesktopHealth, type DesktopHealth } from "./DesktopBridgeClient";

export type DesktopHealthStatus = "checking" | "detected" | "not_found";

export interface UseDesktopHealthReturn {
  status: DesktopHealthStatus;
  health: DesktopHealth | null;
  recheck: () => void;
}

const CACHE_KEY = "chefiapp_desktop_health_cache";
const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  health: DesktopHealth;
  ts: number;
}

function readCache(): DesktopHealth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      window.sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return entry.health;
  } catch {
    return null;
  }
}

function writeCache(health: DesktopHealth): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry = { health, ts: Date.now() };
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
}

export function useDesktopHealth(): UseDesktopHealthReturn {
  const cached = readCache();
  const [status, setStatus] = useState<DesktopHealthStatus>(
    cached ? (cached.ok ? "detected" : "not_found") : "checking",
  );
  const [health, setHealth] = useState<DesktopHealth | null>(cached);
  const mountedRef = useRef(true);

  const probe = useCallback(async () => {
    setStatus("checking");
    try {
      const result = await checkDesktopHealth(600);
      if (!mountedRef.current) return;
      setHealth(result);
      setStatus(result.ok ? "detected" : "not_found");
      writeCache(result);
    } catch {
      if (!mountedRef.current) return;
      const fallback: DesktopHealth = { ok: false, error: "PROBE_EXCEPTION" };
      setHealth(fallback);
      setStatus("not_found");
      writeCache(fallback);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // Skip auto-probe if we have a valid cache hit
    if (!cached) {
      probe();
    }
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recheck = useCallback(() => {
    // Invalidate cache and re-probe
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(CACHE_KEY);
      } catch {
        // ignore
      }
    }
    probe();
  }, [probe]);

  return { status, health, recheck };
}
