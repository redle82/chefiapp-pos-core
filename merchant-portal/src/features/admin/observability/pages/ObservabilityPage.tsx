/**
 * ObservabilityPage — Painel interno de observabilidade (admin only)
 *
 * Fase 2 (1000-ready): Core status + métricas mínimas (pedidos criados hoje).
 * Ver docs/architecture/OBSERVABILITY_LOGGING_CONTRACT.md e docs/strategy/OBSERVABILITY_MINIMA.md.
 */

import { useEffect, useState } from "react";
import { useBootstrapState } from "../../../../hooks/useBootstrapState";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import {
  getAverageLatencyMs,
  getErrorsLast24hCount,
  getOrdersCreatedTodayCount,
} from "../services/observabilityService";

const CARD_STYLE = {
  padding: 24,
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  backgroundColor: "#fff",
} as const;

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
  const coreLabel = coreOnline ? "Online" : bootstrap.coreStatus === "offline-erro" ? "Erro" : "Offline";

  return (
    <section style={{ padding: 24 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px 0", color: "#111827" }}>
          Observabilidade
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
          Estado do Core e métricas mínimas (1000-ready). Uso interno.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {/* Core status */}
        <div style={CARD_STYLE}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: 14, fontWeight: 600, color: "#374151" }}>
            Core (PostgREST)
          </h2>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: coreOnline ? "#15803d" : "#b45309",
            }}
          >
            {coreLabel}
          </div>
          <p style={{ margin: "8px 0 0 0", fontSize: 12, color: "#6b7280" }}>
            {runtime.coreReachable ? "Ligação ativa" : "Sem ligação ao Core"}
          </p>
        </div>

        {/* Pedidos criados hoje (real) */}
        <div style={CARD_STYLE}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: 14, fontWeight: 600, color: "#374151" }}>
            Pedidos criados (hoje)
          </h2>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: ordersToday !== null ? "#111827" : "#6b7280",
            }}
          >
            {ordersToday === null ? "—" : ordersToday}
          </div>
          <p style={{ margin: "8px 0 0 0", fontSize: 12, color: "#6b7280" }}>
            {runtime.restaurant_id
              ? "Por restaurante (dia local)"
              : "Seleccione un restaurante"}
          </p>
        </div>

        {/* Erros (últimas 24h) — in-memory esta sessão */}
        <div style={CARD_STYLE}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: 14, fontWeight: 600, color: "#374151" }}>
            Erros (últimas 24h)
          </h2>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: runtime.restaurant_id ? "#111827" : "#6b7280",
            }}
          >
            {runtime.restaurant_id ? errors24h : "—"}
          </div>
          <p style={{ margin: "8px 0 0 0", fontSize: 12, color: "#6b7280" }}>
            {runtime.restaurant_id
              ? "Esta sessão"
              : "Seleccione un restaurante"}
          </p>
        </div>

        {/* Latência média — create_order_atomic, in-memory esta sessão */}
        <div style={CARD_STYLE}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: 14, fontWeight: 600, color: "#374151" }}>
            Latência média
          </h2>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: runtime.restaurant_id ? "#111827" : "#6b7280",
            }}
          >
            {runtime.restaurant_id
              ? (latencyMs > 0 ? `${Math.round(latencyMs)} ms` : "—")
              : "—"}
          </div>
          <p style={{ margin: "8px 0 0 0", fontSize: 12, color: "#6b7280" }}>
            {runtime.restaurant_id
              ? "Esta sessão"
              : "Seleccione un restaurante"}
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          backgroundColor: "#f9fafb",
          borderRadius: 8,
          fontSize: 13,
          color: "#6b7280",
        }}
      >
        <strong style={{ color: "#374151" }}>Referências:</strong> Logger central (core/logger), OBSERVABILITY_LOGGING_CONTRACT, OBSERVABILITY_MINIMA. Logs do Core: stdout dos containers Docker; saúde Postgres/PostgREST: ver docs.
      </div>
    </section>
  );
}
