/**
 * ObservabilityPage — Painel interno de observabilidade (admin only)
 *
 * Fase 2 (1000-ready): Core status + métricas mínimas (pedidos criados hoje).
 * Ver docs/architecture/OBSERVABILITY_LOGGING_CONTRACT.md e docs/strategy/OBSERVABILITY_MINIMA.md.
 */

import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
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
  const { runtime } = useRestaurantRuntime();
  const bootstrap = useBootstrapState();
  const [ordersToday, setOrdersToday] = useState<number | null>(null);
  const [errors24h, setErrors24h] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(0);

  useEffect(() => {
    if (!runtime.restaurant_id) {
      setOrdersToday(null);
      return;
    }
    let cancelled = false;
    getOrdersCreatedTodayCount(runtime.restaurant_id).then((n) => {
      if (!cancelled) setOrdersToday(n);
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
    <section className={styles.page}>
      <AdminPageHeader
        title="Observabilidade"
        subtitle="Estado do Core e métricas mínimas (1000-ready). Uso interno."
      />

      <div className={styles.cardGrid}>
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
