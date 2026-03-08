/**
 * SyncHealthPanel — Painel diagnóstico de saúde do Sync/Offline.
 *
 * Mostra:
 * - Estado de conectividade (online / degraded / offline)
 * - Contadores da queue (pending, syncing, dead_letter, applied)
 * - Último sync bem-sucedido
 * - Botão de force-sync
 *
 * Usado em páginas de admin/settings para visibilidade operacional.
 * NÃO substitui o SyncStatusIndicator (que é o dot compacto no TPV).
 */

import React, { useCallback, useEffect, useState } from "react";
import { getFormatLocale } from "../core/i18n/regionLocaleConfig";
import {
  ConnectivityService,
  type ConnectivityStatus,
} from "../core/sync/ConnectivityService";
import { IndexedDBQueue } from "../core/sync/IndexedDBQueue";
import { SyncEngine } from "../core/sync/SyncEngine";
import type { OfflineQueueItem } from "../core/sync/types";
import styles from "./SyncHealthPanel.module.css";

interface QueueStats {
  total: number;
  queued: number;
  syncing: number;
  applied: number;
  failed: number;
  deadLetter: number;
  oldestPendingAt: number | null;
}

function computeStats(items: OfflineQueueItem[]): QueueStats {
  let queued = 0;
  let syncing = 0;
  let applied = 0;
  let failed = 0;
  let deadLetter = 0;
  let oldestPendingAt: number | null = null;

  for (const item of items) {
    switch (item.status) {
      case "queued":
        queued++;
        if (oldestPendingAt === null || item.createdAt < oldestPendingAt) {
          oldestPendingAt = item.createdAt;
        }
        break;
      case "syncing":
        syncing++;
        break;
      case "applied":
        applied++;
        break;
      case "failed":
        if (item.attempts && item.attempts >= 10) {
          deadLetter++;
        } else {
          failed++;
          if (oldestPendingAt === null || item.createdAt < oldestPendingAt) {
            oldestPendingAt = item.createdAt;
          }
        }
        break;
      case "dead_letter":
        deadLetter++;
        break;
    }
  }

  return {
    total: items.length,
    queued,
    syncing,
    applied,
    failed,
    deadLetter,
    oldestPendingAt,
  };
}

function formatTimestamp(ts: number | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString(getFormatLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatAge(ts: number | null): string {
  if (!ts) return "";
  const ageSec = Math.floor((Date.now() - ts) / 1000);
  if (ageSec < 60) return `${ageSec}s`;
  if (ageSec < 3600) return `${Math.floor(ageSec / 60)}m`;
  return `${Math.floor(ageSec / 3600)}h ${Math.floor((ageSec % 3600) / 60)}m`;
}

const BADGE_CLASS: Record<ConnectivityStatus, string> = {
  online: styles.badgeOnline,
  degraded: styles.badgeDegraded,
  offline: styles.badgeOffline,
};

const STATUS_LABELS: Record<ConnectivityStatus, string> = {
  online: "Online",
  degraded: "Degradado",
  offline: "Offline",
};

export const SyncHealthPanel: React.FC = () => {
  const [connectivity, setConnectivity] = useState<ConnectivityStatus>(
    ConnectivityService.getConnectivity(),
  );
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    queued: 0,
    syncing: 0,
    applied: 0,
    failed: 0,
    deadLetter: 0,
    oldestPendingAt: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const refreshStats = useCallback(async () => {
    try {
      const all = await IndexedDBQueue.getAll();
      setStats(computeStats(all));
      setLastRefresh(Date.now());
    } catch {
      // IndexedDB not available (SSR or error)
    }
  }, []);

  useEffect(() => {
    const unsub = ConnectivityService.subscribe((status) => {
      setConnectivity(status);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = SyncEngine.subscribe((state) => {
      setIsProcessing(state.isProcessing);
      refreshStats();
    });
    return unsub;
  }, [refreshStats]);

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  const handleForceSync = useCallback(() => {
    SyncEngine.forceSync();
  }, []);

  const pendingTotal = stats.queued + stats.failed;
  const hasProblems = stats.deadLetter > 0 || connectivity === "offline";

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>Sync Health</h3>
        <span className={styles.headerTime}>
          {formatTimestamp(lastRefresh)}
        </span>
      </div>

      {/* Connectivity */}
      <div className={styles.row}>
        <span className={styles.label}>Conectividade</span>
        <span className={BADGE_CLASS[connectivity]}>
          {STATUS_LABELS[connectivity]}
        </span>
      </div>

      {/* Queue Counters */}
      <div className={styles.row}>
        <span className={styles.label}>Na fila</span>
        <span className={styles.value}>{stats.queued}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>A sincronizar</span>
        <span className={styles.value}>
          {stats.syncing}
          {isProcessing && <span className={styles.syncIcon}>⏳</span>}
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Falhas (a reintentar)</span>
        <span className={stats.failed > 0 ? styles.valueWarning : styles.value}>
          {stats.failed}
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Dead Letter</span>
        <span
          className={stats.deadLetter > 0 ? styles.valueDanger : styles.value}
        >
          {stats.deadLetter}
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Aplicadas</span>
        <span className={styles.valueSuccess}>{stats.applied}</span>
      </div>

      {/* Oldest pending */}
      {stats.oldestPendingAt && (
        <div className={styles.rowBorder}>
          <span className={styles.label}>Item mais antigo</span>
          <span className={styles.value}>
            {formatAge(stats.oldestPendingAt)} atrás
          </span>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={styles.button}
          onClick={handleForceSync}
          disabled={
            isProcessing || connectivity === "offline" || pendingTotal === 0
          }
        >
          {isProcessing ? "A sincronizar..." : "Forçar Sync"}
        </button>
        <button className={styles.button} onClick={refreshStats}>
          Atualizar
        </button>
      </div>

      {/* Warning */}
      {hasProblems && (
        <div className={styles.warning}>
          {stats.deadLetter > 0 && (
            <p className={styles.warningText}>
              ⚠️ {stats.deadLetter} item(s) na dead letter — requerem atenção
              manual.
            </p>
          )}
          {connectivity === "offline" && (
            <p className={styles.warningText}>
              📡 Sem ligação ao Core. Operações ficam na fila local.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
