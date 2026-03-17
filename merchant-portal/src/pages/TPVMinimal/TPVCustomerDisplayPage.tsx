/**
 * TPVCustomerDisplayPage — Painel de Retirada / Pickup Board.
 *
 * Ecrã colectivo virado para o cliente (balcão, display de parede, TV).
 * Mostra TODOS os pedidos activos em duas colunas:
 *   - "EM PREPARAÇÃO"    → status OPEN / IN_PREP
 *   - "PODE RETIRAR"     → status READY (mais recentes primeiro)
 *
 * Princípios:
 * - Sem preços, sem detalhes de itens, sem controlos operacionais.
 * - Legível a distância (TV/monitor a 3-5m).
 * - A coluna já comunica o estado — sem badge redundante por card.
 * - Transição para PRONTOS = evento principal da tela (glow + chime).
 * - Scroll automático quando overflow.
 *
 * Actualiza em tempo real via polling (3s).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CoreOrder } from "../../infra/docker-core/types";
import { readActiveOrders } from "../../infra/readers/OrderReader";
import { useTPVRestaurantId } from "./hooks/useTPVRestaurantId";

/* ── TTL constants for READY orders (display-only) ────────────────── */

/** After 10 min ready, card fades to 50% opacity. */
const READY_FADE_MS = 10 * 60_000;
/** After 20 min ready, card is hidden entirely. */
const READY_EXPIRE_MS = 20 * 60_000;

/* ── Helpers ──────────────────────────────────────────────────────── */

