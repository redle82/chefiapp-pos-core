import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { colors } from "../../../ui/design-system/tokens/colors";
import { useStaff } from "../context/StaffContext";

type DeliveryTab = "home" | "orders" | "map" | "drivers" | "reviews";
type OrderFilter = "all" | "pending" | "active" | "completed";

type DeliveryOrder = {
  id: string;
  status: "pending" | "active" | "completed";
  priorityTone: "critical" | "warning" | "stable";
  priorityLabel: string;
  orderNumber: string;
  customerName: string;
  address: string;
  distanceLabel: string;
  deadlineLabel: string;
  amountLabel: string;
  driverName?: string;
  driverInitials?: string;
  zoneLabel?: string;
};

type DriverStatus = {
  id: string;
  name: string;
  initials: string;
  state: "available" | "delivering" | "offline";
  activeOrders: number;
  zoneLabel: string;
};

const DELIVERY_HOME_BASE = "/app/staff/home/delivery";

const TABS: Array<{ id: DeliveryTab; label: string }> = [
  { id: "home", label: "Painel" },
  { id: "orders", label: "Entregas" },
  { id: "map", label: "Mapa" },
  { id: "drivers", label: "Condutores" },
  { id: "reviews", label: "Avaliações" },
];

function resolveDeliveryTabFromPath(pathname: string): DeliveryTab {
  if (pathname.endsWith("/orders")) return "orders";
  if (pathname.endsWith("/map")) return "map";
  if (pathname.endsWith("/drivers")) return "drivers";
  if (pathname.endsWith("/reviews")) return "reviews";
  return "home";
}

function getDeliveryTabPath(tab: DeliveryTab): string {
  return tab === "home" ? DELIVERY_HOME_BASE : `${DELIVERY_HOME_BASE}/${tab}`;
}

function panelStyle() {
  return {
    backgroundColor: colors.surface.layer1,
    border: `1px solid ${colors.border.subtle}`,
    borderRadius: 18,
    padding: 16,
  } as const;
}

function metricCardStyle() {
  return {
    ...panelStyle(),
    minHeight: 112,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  } as const;
}

function pillStyle(selected: boolean) {
  return {
    border: "none",
    borderRadius: 999,
    padding: "10px 14px",
    backgroundColor: selected ? colors.action.base : colors.surface.layer1,
    color: selected ? colors.action.text : colors.text.secondary,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  } as const;
}

function statusTone(status: DeliveryOrder["status"]) {
  if (status === "completed") {
    return {
      label: "Concluída",
      background: "rgba(34, 197, 94, 0.12)",
      color: colors.success.base,
    };
  }
  if (status === "active") {
    return {
      label: "Em rota",
      background: "rgba(245, 158, 11, 0.14)",
      color: "#f59e0b",
    };
  }
  return {
    label: "Atribuir",
    background: "rgba(59, 130, 246, 0.14)",
    color: "#60a5fa",
  };
}

function driverTone(state: DriverStatus["state"]) {
  if (state === "delivering") {
    return { label: "Em rota", color: "#f59e0b" };
  }
  if (state === "offline") {
    return { label: "Offline", color: colors.text.tertiary };
  }
  return { label: "Disponível", color: colors.success.base };
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: colors.text.tertiary,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );
}

