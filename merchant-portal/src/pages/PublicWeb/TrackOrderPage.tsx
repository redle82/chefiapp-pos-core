/**
 * TrackOrderPage — Public delivery tracking page.
 *
 * URL: /track/:orderId
 * No authentication required. Customer-facing, light theme, mobile-first.
 *
 * Shows a progress stepper with 5 delivery states:
 *   1. Recebido  2. A preparar  3. Embalado  4. A caminho  5. Entregue
 *
 * Auto-refreshes every 10 seconds via polling.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { dockerCoreClient } from "../../infra/docker-core/connection";
import { useCurrency } from "../../core/currency/useCurrency";
import type { CoreOrder } from "../../infra/docker-core/types";

// ---------------------------------------------------------------------------
// Delivery status (mirrors TPVDeliveryPage)
// ---------------------------------------------------------------------------

type DeliveryStep =
  | "received"
  | "preparing"
  | "packing"
  | "dispatched"
  | "delivered";

const STEPS: DeliveryStep[] = [
  "received",
  "preparing",
  "packing",
  "dispatched",
  "delivered",
];

const STEP_ICONS: Record<DeliveryStep, string> = {
  received: "\u{1F4CB}",
  preparing: "\u{1F468}\u200D\u{1F373}",
  packing: "\u{1F4E6}",
  dispatched: "\u{1F697}",
  delivered: "\u2705",
};

function deriveStep(order: CoreOrder): DeliveryStep {
  const meta = order.sync_metadata as Record<string, unknown> | null;
  const explicit = meta?.delivery_status as string | undefined;

  if (explicit === "delivered" || order.status === "CLOSED") return "delivered";
  if (explicit === "dispatched") return "dispatched";
  if (explicit === "pickup" || explicit === "packing" || order.status === "READY")
    return "packing";
  if (
    explicit === "preparing" ||
    order.status === "IN_PREP" ||
    order.status === "OPEN"
  )
    return "preparing";
  return "received";
}

function stepIndex(step: DeliveryStep): number {
  return STEPS.indexOf(step);
}

// ---------------------------------------------------------------------------
// Order items helper
// ---------------------------------------------------------------------------

interface OrderItem {
  name: string;
  quantity: number;
  unit_price_cents?: number;
}

function extractItems(order: CoreOrder): OrderItem[] {
  const raw = (order as Record<string, unknown>).items;
  if (!Array.isArray(raw)) return [];
  return raw.map((item: Record<string, unknown>) => ({
    name: String(item.name ?? item.product_name ?? "Item"),
    quantity: Number(item.quantity ?? 1),
    unit_price_cents: item.unit_price_cents != null
      ? Number(item.unit_price_cents)
      : undefined,
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrackOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { t } = useTranslation("tpv");
  const { formatAmount } = useCurrency();

  const [order, setOrder] = useState<CoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const { data, error: fetchErr } = await dockerCoreClient
        .from("gm_orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (fetchErr || !data) {
        setNotFound(true);
        setOrder(null);
      } else {
        setOrder(data as CoreOrder);
        setNotFound(false);
        setError(null);
      }
    } catch (err) {
      console.error("[TrackOrder] fetch error:", err);
      setError(t("tracking.errorLoading"));
    } finally {
      setLoading(false);
    }
  }, [orderId, t]);

  // Initial load + auto-refresh every 10s
  useEffect(() => {
    void fetchOrder();
    const id = setInterval(() => void fetchOrder(), 10_000);
    return () => clearInterval(id);
  }, [fetchOrder]);

  const currentStep = useMemo(
    () => (order ? deriveStep(order) : "received"),
    [order],
  );
  const currentIdx = stepIndex(currentStep);
  const items = useMemo(() => (order ? extractItems(order) : []), [order]);

  const lastUpdated = useMemo(() => {
    if (!order) return null;
    const d = new Date(order.updated_at ?? order.created_at);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [order]);

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ color: "#737373", fontSize: 14, textAlign: "center" }}>
            {t("tracking.loading")}
          </p>
        </div>
      </div>
    );
  }

  // ─── Not found ──────────────────────────────────────────────────────────────
  if (notFound || !order) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u{1F50D}"}</div>
            <h2 style={{ margin: 0, fontSize: 18, color: "#171717" }}>
              {t("tracking.notFound")}
            </h2>
            <p style={{ color: "#737373", fontSize: 14, marginTop: 8 }}>
              {t("tracking.notFoundDescription")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ color: "#ef4444", fontSize: 14, textAlign: "center" }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  // ─── Main ───────────────────────────────────────────────────────────────────
  const shortId = order.short_id ?? order.id.slice(0, 6).toUpperCase();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header / branding */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#171717" }}>
            {t("tracking.title")}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#737373" }}>
            {t("tracking.subtitle")}
          </p>
        </div>

        {/* Order number */}
        <div style={styles.orderBadge}>
          <span style={{ fontSize: 13, color: "#737373" }}>
            {t("tracking.orderNumber")}
          </span>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#171717" }}>
            #{shortId}
          </span>
        </div>

        {/* Progress stepper */}
        <div style={styles.stepperContainer}>
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isActive = idx === currentIdx;
            const isPending = idx > currentIdx;

            return (
              <div key={step} style={styles.stepItem}>
                {/* Connector line (before step, except first) */}
                {idx > 0 && (
                  <div
                    style={{
                      ...styles.connector,
                      backgroundColor: isCompleted || isActive
                        ? isCompleted
                          ? "#22c55e"
                          : "#f97316"
                        : "#e5e5e5",
                    }}
                  />
                )}

                {/* Step circle */}
                <div
                  style={{
                    ...styles.stepCircle,
                    backgroundColor: isCompleted
                      ? "#22c55e"
                      : isActive
                        ? "#f97316"
                        : "#e5e5e5",
                    color: isPending ? "#a3a3a3" : "#fff",
                    ...(isActive ? styles.activePulse : {}),
                  }}
                >
                  <span style={{ fontSize: 18 }}>{STEP_ICONS[step]}</span>
                </div>

                {/* Step label */}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    color: isCompleted
                      ? "#22c55e"
                      : isActive
                        ? "#f97316"
                        : "#a3a3a3",
                    textAlign: "center",
                    marginTop: 6,
                  }}
                >
                  {t(`tracking.step.${step}`)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Current status message */}
        <div style={styles.statusBanner}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#f97316" }}>
            {t(`tracking.statusMessage.${currentStep}`)}
          </span>
        </div>

        {/* Order items */}
        {items.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>{t("tracking.items")}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((item, idx) => (
                <div key={idx} style={styles.itemRow}>
                  <span style={{ color: "#171717", fontSize: 14 }}>
                    {item.quantity}x {item.name}
                  </span>
                  {item.unit_price_cents != null && (
                    <span style={{ color: "#737373", fontSize: 13 }}>
                      {formatAmount(item.unit_price_cents * item.quantity)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        {order.total_cents != null && (
          <div style={styles.totalRow}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#171717" }}>
              {t("tracking.total")}
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#171717" }}>
              {formatAmount(order.total_cents)}
            </span>
          </div>
        )}

        {/* Last updated */}
        {lastUpdated && (
          <p style={{ textAlign: "center", fontSize: 12, color: "#a3a3a3", margin: "16px 0 0" }}>
            {t("tracking.lastUpdated", { time: lastUpdated })}
          </p>
        )}
      </div>

      {/* Footer */}
      <p style={{ textAlign: "center", fontSize: 12, color: "#a3a3a3", marginTop: 24 }}>
        Powered by ChefIApp
      </p>

      {/* Pulse animation */}
      <style>{pulseKeyframes}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const pulseKeyframes = `
@keyframes trackPulse {
  0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); }
  100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
}
`;

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#fafafa",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "24px 16px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: "28px 20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
  },
  orderBadge: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 4,
    padding: "16px 0",
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  stepperContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "0 4px",
    marginBottom: 24,
  },
  stepItem: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    flex: 1,
    position: "relative" as const,
  },
  connector: {
    position: "absolute" as const,
    top: 20,
    right: "50%",
    width: "100%",
    height: 3,
    borderRadius: 2,
    zIndex: 0,
  },
  stepCircle: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    position: "relative" as const,
  },
  activePulse: {
    animation: "trackPulse 2s infinite",
  },
  statusBanner: {
    textAlign: "center" as const,
    padding: "12px 16px",
    backgroundColor: "#fff7ed",
    borderRadius: 10,
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    margin: "0 0 10px",
    fontSize: 14,
    fontWeight: 600,
    color: "#525252",
  },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #f5f5f5",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 0 0",
    borderTop: "2px solid #e5e5e5",
    marginTop: 8,
  },
};
