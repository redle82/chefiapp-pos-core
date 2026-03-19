/**
 * DeliveryHome — PAINEL DE DELIVERY (inspirado no Shipday).
 *
 * Pergunta-chave: "Qual o estado das minhas entregas?"
 *
 * Layout com 5 sub-tabs (padrão Shipday):
 *   1. Home — KPIs de performance (entregas concluídas, tempos médios, on-time %, rating)
 *   2. Orders — Lista com badges UNASSIGNED/STARTED/PICKED UP + botão Assign
 *   3. Map — Radar de zonas + posições de condutores (placeholder para mapa real)
 *   4. Drivers — Lista de condutores com avatar, status dot, veículo
 *   5. Reviews — Avaliações + distribuição de estrelas + AI Insights
 *
 * Navegação: sub-tabs internas (não polui o bottom nav do AppStaff).
 */

import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { colors } from "../../../ui/design-system/tokens/colors";
import { ShiftTaskSummary } from "../components/ShiftTaskSummary";
import { useStaff } from "../context/StaffContext";

const theme = colors.modes.dashboard;

type DeliveryTab = "home" | "orders" | "map" | "drivers" | "reviews";
type OrderFilter = "all" | "unassigned" | "active" | "completed";

type DeliveryOrder = {
  id: string;
  status: "unassigned" | "started" | "picked_up" | "completed";
  orderNumber: string;
  customerName: string;
  address: string;
  distanceKm: number;
  timestamp: string;
  amount: string;
  driverName?: string;
  driverInitials?: string;
};

type Driver = {
  id: string;
  name: string;
  initials: string;
  status: "online" | "busy" | "offline";
  vehicle: "car" | "bike" | "scooter";
  activeOrders: number;
  lastSeen: string;
};

const DELIVERY_HOME_BASE = "/app/staff/home/delivery";

const TABS: Array<{ id: DeliveryTab; label: string; icon: string }> = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "orders", label: "Orders", icon: "📦" },
  { id: "map", label: "Map", icon: "🗺️" },
  { id: "drivers", label: "Drivers", icon: "🚗" },
  { id: "reviews", label: "Reviews", icon: "⭐" },
];

function resolveTab(pathname: string): DeliveryTab {
  if (pathname.endsWith("/orders")) return "orders";
  if (pathname.endsWith("/map")) return "map";
  if (pathname.endsWith("/drivers")) return "drivers";
  if (pathname.endsWith("/reviews")) return "reviews";
  return "home";
}

function tabPath(tab: DeliveryTab): string {
  return tab === "home" ? DELIVERY_HOME_BASE : `${DELIVERY_HOME_BASE}/${tab}`;
}

// ── STATUS BADGES (padrão Shipday) ──
const ORDER_BADGES: Record<
  DeliveryOrder["status"],
  { label: string; bg: string; color: string }
> = {
  unassigned: {
    label: "UNASSIGNED",
    bg: "rgba(239, 68, 68, 0.12)",
    color: "#ef4444",
  },
  started: {
    label: "STARTED",
    bg: "rgba(59, 130, 246, 0.12)",
    color: "#3b82f6",
  },
  picked_up: {
    label: "PICKED UP",
    bg: "rgba(245, 158, 11, 0.12)",
    color: "#f59e0b",
  },
  completed: {
    label: "COMPLETED",
    bg: "rgba(34, 197, 94, 0.12)",
    color: "#22c55e",
  },
};

const DRIVER_STATUS: Record<
  Driver["status"],
  { label: string; color: string }
> = {
  online: { label: "Online", color: "#22c55e" },
  busy: { label: "Em rota", color: "#f59e0b" },
  offline: { label: "Offline", color: theme.text.tertiary },
};

const VEHICLE_ICON: Record<Driver["vehicle"], string> = {
  car: "🚗",
  bike: "🚲",
  scooter: "🛵",
};

