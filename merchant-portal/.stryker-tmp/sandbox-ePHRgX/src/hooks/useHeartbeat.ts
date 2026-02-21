// @ts-nocheck
import { useEffect, useRef } from "react";
import {
  TerminalEngine,
  type TerminalType,
} from "../core/terminal/TerminalEngine";

interface HeartbeatConfig {
  restaurantId?: string | null;
  type: TerminalType;
  name: string;
  intervalMs?: number;
  enabled?: boolean;
}

/**
 * Hook para manter o terminal "vivo" no Core.
 * Envia um heartbeat periódico enquanto o componente estiver montado.
 */
export function useHeartbeat({
  restaurantId,
  type,
  name,
  intervalMs = 30000, // 30 segundos por padrão
  enabled = true,
}: HeartbeatConfig) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !restaurantId) return;

    const performHeartbeat = async () => {
      await TerminalEngine.sendHeartbeat({
        restaurantId,
        type,
        name,
      });
    };

    // Envia o primeiro imediatamente
    performHeartbeat();

    // Configura o intervalo
    timerRef.current = setInterval(performHeartbeat, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [restaurantId, type, name, intervalMs, enabled]);
}
