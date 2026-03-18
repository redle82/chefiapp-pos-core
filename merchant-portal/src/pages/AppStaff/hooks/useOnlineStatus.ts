/**
 * useOnlineStatus — Detecção de conectividade para modo offline.
 *
 * Retorna:
 * - isOnline: navegador está online
 * - wasOffline: esteve offline (mostra banner de reconexão)
 * - lastOnlineAt: última vez online
 * - pendingSync: número de ações pendentes para sincronizar
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ── Offline queue ────────────────────────────────────────────────

const QUEUE_KEY = "chefi_offline_queue";

export interface OfflineAction {
  id: string;
  type: string;
  payload: unknown;
  created_at: string;
}

function loadQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as OfflineAction[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: OfflineAction[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* storage full */
  }
}

// ── Hook ─────────────────────────────────────────────────────────

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<number>(Date.now());
  const [queue, setQueue] = useState<OfflineAction[]>(loadQueue);
  const wasOfflineTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineAt(Date.now());
      setWasOffline(true);
      // Auto-hide "back online" banner after 5s
      wasOfflineTimerRef.current = setTimeout(() => setWasOffline(false), 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (wasOfflineTimerRef.current) clearTimeout(wasOfflineTimerRef.current);
    };
  }, []);

  // Persist queue
  useEffect(() => {
    saveQueue(queue);
  }, [queue]);

  const enqueueAction = useCallback(
    (type: string, payload: unknown) => {
      const action: OfflineAction = {
        id: `oq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        payload,
        created_at: new Date().toISOString(),
      };
      setQueue((prev) => [...prev, action]);
      return action;
    },
    [],
  );

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const processQueue = useCallback(
    async (handler: (action: OfflineAction) => Promise<boolean>) => {
      const results: string[] = [];
      const remaining: OfflineAction[] = [];

      for (const action of queue) {
        try {
          const success = await handler(action);
          if (success) {
            results.push(action.id);
          } else {
            remaining.push(action);
          }
        } catch {
          remaining.push(action);
        }
      }

      setQueue(remaining);
      return results;
    },
    [queue],
  );

  return {
    isOnline,
    wasOffline,
    lastOnlineAt,
    pendingSync: queue.length,
    queue,
    enqueueAction,
    clearQueue,
    processQueue,
  };
}