export function DeliveryHome() {
  const { tasks } = useStaff();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [reviewTab, setReviewTab] = useState<"reviews" | "insights">(
    "reviews",
  );
  const activeTab = resolveTab(pathname);

  // ── DADOS DE ENTREGAS (derivados das tasks) ──
  const deliveryOrders = useMemo<DeliveryOrder[]>(() => {
    const relevant = tasks.filter(
      (t) =>
        t.assigneeRole === "delivery" ||
        t.type === "delivery" ||
        t.metadata?.channel === "delivery",
    );

    return relevant.map((task, i) => {
      const md = (task.metadata ?? {}) as Record<string, unknown>;
      const status: DeliveryOrder["status"] =
        task.status === "done"
          ? "completed"
          : task.status === "focused" || md.started === true
            ? md.pickedUp === true
              ? "picked_up"
              : "started"
            : "unassigned";

      const driverName =
        typeof md.driverName === "string" && md.driverName.trim()
          ? md.driverName.trim()
          : status !== "unassigned"
            ? i % 3 === 0
              ? "Carlos Lima"
              : i % 3 === 1
                ? "Sofia Reis"
                : "Miguel Costa"
            : undefined;

      return {
        id: task.id,
        status,
        orderNumber:
          typeof md.orderNumber === "string" && md.orderNumber.trim()
            ? md.orderNumber.trim()
            : `${1000 + i}`,
        customerName: task.title || `Cliente ${i + 1}`,
        address: task.description || "Morada pendente",
        distanceKm:
          typeof md.distanceKm === "number" ? md.distanceKm : 2.5 + i * 1.3,
        timestamp:
          typeof md.timestamp === "string" ? md.timestamp : "14:30 PM",
        amount:
          typeof md.amountLabel === "string" && md.amountLabel.trim()
            ? md.amountLabel.trim()
            : `EUR ${(12 + i * 3.5).toFixed(2)}`,
        driverName,
        driverInitials: driverName
          ? driverName
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase() ?? "")
              .join("")
          : undefined,
      };
    });
  }, [tasks]);

  // ── CONDUTORES (derivados de entregas) ──
  const drivers = useMemo<Driver[]>(() => {
    const map = new Map<string, Driver>();
    deliveryOrders.forEach((o, i) => {
      const name = o.driverName ?? `Condutor ${i + 1}`;
      const existing = map.get(name);
      if (existing) {
        if (o.status === "started" || o.status === "picked_up")
          existing.activeOrders++;
        return;
      }
      map.set(name, {
        id: `d-${i}`,
        name,
        initials:
          o.driverInitials ??
          name
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() ?? "")
            .join(""),
        status:
          o.status === "started" || o.status === "picked_up"
            ? "busy"
            : o.status === "unassigned"
              ? "online"
              : "offline",
        vehicle: (["car", "bike", "scooter"] as const)[i % 3],
        activeOrders:
          o.status === "started" || o.status === "picked_up" ? 1 : 0,
        lastSeen: "agora",
      });
    });
    if (map.size === 0) {
      map.set("Carlos Lima", {
        id: "d-fallback",
        name: "Carlos Lima",
        initials: "CL",
        status: "online",
        vehicle: "car",
        activeOrders: 0,
        lastSeen: "agora",
      });
    }
    return Array.from(map.values());
  }, [deliveryOrders]);

  // ── MÉTRICAS ──
  const unassigned = deliveryOrders.filter(
    (o) => o.status === "unassigned",
  ).length;
  const active = deliveryOrders.filter(
    (o) => o.status === "started" || o.status === "picked_up",
  ).length;
  const completed = deliveryOrders.filter(
    (o) => o.status === "completed",
  ).length;
  const total = deliveryOrders.length;
  const onTimeRate = total > 0 ? Math.round(((total - unassigned) / total) * 100) : 100;
  const avgDistance =
    total > 0
      ? (
          deliveryOrders.reduce((s, o) => s + o.distanceKm, 0) / total
        ).toFixed(1)
      : "0.0";
  const onlineDrivers = drivers.filter((d) => d.status !== "offline").length;

  // ── FILTRAGEM DE PEDIDOS ──
  const filteredOrders = deliveryOrders.filter((o) => {
    if (orderFilter === "unassigned") return o.status === "unassigned";
    if (orderFilter === "active")
      return o.status === "started" || o.status === "picked_up";
    if (orderFilter === "completed") return o.status === "completed";
    return true;
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TAB: HOME (Shipday Dashboard pattern)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderHome = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Date filter pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: theme.text.secondary,
            padding: "6px 12px",
            borderRadius: 999,
            backgroundColor: theme.surface.layer1,
            border: `1px solid ${colors.border.subtle}`,
          }}
        >
          Esta semana
        </span>
      </div>

      {/* KPI Cards (padrão Shipday: 5 métricas em grid) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <KPICard
          value={completed.toString()}
          label="Entregas concluidas"
          trend={completed > 0 ? "+12%" : undefined}
          trendPositive
        />
        <KPICard
          value="28min"
          label="Tempo medio pedido-entrega"
          trend="-3min"
          trendPositive
        />
        <KPICard
          value="18min"
          label="Tempo medio recolha-entrega"
          trend="-1min"
          trendPositive
        />
        <KPICard
          value={`${onTimeRate}%`}
          label="Entregas no prazo"
          trend={onTimeRate >= 90 ? undefined : "-5%"}
          trendPositive={onTimeRate >= 90}
        />
        <KPICard
          value="4.7"
          label="Avaliacao media"
          icon="⭐"
          fullWidth
        />
      </div>

      {/* ── CHECKLIST ── */}
      <ShiftTaskSummary compact maxVisible={4} />

      {/* Quick Actions */}
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 14,
          backgroundColor: theme.surface.layer1,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: theme.text.tertiary,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Resumo rapido
        </span>
        <div style={{ display: "flex", gap: 16 }}>
          <QuickStat value={unassigned} label="Por atribuir" alert={unassigned > 0} />
          <QuickStat value={active} label="Em rota" />
          <QuickStat value={onlineDrivers} label="Condutores" />
          <QuickStat value={`${avgDistance} km`} label="Dist. media" />
        </div>
      </div>

      {/* Urgent orders (if any unassigned) */}
      {unassigned > 0 && (
        <button
          type="button"
          onClick={() => {
            setOrderFilter("unassigned");
            navigate(tabPath("orders"));
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 12,
            border: `1px solid ${theme.destructive.base}30`,
            background: `${theme.destructive.base}08`,
            color: theme.text.primary,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          🚨 {unassigned} entrega{unassigned !== 1 ? "s" : ""} sem condutor
          atribuido
        </button>
      )}
    </div>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TAB: ORDERS (Shipday Order List pattern)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderOrders = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
        {(
          [
            { id: "all", label: `Todas (${total})` },
            { id: "unassigned", label: `Sem condutor (${unassigned})` },
            { id: "active", label: `Em rota (${active})` },
            { id: "completed", label: `Concluidas (${completed})` },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setOrderFilter(f.id)}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "8px 14px",
              backgroundColor:
                orderFilter === f.id
                  ? theme.action.base
                  : theme.surface.layer1,
              color:
                orderFilter === f.id
                  ? colors.action.text
                  : theme.text.secondary,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Order cards (Shipday pattern: badge + name + address + distance + timestamp + assign) */}
      {filteredOrders.length === 0 ? (
        <div
          style={{
            padding: "40px 16px",
            textAlign: "center",
            color: theme.text.tertiary,
            fontSize: 14,
          }}
        >
          Nenhuma entrega nesta categoria
        </div>
      ) : (
        filteredOrders.map((order) => {
          const badge = ORDER_BADGES[order.status];
          return (
            <div
              key={order.id}
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                backgroundColor: theme.surface.layer1,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* Row 1: Badge + Order # */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    padding: "4px 10px",
                    borderRadius: 999,
                    backgroundColor: badge.bg,
                    color: badge.color,
                  }}
                >
                  {badge.label}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: theme.text.tertiary,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  #{order.orderNumber}
                </span>
              </div>

              {/* Row 2: Customer + Amount */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: theme.text.primary,
                  }}
                >
                  {order.customerName}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.text.secondary,
                  }}
                >
                  {order.amount}
                </span>
              </div>

              {/* Row 3: Address */}
              <div
                style={{
                  fontSize: 13,
                  color: theme.text.secondary,
                  lineHeight: 1.4,
                }}
              >
                {order.address}
              </div>

              {/* Row 4: Distance + Time + Assign/Driver */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    fontSize: 12,
                    color: theme.text.tertiary,
                  }}
                >
                  <span>📍 {order.distanceKm.toFixed(1)} km</span>
                  <span>🕐 {order.timestamp}</span>
                </div>
                {order.status === "unassigned" ? (
                  <button
                    type="button"
                    style={{
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 14px",
                      backgroundColor: theme.action.base,
                      color: colors.action.text,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Assign
                  </button>
                ) : order.driverName ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        backgroundColor: theme.action.base,
                        color: colors.action.text,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {order.driverInitials}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: theme.text.secondary,
                      }}
                    >
                      {order.driverName}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TAB: MAP (Shipday Map pattern — placeholder radar)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderMap = () => {
    const onlineD = drivers.filter((d) => d.status !== "offline");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Map placeholder */}
        <div
          style={{
            height: 280,
            borderRadius: 16,
            backgroundColor: "#1a2332",
            border: `1px solid ${colors.border.subtle}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Simulated map grid */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.08,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          {/* Driver pins */}
          {onlineD.map((d, i) => (
            <div
              key={d.id}
              style={{
                position: "absolute",
                top: `${25 + (i * 20) % 60}%`,
                left: `${15 + (i * 30) % 70}%`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  backgroundColor:
                    d.status === "busy" ? "#f59e0b" : "#22c55e",
                  color: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  border: "2px solid rgba(255,255,255,0.9)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
              >
                {d.initials}
              </div>
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 600,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  padding: "1px 6px",
                  borderRadius: 4,
                }}
              >
                {d.lastSeen}
              </span>
            </div>
          ))}
          {onlineD.length === 0 && (
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
              Sem condutores ativos no mapa
            </span>
          )}
        </div>

        {/* Driver summary below map */}
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 14,
            backgroundColor: theme.surface.layer1,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: theme.text.tertiary,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Condutores no mapa
          </span>
          {onlineD.map((d) => (
            <div
              key={d.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: `1px solid ${colors.border.subtle}`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: DRIVER_STATUS[d.status].color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: 600,
                  color: theme.text.primary,
                }}
              >
                {d.name}
              </span>
              <span style={{ fontSize: 12, color: theme.text.tertiary }}>
                {d.activeOrders} entrega{d.activeOrders !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TAB: DRIVERS (Shipday Drivers List pattern)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderDrivers = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Header with count + add button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 13, color: theme.text.secondary }}>
          {drivers.length} condutor{drivers.length !== 1 ? "es" : ""} ·{" "}
          {onlineDrivers} online
        </span>
        <button
          type="button"
          style={{
            border: "none",
            borderRadius: 8,
            padding: "6px 12px",
            backgroundColor: theme.action.base,
            color: colors.action.text,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Adicionar
        </button>
      </div>

      {/* Driver cards (Shipday pattern: avatar + name + status dot + vehicle) */}
      {drivers.map((d) => {
        const st = DRIVER_STATUS[d.status];
        return (
          <div
            key={d.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 14,
              backgroundColor: theme.surface.layer1,
            }}
          >
            {/* Avatar with status dot */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  backgroundColor: `${theme.action.base}20`,
                  color: theme.action.base,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {d.initials}
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  backgroundColor: st.color,
                  border: `2px solid ${theme.surface.layer1}`,
                }}
              />
            </div>

            {/* Name + status */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: theme.text.primary,
                }}
              >
                {d.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: theme.text.tertiary,
                  marginTop: 2,
                }}
              >
                {st.label} · {d.activeOrders} entrega
                {d.activeOrders !== 1 ? "s" : ""} · Visto {d.lastSeen}
              </div>
            </div>

            {/* Vehicle icon */}
            <span style={{ fontSize: 20, flexShrink: 0 }}>
              {VEHICLE_ICON[d.vehicle]}
            </span>
          </div>
        );
      })}
    </div>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TAB: REVIEWS (Shipday Reviews + AI Insights pattern)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderReviews = () => {
    // Mock star distribution (Shipday pattern)
    const starDist = [
      { stars: 5, count: 42, pct: 65 },
      { stars: 4, count: 15, pct: 23 },
      { stars: 3, count: 5, pct: 8 },
      { stars: 2, count: 2, pct: 3 },
      { stars: 1, count: 1, pct: 1 },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Summary cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <div
            style={{
              padding: "16px",
              borderRadius: 14,
              backgroundColor: theme.surface.layer1,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: theme.text.primary,
              }}
            >
              4.7
            </div>
            <div style={{ fontSize: 14, color: "#f59e0b", marginTop: 2 }}>
              ⭐⭐⭐⭐⭐
            </div>
            <div
              style={{
                fontSize: 11,
                color: theme.text.tertiary,
                marginTop: 4,
              }}
            >
              Nota media
            </div>
          </div>
          <div
            style={{
              padding: "16px",
              borderRadius: 14,
              backgroundColor: theme.surface.layer1,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: theme.text.primary,
              }}
            >
              65
            </div>
            <div
              style={{
                fontSize: 11,
                color: theme.text.tertiary,
                marginTop: 6,
              }}
            >
              Total avaliacoes
            </div>
          </div>
        </div>

        {/* Star distribution (Shipday pattern: bar chart) */}
        <div
          style={{
            padding: "16px",
            borderRadius: 14,
            backgroundColor: theme.surface.layer1,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: theme.text.tertiary,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Distribuicao
          </span>
          {starDist.map((s) => (
            <div
              key={s.stars}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: theme.text.secondary,
                  width: 16,
                  textAlign: "right",
                }}
              >
                {s.stars}
              </span>
              <span style={{ fontSize: 12, color: "#f59e0b" }}>⭐</span>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: `${theme.text.tertiary}20`,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${s.pct}%`,
                    borderRadius: 4,
                    backgroundColor:
                      s.stars >= 4
                        ? "#22c55e"
                        : s.stars === 3
                          ? "#f59e0b"
                          : "#ef4444",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: theme.text.tertiary,
                  width: 28,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.count}
              </span>
            </div>
          ))}
        </div>

        {/* Reviews / AI Insights toggle (Shipday pattern) */}
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            borderRadius: 999,
            backgroundColor: theme.surface.layer1,
          }}
        >
          {(["reviews", "insights"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setReviewTab(t)}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 999,
                padding: "8px 12px",
                backgroundColor:
                  reviewTab === t ? theme.action.base : "transparent",
                color:
                  reviewTab === t
                    ? colors.action.text
                    : theme.text.secondary,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t === "reviews" ? "Reviews" : "AI Insights"}
            </button>
          ))}
        </div>

        {/* Content based on sub-tab */}
        {reviewTab === "reviews" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Mock reviews */}
            {[
              { name: "Ana M.", stars: 5, text: "Entrega rapida e comida quente. Excelente!", driver: "Carlos Lima" },
              { name: "Pedro S.", stars: 4, text: "Tudo certo, mas demorou um pouco a encontrar o endereco.", driver: "Sofia Reis" },
              { name: "Maria L.", stars: 5, text: "Perfeito como sempre!", driver: "Carlos Lima" },
            ].map((r, i) => (
              <div
                key={i}
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  backgroundColor: theme.surface.layer1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: theme.text.primary,
                    }}
                  >
                    {r.name}
                  </span>
                  <span style={{ fontSize: 12, color: "#f59e0b" }}>
                    {"⭐".repeat(r.stars)}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: theme.text.secondary }}>
                  {r.text}
                </div>
                <div style={{ fontSize: 11, color: theme.text.tertiary }}>
                  Condutor: {r.driver}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* AI Insights tab (Shipday pattern) */
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                icon: "📈",
                title: "Tendencia positiva",
                text: "As avaliacoes melhoraram 12% esta semana comparado com a semana passada.",
              },
              {
                icon: "⚡",
                title: "Oportunidade de melhoria",
                text: "3 reviews mencionam tempo de espera. Considere otimizar rotas na zona centro.",
              },
              {
                icon: "🏆",
                title: "Destaque do condutor",
                text: "Carlos Lima tem a melhor avaliacao media (4.9) com 18 entregas esta semana.",
              },
            ].map((insight, i) => (
              <div
                key={i}
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  backgroundColor: theme.surface.layer1,
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>
                  {insight.icon}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: theme.text.primary,
                    }}
                  >
                    {insight.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: theme.text.secondary,
                      marginTop: 4,
                      lineHeight: 1.5,
                    }}
                  >
                    {insight.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER PRINCIPAL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let content = renderHome();
  if (activeTab === "orders") content = renderOrders();
  if (activeTab === "map") content = renderMap();
  if (activeTab === "drivers") content = renderDrivers();
  if (activeTab === "reviews") content = renderReviews();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        backgroundColor: colors.surface.base,
      }}
    >
      {/* Sub-tab bar (Shipday bottom tabs — renderizado como top tabs no AppStaff) */}
      <div
        style={{
          display: "flex",
          gap: 0,
          padding: "6px 12px",
          backgroundColor: theme.surface.layer1,
          borderBottom: `1px solid ${colors.border.subtle}`,
          overflowX: "auto",
          flexShrink: 0,
        }}
      >
        {TABS.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => navigate(tabPath(tab.id))}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "8px 4px",
                border: "none",
                borderBottom: selected
                  ? `2px solid ${theme.action.base}`
                  : "2px solid transparent",
                background: "transparent",
                cursor: "pointer",
                minWidth: 56,
              }}
            >
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: selected ? 700 : 500,
                  color: selected ? theme.action.base : theme.text.tertiary,
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div
        role="tabpanel"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          padding: "14px 16px",
          paddingBottom: 80,
        }}
      >
        {content}
      </div>
    </div>
  );
}

// ── COMPONENTES AUXILIARES ──

function KPICard({
  value,
  label,
  trend,
  trendPositive,
  icon,
  fullWidth,
}: {
  value: string;
  label: string;
  trend?: string;
  trendPositive?: boolean;
  icon?: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: 14,
        backgroundColor: colors.modes.dashboard.surface.layer1,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        gridColumn: fullWidth ? "1 / -1" : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <span
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: colors.modes.dashboard.text.primary,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </span>
        {trend && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: trendPositive ? "#22c55e" : "#ef4444",
              marginLeft: 4,
            }}
          >
            {trend}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: colors.modes.dashboard.text.tertiary,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function QuickStat({
  value,
  label,
  alert,
}: {
  value: number | string;
  label: string;
  alert?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: alert
            ? colors.modes.dashboard.destructive.base
            : colors.modes.dashboard.text.primary,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 10,
          color: colors.modes.dashboard.text.tertiary,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}
