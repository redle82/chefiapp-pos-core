/**
 * ObservabilityPage — Painel interno de observabilidade (admin only)
 *
 * Fase 2 (1000-ready): Core status + métricas mínimas (pedidos criados hoje).
 * DoD B4: Diagnóstico — connectivity, filas (order + print), últimos erros.
 * Ver docs/architecture/OBSERVABILITY_LOGGING_CONTRACT.md e docs/strategy/OBSERVABILITY_MINIMA.md.
 */

import { useFormatLocale } from "@/core/i18n/useFormatLocale";
import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { getLastErrors } from "../../../../core/logger/transports/ErrorsStoreTransport";
import { PrintQueue } from "../../../../core/print/PrintQueue";
import { SyncEngine } from "../../../../core/sync/SyncEngine";
import { useOfflineQueue } from "../../../../core/sync/useOfflineQueue";
import { useBootstrapState } from "../../../../hooks/useBootstrapState";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { FiscalSyncMonitorSection } from "../components/FiscalSyncMonitorSection";
import {
  getAverageLatencyMs,
  getErrorsLast24hCount,
  getOrdersCreatedTodayCount,
} from "../services/observabilityService";
import styles from "./ObservabilityPage.module.css";

export function ObservabilityPage() {
  const locale = useFormatLocale();
  const { runtime } = useRestaurantRuntime();
  const bootstrap = useBootstrapState();
  const offlineQueue = useOfflineQueue();
  const [ordersToday, setOrdersToday] = useState<number | null>(null);
  const [errors24h, setErrors24h] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [printQueuePending, setPrintQueuePending] = useState<number>(0);
  const [lastErrors, setLastErrors] = useState<
    ReturnType<typeof getLastErrors>
  >([]);
  const [connectivity, setConnectivity] = useState(
    SyncEngine.getConnectivity(),
  );
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const unsub = SyncEngine.subscribe((s) =>
      setConnectivity(SyncEngine.getConnectivity()),
    );
    return unsub;
  }, []);

  useEffect(() => {
    let cancelled = false;
    PrintQueue.getPending().then((pending) => {
      if (!cancelled) {
        setPrintQueuePending(pending.length);
        setLastUpdatedAt(new Date());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ordersToday, offlineQueue.pendingCount]);
  const refreshPrintQueue = () =>
    PrintQueue.getPending().then((p) => {
      setPrintQueuePending(p.length);
      setLastUpdatedAt(new Date());
    });

  useEffect(() => {
    setLastErrors(getLastErrors());
    const interval = setInterval(() => setLastErrors(getLastErrors()), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!runtime.restaurant_id) {
      setOrdersToday(null);
      return;
    }
    let cancelled = false;
    getOrdersCreatedTodayCount(runtime.restaurant_id).then((n) => {
      if (!cancelled) {
        setOrdersToday(n);
        setLastUpdatedAt(new Date());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [runtime.restaurant_id]);

  useEffect(() => {
    if (!runtime.restaurant_id) {
      setErrors24h(0);
      return;
    }
    const refresh = () =>
      setErrors24h(getErrorsLast24hCount(runtime.restaurant_id!));
    refresh();
    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, [runtime.restaurant_id]);

  useEffect(() => {
    if (!runtime.restaurant_id) {
      setLatencyMs(0);
      return;
    }
    const refresh = () =>
      setLatencyMs(getAverageLatencyMs(runtime.restaurant_id!));
    refresh();
    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, [runtime.restaurant_id]);

  const coreOnline = bootstrap.coreStatus === "online" && runtime.coreReachable;
  const coreLabel = coreOnline
    ? "Online"
    : bootstrap.coreStatus === "offline-erro"
    ? "Erro"
    : "Offline";

  const coreValueClass = coreOnline ? styles.valueOk : styles.valueWarn;
  const ordersValueClass =
    ordersToday !== null ? styles.cardValue : styles.valueMuted;
  const errorsValueClass = runtime.restaurant_id
    ? styles.cardValue
    : styles.valueMuted;
  const latencyValueClass = runtime.restaurant_id
    ? styles.cardValue
    : styles.valueMuted;

  return (
    <section className={`${styles.page} page-enter admin-content-page`}>
      <AdminPageHeader
        title="Observabilidade"
        subtitle="Estado do Core e métricas mínimas (1000-ready). Uso interno."
      />

      {/* Fase 4.4: Última atualização do painel */}
      {lastUpdatedAt && (
        <p className={styles.lastUpdated}>
          Atualizado às{" "}
          {lastUpdatedAt.toLocaleTimeString(locale, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>
      )}

      <div className={styles.cardGrid}>
        {/* DoD B4: Connectivity (SyncEngine) */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Connectivity</h2>
          <div
            className={`${styles.cardValue} ${
              connectivity === "online" ? styles.valueOk : styles.valueWarn
            }`}
          >
            {connectivity}
          </div>
          <p className={styles.cardNote}>
            online / offline / degraded (SyncEngine)
          </p>
        </div>

        {/* Core status */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Core (PostgREST)</h2>
          <div className={`${styles.cardValue} ${coreValueClass}`}>
            {coreLabel}
          </div>
          <p className={styles.cardNote}>
            {runtime.coreReachable ? "Ligação ativa" : "Sem ligação ao Core"}
          </p>
        </div>

        {/* DoD B4: Order queue pending */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Fila de pedidos (pendentes)</h2>
          <div className={styles.cardValue}>{offlineQueue.pendingCount}</div>
          <p className={styles.cardNote}>IndexedDB order queue</p>
        </div>

        {/* DoD B4: Print queue pending */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Fila de impressão (pendentes)</h2>
          <div className={styles.cardValue}>{printQueuePending}</div>
          <p className={styles.cardNote}>
            <button
              type="button"
              onClick={refreshPrintQueue}
              className={styles.linkLike}
            >
              Atualizar
            </button>
          </p>
        </div>

        {/* Pedidos criados hoje (real) */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Pedidos criados (hoje)</h2>
          <div className={ordersValueClass}>
            {ordersToday === null ? "—" : ordersToday}
          </div>
          <p className={styles.cardNote}>
            {runtime.restaurant_id
              ? "Por restaurante (dia local)"
              : "Seleccione un restaurante"}
          </p>
        </div>

        {/* Erros (últimas 24h) — in-memory esta sessão */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Erros (últimas 24h)</h2>
          <div className={errorsValueClass}>
            {runtime.restaurant_id ? errors24h : "—"}
          </div>
          <p className={styles.cardNote}>
            {runtime.restaurant_id
              ? "Esta sessão"
              : "Seleccione un restaurante"}
          </p>
        </div>

        {/* Latência média — create_order_atomic, in-memory esta sessão */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Latência média</h2>
          <div className={latencyValueClass}>
            {runtime.restaurant_id
              ? latencyMs > 0
                ? `${Math.round(latencyMs)} ms`
                : "—"
              : "—"}
          </div>
          <p className={styles.cardNote}>
            {runtime.restaurant_id
              ? "Esta sessão"
              : "Seleccione un restaurante"}
          </p>
        </div>
      </div>

      {/* DoD B4: Últimos erros (esta sessão) */}
      {lastErrors.length > 0 && (
        <div className={styles.diagnosticErrors}>
          <h2 className={styles.diagnosticErrorsTitle}>
            Últimos erros (sessão)
          </h2>
          {lastErrors.slice(0, 5).map((e, i) => (
            <div
              key={`${e.timestamp}-${i}`}
              className={styles.diagnosticErrorItem}
            >
              <strong>{e.timestamp}</strong> — {e.message}
              {e.data && Object.keys(e.data).length > 0 && (
                <pre style={{ margin: "4px 0 0 0", fontSize: 11 }}>
                  {JSON.stringify(e.data)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sync fiscal — observabilidade pós-fiscal */}
      <FiscalSyncMonitorSection restaurantId={runtime.restaurant_id} />

      <div className={styles.footerNote}>
        <strong className={styles.footerStrong}>Referências:</strong> Logger
        central (core/logger), OBSERVABILITY_LOGGING_CONTRACT,
        OBSERVABILITY_MINIMA. Logs do Core: stdout dos containers Docker; saúde
        Postgres/PostgREST: ver docs.
      </div>
    </section>
  );
}