function shortId(order: CoreOrder): string {
  if (order.short_id) return `#${order.short_id}`;
  return `#${order.id.slice(-4).toUpperCase()}`;
}

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h${mins % 60}m`;
}

type ColumnType = "preparing" | "ready";

/* ── Keyframe injection (once) ────────────────────────────────────── */

const KEYFRAMES = `
@keyframes customerDisplayPulse {
  0%   { transform: scale(1);    box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
  50%  { transform: scale(1.04); box-shadow: 0 0 24px 6px rgba(34,197,94,0.3); }
  100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(34,197,94,0); }
}
@keyframes customerDisplayGlow {
  0%   { background-color: rgba(34,197,94,0.20); }
  100% { background-color: rgba(34,197,94,0.08); }
}
@keyframes customerDisplayAutoScroll {
  0%   { transform: translateY(0); }
  45%  { transform: translateY(var(--scroll-distance, -50%)); }
  55%  { transform: translateY(var(--scroll-distance, -50%)); }
  100% { transform: translateY(0); }
}
`;

let keyframesInjected = false;
function injectKeyframes() {
  if (keyframesInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
  keyframesInjected = true;
}

/* ── Chime (notification sound for READY transition) ──────────────── */

function playReadyChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    // Two-tone chime: C5 → E5
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // AudioContext may be blocked by browser policy — silent fallback
  }
}

/* ── Component ────────────────────────────────────────────────────── */

/** Duration (ms) that newly-ready cards stay highlighted. */
const HIGHLIGHT_DURATION = 8000;

export function TPVCustomerDisplayPage() {
  const { t } = useTranslation("tpv");
  const restaurantId = useTPVRestaurantId();
  const [orders, setOrders] = useState<CoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const prevReadyIdsRef = useRef<Set<string>>(new Set());
  const [newlyReadyIds, setNewlyReadyIds] = useState<Set<string>>(new Set());
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => injectKeyframes(), []);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    const all = await readActiveOrders(restaurantId);
    setOrders(all);
    setLoading(false);

    // Detect newly READY orders for highlight + chime
    const currentReadyIds = new Set(
      all.filter((o) => o.status === "READY").map((o) => o.id),
    );
    const prev = prevReadyIdsRef.current;
    const fresh = new Set<string>();
    for (const id of currentReadyIds) {
      if (!prev.has(id)) fresh.add(id);
    }
    if (fresh.size > 0) {
      setNewlyReadyIds(fresh);
      playReadyChime();
      // Clear highlight after duration
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(
        () => setNewlyReadyIds(new Set()),
        HIGHLIGHT_DURATION,
      );
    }
    prevReadyIdsRef.current = currentReadyIds;
  }, [restaurantId]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 3000);
    return () => {
      clearInterval(id);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, [load]);

  const preparing = orders.filter(
    (o) => o.status === "OPEN" || o.status === "IN_PREP",
  );
  // Ready: most recent first (newest ready at top = most visible)
  // TTL: hide orders that have been READY for more than 20 minutes
  const ready = orders
    .filter((o) => {
      if (o.status !== "READY") return false;
      const readySince = Date.now() - new Date(o.updated_at ?? o.created_at).getTime();
      return readySince < READY_EXPIRE_MS;
    })
    .sort(
      (a, b) =>
        new Date(b.updated_at ?? b.created_at).getTime() -
        new Date(a.updated_at ?? a.created_at).getTime(),
    );

  // Adaptive font size for ready column based on order count
  const readyIdFontSize = ready.length <= 4 ? 48 : ready.length <= 8 ? 36 : 28;

  if (loading) {
    return (
      <div style={screenStyle}>
        <p style={{ color: "#737373", fontSize: 20 }}>{t("customerDisplay.loading")}</p>
      </div>
    );
  }

  const hasOrders = preparing.length > 0 || ready.length > 0;

  if (!hasOrders) {
    return (
      <div style={screenStyle}>
        <img
          src="/Logo%20Chefiapp%20Transparent.png"
          alt="ChefIApp"
          width={96}
          height={96}
          style={{ borderRadius: "50%", marginBottom: 28, opacity: 0.5 }}
        />
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#fafafa",
            margin: 0,
          }}
        >
          {t("customerDisplay.welcome")}
        </h1>
        <p style={{ fontSize: 18, color: "#525252", marginTop: 10 }}>
          {t("customerDisplay.ordersWillAppearWhenPreparing")}
        </p>
      </div>
    );
  }

  return (
    <div style={boardStyle}>
      {/* Column: EM PREPARAÇÃO */}
      <Column
        title={t("customerDisplay.preparing")}
        titleColor="#f59e0b"
        columnType="preparing"
        orders={preparing}
        newlyReadyIds={newlyReadyIds}
        readyIdFontSize={28}
        t={t}
      />

      {/* Divider */}
      <div
        style={{
          width: 2,
          backgroundColor: "rgba(255,255,255,0.08)",
          alignSelf: "stretch",
        }}
      />

      {/* Column: PODE RETIRAR */}
      <Column
        title={t("customerDisplay.readyForPickup")}
        titleColor="#22c55e"
        columnType="ready"
        orders={ready}
        newlyReadyIds={newlyReadyIds}
        readyIdFontSize={readyIdFontSize}
        t={t}
      />
    </div>
  );
}

/* ── Column ───────────────────────────────────────────────────────── */

/** Auto-scroll threshold: activate marquee when more than 8 orders in preparing column. */
const AUTO_SCROLL_THRESHOLD = 8;
/** Auto-scroll cycle duration in seconds. */
const AUTO_SCROLL_DURATION = 20;

function Column({
  title,
  titleColor,
  columnType,
  orders,
  newlyReadyIds,
  readyIdFontSize,
  t,
}: {
  title: string;
  titleColor: string;
  columnType: ColumnType;
  orders: CoreOrder[];
  newlyReadyIds: Set<string>;
  readyIdFontSize: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const interactionTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const isPreparing = columnType === "preparing";
  const shouldAutoScroll =
    isPreparing && orders.length > AUTO_SCROLL_THRESHOLD && !userInteracted;

  // Calculate scroll distance for CSS variable
  const [scrollDistance, setScrollDistance] = useState(0);
  useEffect(() => {
    const container = scrollContainerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;
    const overflow = inner.scrollHeight - container.clientHeight;
    setScrollDistance(overflow > 0 ? overflow : 0);
  }, [orders.length]);

  // Pause auto-scroll for 15s after user interaction
  const handleUserInteraction = useCallback(() => {
    setUserInteracted(true);
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    interactionTimerRef.current = setTimeout(
      () => setUserInteracted(false),
      15_000,
    );
  }, []);

  useEffect(() => {
    return () => {
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    };
  }, []);

  // Ready column: switch to 2-column grid when >6 orders
  const isReadyGrid = columnType === "ready" && orders.length > 6;
  const containerStyle: React.CSSProperties = isReadyGrid
    ? {
        ...ordersContainerStyle,
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 14,
        flexDirection: undefined,
      }
    : ordersContainerStyle;

  return (
    <div style={columnStyle}>
      {/* Column header */}
      <div style={columnHeaderStyle}>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            backgroundColor: titleColor,
            flexShrink: 0,
          }}
        />
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: titleColor,
            margin: 0,
            letterSpacing: 2,
          }}
        >
          {title}
        </h2>
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: `${titleColor}99`,
            marginLeft: "auto",
          }}
        >
          {orders.length}
        </span>
      </div>

      {/* Orders */}
      <div
        ref={scrollContainerRef}
        style={{
          ...containerStyle,
          overflow: shouldAutoScroll ? "hidden" : containerStyle.overflowY ? undefined : "hidden",
          overflowY: shouldAutoScroll ? "hidden" : containerStyle.overflowY,
        }}
        onWheel={handleUserInteraction}
        onTouchStart={handleUserInteraction}
      >
        <div
          ref={innerRef}
          style={{
            display: isReadyGrid ? "contents" : "flex",
            flexDirection: isReadyGrid ? undefined : "column",
            gap: isReadyGrid ? undefined : 14,
            ...(shouldAutoScroll && scrollDistance > 0
              ? {
                  animation: `customerDisplayAutoScroll ${AUTO_SCROLL_DURATION}s ease-in-out infinite`,
                  // CSS custom property for scroll distance
                  ["--scroll-distance" as string]: `-${scrollDistance}px`,
                }
              : {}),
          }}
        >
          {orders.length === 0 && (
            <div style={emptyStateStyle}>
              <span style={{ fontSize: 40, opacity: 0.3 }}>
                {columnType === "preparing" ? "🍳" : "✅"}
              </span>
              <p
                style={{
                  color: "#525252",
                  fontSize: 18,
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                {columnType === "preparing"
                  ? t("customerDisplay.noOrdersPreparing")
                  : t("customerDisplay.noOrdersPickup")}
              </p>
              <p
                style={{
                  color: "#3f3f3f",
                  fontSize: 14,
                  margin: 0,
                }}
              >
                {columnType === "preparing"
                  ? t("customerDisplay.ordersWillAppear")
                  : t("customerDisplay.readyOrdersWillAppear")}
              </p>
            </div>
          )}
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              columnType={columnType}
              isNewlyReady={newlyReadyIds.has(order.id)}
              readyIdFontSize={readyIdFontSize}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── OrderCard ────────────────────────────────────────────────────── */

function OrderCard({
  order,
  columnType,
  isNewlyReady,
  readyIdFontSize,
  t,
}: {
  order: CoreOrder;
  columnType: ColumnType;
  isNewlyReady: boolean;
  readyIdFontSize: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const isReady = columnType === "ready";
  const borderColor = isReady ? "#22c55e" : "#f59e0b";

  // TTL fading: ready orders approaching expiry fade to 50% opacity
  const readySinceMs = isReady
    ? Date.now() - new Date(order.updated_at ?? order.created_at).getTime()
    : 0;
  const isFading = isReady && readySinceMs > READY_FADE_MS;

  const bgColor = isNewlyReady
    ? "rgba(34,197,94,0.20)"
    : isReady
      ? "rgba(34,197,94,0.08)"
      : "rgba(255,255,255,0.04)";

  const context = order.table_number != null
    ? t("customerDisplay.table", { n: order.table_number })
    : null;

  const cardStyle: React.CSSProperties = {
    padding: isReady ? "24px 28px" : "20px 24px",
    borderRadius: 14,
    backgroundColor: bgColor,
    borderLeft: `5px solid ${borderColor}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    transition: "background-color 2s ease-out, opacity 2s ease-out",
    animation: isNewlyReady
      ? "customerDisplayPulse 0.6s ease-out 3, customerDisplayGlow 3s ease-out 1"
      : "none",
    opacity: isFading ? 0.5 : 1,
  };

  return (
    <div style={cardStyle}>
      {/* Left: ID + context */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{
            fontSize: isReady ? readyIdFontSize : 28,
            fontWeight: 800,
            color: "#fafafa",
            letterSpacing: 1,
            lineHeight: 1.1,
          }}
        >
          {shortId(order)}
        </span>
        {context && (
          <span
            style={{
              fontSize: 15,
              color: "#a3a3a3",
              fontWeight: 600,
            }}
          >
            {context}
          </span>
        )}
      </div>

      {/* Right: contextual time */}
      <span
        style={{
          fontSize: 14,
          color: isReady ? "#22c55e99" : "#737373",
          fontWeight: isReady ? 600 : 500,
          whiteSpace: "nowrap",
        }}
      >
        {isReady
          ? t("customerDisplay.readyAgo", { time: timeAgo(order.updated_at ?? order.created_at) || t("customerDisplay.now") })
          : (timeAgo(order.created_at) || t("customerDisplay.now"))}
      </span>
    </div>
  );
}

/* ── Styles ───────────────────────────────────────────────────────── */

const screenStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#0a0a0a",
  color: "#fafafa",
  fontFamily: "Inter, system-ui, sans-serif",
  minHeight: "100%",
};

const boardStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  backgroundColor: "#0a0a0a",
  color: "#fafafa",
  fontFamily: "Inter, system-ui, sans-serif",
  minHeight: "100%",
  overflow: "hidden",
};

const columnStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const columnHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "24px 28px 20px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const ordersContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "20px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const emptyStateStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  padding: "48px 24px",
  flex: 1,
};
