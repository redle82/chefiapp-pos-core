/**
 * useNetworkStatus - Hook para detectar estado de conexão
 *
 * REGRA: Offline não significa "desligado", significa "não consegue falar com Supabase"
 */
// @ts-nocheck


import { useCallback, useEffect, useState } from "react";
// LEGACY / LAB — blocked in Docker mode
import { supabase } from "../supabase";

export type NetworkStatus = "online" | "offline" | "checking";

interface UseNetworkStatusReturn {
  status: NetworkStatus;
  isOnline: boolean;
  isOffline: boolean;
  lastChecked: Date | null;
  checkNow: () => Promise<boolean>;
}

// Intervalo de verificação quando online (30 segundos)
const ONLINE_CHECK_INTERVAL = 30_000;

// Intervalo de verificação quando offline (5 segundos - mais agressivo para reconectar rápido)
const OFFLINE_CHECK_INTERVAL = 5_000;

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [status, setStatus] = useState<NetworkStatus>("checking");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  /**
   * Verifica conectividade REAL com Supabase
   * navigator.onLine não é confiável - só detecta se o cabo está conectado
   */
  const checkNow = useCallback(async (): Promise<boolean> => {
    try {
      // Tentar uma query simples e rápida
      const { error } = await supabase
        .from("gm_restaurants")
        .select("id")
        .limit(1)
        .maybeSingle();

      const isOnline = !error;
      setStatus(isOnline ? "online" : "offline");
      setLastChecked(new Date());
      return isOnline;
    } catch {
      setStatus("offline");
      setLastChecked(new Date());
      return false;
    }
  }, []);

  useEffect(() => {
    // Check inicial (com pequeno delay para evitar cascading renders)
    const timeout = setTimeout(() => checkNow(), 100);

    // Listener nativo (como fallback rápido)
    const handleOnline = () => {
      console.log("[Network] Browser reports online - verifying...");
      checkNow();
    };

    const handleOffline = () => {
      console.log("[Network] Browser reports offline");
      setStatus("offline");
      setLastChecked(new Date());
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Polling baseado no status atual
    let intervalId: ReturnType<typeof setInterval>;

    const setupInterval = () => {
      const interval =
        status === "offline" ? OFFLINE_CHECK_INTERVAL : ONLINE_CHECK_INTERVAL;
      intervalId = setInterval(checkNow, interval);
    };

    setupInterval();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalId);
    };
  }, [checkNow, status]);

  return {
    status,
    isOnline: status === "online",
    isOffline: status === "offline",
    lastChecked,
    checkNow,
  };
}