export function DeliveryHome() {
  const { tasks, activeLocation } = useStaff();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const activeTab = resolveDeliveryTabFromPath(pathname);

  const deliveryOrders = useMemo<DeliveryOrder[]>(() => {
    const relevant = tasks.filter(
      (task) =>
        task.assigneeRole === "delivery" ||
        task.type === "delivery" ||
        task.metadata?.channel === "delivery",
    );

    return relevant.map((task, index) => {
      const metadata = (task.metadata ?? {}) as Record<string, unknown>;
      const status: DeliveryOrder["status"] =
        task.status === "done"
          ? "completed"
          : task.status === "focused" || metadata.started === true
          ? "active"
          : "pending";
      const priorityTone: DeliveryOrder["priorityTone"] =
        task.priority === "urgent"
          ? "critical"
          : task.priority === "attention"
          ? "warning"
          : "stable";
      const priorityLabel =
        priorityTone === "critical"
          ? "Pressão alta"
          : priorityTone === "warning"
          ? "Atenção"
          : "No prazo";
      const zoneLabel =
        typeof metadata.zoneLabel === "string" && metadata.zoneLabel.trim()
          ? metadata.zoneLabel.trim()
          : index % 2 === 0
          ? "Zona Ibiza Centro"
          : "Zona Sant Antoni";
      const driverName =
        typeof metadata.driverName === "string" && metadata.driverName.trim()
          ? metadata.driverName.trim()
          : status === "pending"
          ? undefined
          : index % 2 === 0
          ? "Carlos Lima"
          : "Sofia Gastrobar";
      const driverInitials = driverName
        ? driverName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("")
        : "--";

      return {
        id: task.id,
        status,
        priorityTone,
        priorityLabel,
        orderNumber:
          typeof metadata.orderNumber === "string" &&
          metadata.orderNumber.trim()
            ? metadata.orderNumber.trim()
            : `${index + 1}`.padStart(5, "0"),
        customerName: task.title,
        address: task.description,
        distanceLabel:
          typeof metadata.distanceKm === "number"
            ? `${metadata.distanceKm.toFixed(1)} km`
            : "12.4 km",
        deadlineLabel:
          typeof metadata.deadlineLabel === "string" &&
          metadata.deadlineLabel.trim()
            ? metadata.deadlineLabel.trim()
            : "03:34 PM",
        amountLabel:
          typeof metadata.amountLabel === "string" &&
          metadata.amountLabel.trim()
            ? metadata.amountLabel.trim()
            : "EUR 0.00",
        driverName,
        driverInitials,
        zoneLabel,
      };
    });
  }, [tasks]);

  const drivers = useMemo<DriverStatus[]>(() => {
    const entries = new Map<string, DriverStatus>();

    deliveryOrders.forEach((order, index) => {
      const name =
        order.driverName ??
        (index % 2 === 0 ? "Carlos Lima" : "Sofia Gastrobar");
      const state: DriverStatus["state"] =
        order.status === "active"
          ? "delivering"
          : order.status === "pending"
          ? "available"
          : "offline";
      const current = entries.get(name);
      if (current) {
        current.activeOrders += order.status === "active" ? 1 : 0;
        if (current.state !== "delivering" && state === "delivering") {
          current.state = state;
        }
        return;
      }
      entries.set(name, {
        id: `${index}-${name}`,
        name,
        initials:
          order.driverInitials ||
          name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join(""),
        state,
        activeOrders: order.status === "active" ? 1 : 0,
        zoneLabel: order.zoneLabel ?? "Cobertura geral",
      });
    });

    if (entries.size === 0) {
      entries.set("Carlos Lima", {
        id: "fallback-driver",
        name: "Carlos Lima",
        initials: "CL",
        state: "available",
        activeOrders: 0,
        zoneLabel: "Cobertura geral",
      });
    }

    return Array.from(entries.values());
  }, [deliveryOrders]);

  const pendingOrders = deliveryOrders.filter(
    (order) => order.status === "pending",
  );
  const activeOrders = deliveryOrders.filter(
    (order) => order.status === "active",
  );
  const completedOrders = deliveryOrders.filter(
    (order) => order.status === "completed",
  );
  const delayedOrders = deliveryOrders.filter(
    (order) => order.status !== "completed" && order.priorityTone !== "stable",
  );
  const filteredOrders = deliveryOrders.filter((order) => {
    if (orderFilter === "pending") return order.status === "pending";
    if (orderFilter === "active") return order.status === "active";
    if (orderFilter === "completed") return order.status === "completed";
    return true;
  });
  const nextOrder =
    pendingOrders[0] ?? activeOrders[0] ?? deliveryOrders[0] ?? null;
  const activeDrivers = drivers.filter(
    (driver) => driver.state !== "offline",
  ).length;
  const readyDrivers = drivers.filter(
    (driver) => driver.state === "available",
  ).length;
  const avgDistance =
    deliveryOrders.length === 0
      ? "0 km"
      : `${(
          deliveryOrders.reduce((sum, order) => {
            const numeric = Number(order.distanceLabel.replace(/[^0-9.]/g, ""));
            return sum + (Number.isFinite(numeric) ? numeric : 0);
          }, 0) / deliveryOrders.length
        ).toFixed(1)} km`;
  const locationName = activeLocation?.name ?? "Operação em mobilidade";
  const hotspots = Array.from(
    deliveryOrders.reduce((acc, order) => {
      const key = order.zoneLabel ?? "Cobertura geral";
      acc.set(key, (acc.get(key) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2);

  const renderOverview = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          ...panelStyle(),
          display: "grid",
          gap: 14,
          background:
            delayedOrders.length > 0
              ? "linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(20, 20, 20, 0.92))"
              : "linear-gradient(135deg, rgba(34, 197, 94, 0.16), rgba(20, 20, 20, 0.92))",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: colors.text.tertiary,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Painel de despacho
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 24,
              fontWeight: 700,
              color: colors.text.primary,
              lineHeight: 1.1,
            }}
          >
            {pendingOrders.length > 0
              ? `${pendingOrders.length} entrega${
                  pendingOrders.length !== 1 ? "s" : ""
                } a pedir despacho`
              : activeOrders.length > 0
              ? `${activeOrders.length} entrega${
                  activeOrders.length !== 1 ? "s" : ""
                } em campo`
              : "Operação pronta para novo despacho"}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              color: colors.text.secondary,
              lineHeight: 1.5,
            }}
          >
            {locationName} · {readyDrivers} condutor
            {readyDrivers !== 1 ? "es" : ""} pronto
            {readyDrivers !== 1 ? "s" : ""} · {delayedOrders.length} entrega
            {delayedOrders.length !== 1 ? "s" : ""} sob pressão
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            style={pillStyle(true)}
            onClick={() => navigate(getDeliveryTabPath("orders"))}
          >
            Atribuir agora
          </button>
          <button
            type="button"
            style={pillStyle(false)}
            onClick={() => navigate(getDeliveryTabPath("map"))}
          >
            Abrir cobertura
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {[
          { label: "Por atribuir", value: pendingOrders.length },
          { label: "Em rota", value: activeOrders.length },
          { label: "Sob pressão", value: delayedOrders.length },
          { label: "Condutores prontos", value: readyDrivers },
        ].map((item) => (
          <div key={item.label} style={metricCardStyle()}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: colors.text.primary,
              }}
            >
              {item.value}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: colors.text.tertiary,
              }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <div style={panelStyle()}>
        <SectionLabel text="Fila crítica" />
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {(pendingOrders.length > 0 ? pendingOrders : delayedOrders)
            .slice(0, 3)
            .map((order) => (
              <div
                key={order.id}
                style={{
                  display: "grid",
                  gap: 6,
                  padding: "12px 14px",
                  borderRadius: 14,
                  backgroundColor: colors.surface.base,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700 }}>
                    #{order.orderNumber} · {order.customerName}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color:
                        order.priorityTone === "critical"
                          ? colors.destructive.base
                          : order.priorityTone === "warning"
                          ? "#f59e0b"
                          : colors.success.base,
                    }}
                  >
                    {order.priorityLabel}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: colors.text.secondary }}>
                  {order.zoneLabel} · {order.distanceLabel} ·{" "}
                  {order.deadlineLabel}
                </div>
              </div>
            ))}
        </div>
      </div>

      <div style={panelStyle()}>
        <SectionLabel text="Próxima decisão" />
        {nextOrder ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: 12,
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: colors.text.primary,
              }}
            >
              {nextOrder.customerName}
            </div>
            <div style={{ fontSize: 14, color: colors.text.secondary }}>
              #{nextOrder.orderNumber} · {nextOrder.zoneLabel} ·{" "}
              {nextOrder.amountLabel}
            </div>
            <div style={{ fontSize: 14, color: colors.text.secondary }}>
              {nextOrder.address}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                style={pillStyle(true)}
                onClick={() => navigate(getDeliveryTabPath("orders"))}
              >
                Atribuir agora
              </button>
              <button
                type="button"
                style={pillStyle(false)}
                onClick={() => navigate(getDeliveryTabPath("map"))}
              >
                Abrir mapa
              </button>
              <button
                type="button"
                style={pillStyle(false)}
                onClick={() => navigate(getDeliveryTabPath("drivers"))}
              >
                Ver condutores
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              marginTop: 12,
              fontSize: 14,
              color: colors.text.secondary,
            }}
          >
            Sem entregas na fila neste momento.
          </div>
        )}
      </div>

      <div style={panelStyle()}>
        <SectionLabel text="Pulso operacional" />
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: colors.text.primary,
            }}
          >
            {hotspots.length === 0
              ? "Cobertura sem hotspots"
              : `${
                  hotspots[0]?.[0] ?? "Cobertura geral"
                } lidera a pressão do turno`}
          </div>
          <div style={{ fontSize: 14, color: colors.text.secondary }}>
            {activeDrivers} condutor
            {activeDrivers !== 1 ? "es" : ""} monitorizado
            {activeDrivers !== 1 ? "s" : ""} · distância média {avgDistance} ·{" "}
            {completedOrders.length} concluída
            {completedOrders.length !== 1 ? "s" : ""} neste ciclo.
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { id: "all", label: `Todas (${deliveryOrders.length})` },
          { id: "pending", label: `Por atribuir (${pendingOrders.length})` },
          { id: "active", label: `Em rota (${activeOrders.length})` },
          { id: "completed", label: `Concluídas (${completedOrders.length})` },
        ].map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setOrderFilter(filter.id as OrderFilter)}
            style={pillStyle(orderFilter === filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{ ...panelStyle(), textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Fila limpa</div>
          <div
            style={{ marginTop: 8, fontSize: 14, color: colors.text.secondary }}
          >
            Nenhuma entrega nesta aba.
          </div>
        </div>
      ) : (
        filteredOrders.map((order) => {
          const tone = statusTone(order.status);
          return (
            <article
              key={order.id}
              style={{ ...panelStyle(), display: "grid", gap: 12 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: 999,
                    padding: "8px 12px",
                    backgroundColor: tone.background,
                    color: tone.color,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {tone.label}
                </span>
                <span style={{ fontSize: 13, color: colors.text.tertiary }}>
                  {order.distanceLabel} · {order.deadlineLabel}
                </span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                #{order.orderNumber} · {order.customerName}
              </div>
              <div style={{ fontSize: 14, color: colors.text.secondary }}>
                {order.address}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  fontSize: 13,
                  color: colors.text.secondary,
                }}
              >
                <span>{order.zoneLabel}</span>
                <span>{order.amountLabel}</span>
                <span>
                  {order.driverName
                    ? `Condutor: ${order.driverName}`
                    : "Aguardando atribuição"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={pillStyle(order.status === "pending")}
                >
                  {order.status === "pending"
                    ? "Atribuir"
                    : order.status === "active"
                    ? "Abrir rota"
                    : "Rever entrega"}
                </button>
              </div>
            </article>
          );
        })
      )}
    </div>
  );

  const renderMap = () => {
    const zoneCounts = [
      {
        zone: "Ibiza Centro",
        value: deliveryOrders.filter(
          (order) => order.zoneLabel === "Zona Ibiza Centro",
        ).length,
      },
      {
        zone: "Sant Antoni",
        value: deliveryOrders.filter(
          (order) => order.zoneLabel === "Zona Sant Antoni",
        ).length,
      },
      {
        zone: "Cobertura externa",
        value: Math.max(deliveryOrders.length - 2, 0),
      },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            ...panelStyle(),
            minHeight: 260,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{ marginTop: 14, fontSize: 22, fontWeight: 700 }}>
              Cobertura operacional
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 14,
                color: colors.text.secondary,
                lineHeight: 1.5,
              }}
            >
              O mapa entra como radar de zonas, carga e cobertura do turno, sem
              sair da shell do AppStaff.
            </div>
          </div>
        </div>

        <div style={panelStyle()}>
          <SectionLabel text="Zonas" />
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {zoneCounts.map((zone) => (
              <div
                key={zone.zone}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  backgroundColor: colors.surface.base,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {zone.zone}
                </span>
                <span style={{ fontSize: 13, color: colors.text.secondary }}>
                  {zone.value} entrega(s)
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={panelStyle()}>
          <SectionLabel text="Hotspots" />
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {hotspots.length === 0 ? (
              <div style={{ fontSize: 14, color: colors.text.secondary }}>
                Sem zonas críticas neste momento.
              </div>
            ) : (
              hotspots.map(([zone, count]) => (
                <div
                  key={zone}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 12,
                    backgroundColor: colors.surface.base,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{zone}</span>
                  <span style={{ fontSize: 13, color: colors.text.secondary }}>
                    {count} ordem(ns)
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDrivers = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {drivers.map((driver) => {
        const tone = driverTone(driver.state);
        return (
          <div
            key={driver.id}
            style={{
              ...panelStyle(),
              display: "grid",
              gridTemplateColumns: "48px minmax(0, 1fr) auto",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                backgroundColor: colors.action.base,
                color: colors.action.text,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {driver.initials}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{driver.name}</div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  color: colors.text.secondary,
                }}
              >
                {driver.zoneLabel} · {driver.activeOrders} entrega(s) ativa(s)
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: colors.text.tertiary,
                }}
              >
                Último update: há poucos segundos
              </div>
            </div>
            <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: tone.color }}>
                {tone.label}
              </div>
              <button
                type="button"
                style={pillStyle(driver.state === "available")}
              >
                {driver.state === "available" ? "Atribuir" : "Ver rota"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderReviews = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <div style={metricCardStyle()}>
          <div style={{ fontSize: 26, fontWeight: 700 }}>
            {completedOrders.length}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: colors.text.tertiary,
            }}
          >
            Entregas fechadas
          </div>
        </div>
        <div style={metricCardStyle()}>
          <div style={{ fontSize: 26, fontWeight: 700 }}>
            {delayedOrders.length}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: colors.text.tertiary,
            }}
          >
            Casos sob pressão
          </div>
        </div>
      </div>

      <div style={panelStyle()}>
        <SectionLabel text="Leitura operacional" />
        <div
          style={{
            marginTop: 12,
            fontSize: 14,
            color: colors.text.secondary,
            lineHeight: 1.55,
          }}
        >
          Avaliações entram como leitura de SLA e qualidade do turno. Nesta fase
          continuam a ser contexto operacional, não um fluxo autónomo.
        </div>
      </div>

      <div style={{ ...panelStyle(), textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          Leitura qualitativa em construção
        </div>
        <div
          style={{ marginTop: 8, fontSize: 14, color: colors.text.secondary }}
        >
          A próxima iteração liga esta área ao SLA real do serviço em campo.
        </div>
      </div>
    </div>
  );

  const subtitle =
    activeTab === "home"
      ? `${pendingOrders.length} por atribuir · ${activeOrders.length} em rota · ${readyDrivers} prontos`
      : activeTab === "orders"
      ? `${deliveryOrders.length} entrega(s) na fila`
      : activeTab === "map"
      ? "Cobertura e pressão por zona"
      : activeTab === "drivers"
      ? `${drivers.length} condutor(es) monitorizados`
      : "Leitura de SLA e qualidade do turno";

  let content = renderOverview();
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
        padding: 16,
        backgroundColor: colors.surface.base,
        gap: 16,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: colors.text.tertiary,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Entregador
        </div>
        <div
          style={{ fontSize: 24, fontWeight: 700, color: colors.text.primary }}
        >
          {TABS.find((tab) => tab.id === activeTab)?.label ?? "Painel"}
        </div>
        <div style={{ fontSize: 13, color: colors.text.secondary }}>
          {subtitle}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          padding: 4,
          borderRadius: 999,
          backgroundColor: colors.surface.layer1,
          overflowX: "auto",
        }}
      >
        {TABS.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => navigate(getDeliveryTabPath(tab.id))}
              style={{
                flex: tab.id === "home" ? undefined : 1,
                minWidth: 88,
                whiteSpace: "nowrap",
                ...pillStyle(selected),
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        aria-label={TABS.find((tab) => tab.id === activeTab)?.label ?? "Painel"}
        style={{ flex: 1, minHeight: 0, overflow: "auto", paddingBottom: 8 }}
      >
        {content}
      </div>
    </div>
  );
}
