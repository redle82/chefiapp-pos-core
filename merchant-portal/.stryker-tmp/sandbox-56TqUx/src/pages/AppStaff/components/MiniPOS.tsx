// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ContextEngineProvider } from "../../../core/context";
import { useKeyboardShortcuts } from "../../../ui/hooks/useKeyboardShortcuts";
import { StaffLayout } from "../../../ui/design-system/layouts/StaffLayout";
import { Button } from "../../../ui/design-system/Button";
import { Card } from "../../../ui/design-system/Card";
import { Text } from "../../../ui/design-system/primitives/Text";
import { colors } from "../../../ui/design-system/tokens/colors";
import { TablePanel } from "../../Waiter/TablePanel";
import { useStaff } from "../context/StaffContext";
import type { Task } from "../context/StaffCoreTypes";
import { ScannerService } from "../core/ScannerService";
import { useAppStaffTables } from "../hooks/useAppStaffTables";

export interface MiniPOSProps {
  tasks: Task[];
  /** Mesa a preselecionar (ex.: vindo de WaiterHome). Query ?tableId= ou state.tableId. */
  initialTableId?: string | null;
}

// --- Last.app-inspired table status colors ---
const TABLE_COLORS: Record<string, { bg: string; text: string }> = {
  free: { bg: "#27272a", text: "#71717a" },
  occupied: { bg: "#3b82f6", text: "#ffffff" },
  reserved: { bg: "#f59e0b", text: "#000000" },
  payment: { bg: "#10b981", text: "#ffffff" },
  alert: { bg: "#ef4444", text: "#ffffff" },
};

// --- Room/area configuration ---
const ROOMS = [
  { id: "main", label: "Sala Principal" },
  { id: "terrace", label: "Terraço" },
  { id: "bar", label: "Bar" },
];

// TableCircle — Last.app-inspired circular table indicator with press feedback
const TableCircle = ({
  number,
  status,
  guests,
  time,
  onClick,
}: {
  number: number;
  status: string;
  guests?: number;
  time?: string;
  onClick: () => void;
}) => {
  const [pressed, setPressed] = useState(false);
  const c = TABLE_COLORS[status] || TABLE_COLORS.free;

  return (
    <div
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: "100%",
        aspectRatio: "1/1",
        borderRadius: "50%",
        backgroundColor: c.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "transform 0.1s ease, box-shadow 0.1s ease",
        transform: pressed ? "scale(0.92)" : "scale(1)",
        boxShadow: status !== "free" ? `0 0 0 3px ${c.bg}33` : "none",
        position: "relative",
        userSelect: "none",
      }}
    >
      <span
        style={{
          color: c.text,
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: -0.5,
          lineHeight: 1,
        }}
      >
        M{number}
      </span>
      {guests != null && guests > 0 && (
        <span
          style={{
            color: c.text,
            fontSize: 10,
            fontWeight: 600,
            marginTop: 3,
            opacity: 0.9,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          👤 {guests}
        </span>
      )}
      {time && (
        <span
          style={{
            color: c.text,
            fontSize: 9,
            fontWeight: 500,
            marginTop: 1,
            fontFamily: "monospace",
            opacity: 0.75,
          }}
        >
          {time}
        </span>
      )}
    </div>
  );
};

export const MiniPOS: React.FC<MiniPOSProps> = ({
  tasks,
  initialTableId = null,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurantId } = useStaff();
  const [activeTab, setActiveTab] = useState("tables");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(
    initialTableId ?? null,
  );

  useEffect(() => {
    setSelectedTableId(initialTableId ?? null);
  }, [initialTableId]);

  const [selectedRoom, setSelectedRoom] = useState("main");
  const {
    tables: appStaffTables,
    loading,
    error,
    refetch,
  } = useAppStaffTables(restaurantId);
  const tables = appStaffTables.map((table) => ({
    id: table.id,
    number: table.number,
    status: table.status,
    seats: table.seats,
  }));
  const occupiedCount = tables.filter((t) => t.status === "occupied").length;

  // Mapping Keyboard Shortcuts
  useKeyboardShortcuts(
    {
      "mod+n": (e) => {
        e.preventDefault();
        setActiveTab("order");
      },
      "mod+m": (e) => {
        e.preventDefault();
        setActiveTab("tables");
      },
      "mod+d": (e) => {
        e.preventDefault();
        setActiveTab("menu");
      },
      esc: (e) => {
        if (selectedTableId) {
          e.preventDefault();
          setSelectedTableId(null);
        }
      },
    },
    [selectedTableId],
  );

  const attentionTasks = tasks.filter(
    (t) => t.priority === "attention" || t.priority === "critical",
  );

  const handleNavigate = (tab: string) => {
    if (tab === "exit") {
      // APPSTAFF_LAUNCHER_NAVIGATION_CONTRACT: dentro do staff, "Sair" volta ao launcher (evita loop)
      if (location.pathname.startsWith("/app/staff")) {
        navigate("/app/staff/home");
      } else {
        navigate("/app/dashboard");
      }
    } else {
      setActiveTab(tab);
      setSelectedTableId(null); // Reset detail view
    }
  };

  const handleScan = async () => {
    const result = await ScannerService.scan();
    if (result) {
      // Check if result matches a table ID
      const table = tables.find((t) => t.id === result);
      if (table) {
        setSelectedTableId(table.id);
      } else {
        alert(`QR Code não reconhecido: ${result}`);
      }
    }
  };

  // Render Table Detail (TablePanel)
  if (selectedTableId) {
    return (
      <ContextEngineProvider userRole="waiter" hasTPV={true}>
        <TablePanel
          tableId={selectedTableId}
          onBack={() => setSelectedTableId(null)}
        />
      </ContextEngineProvider>
    );
  }

  return (
    <StaffLayout
      title={
        activeTab === "tables"
          ? ROOMS.find((r) => r.id === selectedRoom)?.label || "Salão Principal"
          : activeTab === "order"
          ? "Nova Comanda"
          : "Menu Digital"
      }
      userName="Waiter"
      role="Waiter"
      status="active"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          paddingBottom: 64,
        }}
      >
        {/* Tabs internas do TPV — mantém bottom nav global do StaffShell */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: 4,
            borderRadius: 999,
            backgroundColor: colors.surface.layer1,
            alignSelf: "flex-start",
          }}
        >
          {[
            { id: "tables", label: "Salão" },
            { id: "order", label: "Comanda" },
            { id: "menu", label: "Menu" },
          ].map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleNavigate(tab.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: selected
                    ? colors.action.base
                    : "transparent",
                  color: selected ? colors.action.text : colors.text.secondary,
                  transition: "transform 0.08s ease",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* HEADS UP DISPLAY - ALERTS (Global) */}
        {attentionTasks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {attentionTasks.map((task) => (
              <Card
                key={task.id}
                surface="layer3"
                padding="md"
                style={{
                  borderLeft: `4px solid ${
                    task.priority === "critical"
                      ? colors.destructive.base
                      : colors.warning.base
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <Text size="lg">
                      {task.priority === "critical" ? "🔥" : "⚠️"}
                    </Text>
                    <Text
                      size="xs"
                      weight="bold"
                      color="secondary"
                      style={{ textTransform: "uppercase" }}
                    >
                      {task.title}
                    </Text>
                  </div>
                  <Text size="sm" color="primary">
                    {task.description}
                  </Text>
                </div>
                <Button size="sm" tone="neutral">
                  OK
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* VIEW SWITCHER */}
        {activeTab === "tables" && (
          <div className="animate-fade-in">
            {/* Room Tabs — Last.app style pill selector */}
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 12,
                marginBottom: 12,
                scrollbarWidth: "none",
              }}
            >
              {ROOMS.map((room) => {
                const isActive = selectedRoom === room.id;
                const count = room.id === "main" ? occupiedCount : 0;
                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 20,
                      border: "none",
                      background: isActive
                        ? colors.action.base
                        : colors.surface.layer2,
                      color: isActive ? "#fff" : colors.text.secondary,
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {room.label}
                    {count > 0 && (
                      <span
                        style={{
                          background: isActive
                            ? "rgba(255,255,255,0.25)"
                            : colors.surface.layer3,
                          borderRadius: 10,
                          padding: "1px 7px",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Actions Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                size="xs"
                weight="bold"
                color="tertiary"
                style={{ textTransform: "uppercase", letterSpacing: 2 }}
              >
                Mesas {loading && "(...)"}
              </Text>
              <button
                onClick={handleScan}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: `1px solid ${colors.border.subtle}`,
                  background: colors.surface.layer1,
                  cursor: "pointer",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.text.secondary,
                }}
                title="Scan QR"
              >
                📷
              </button>
            </div>

            {/* Error state */}
            {error && (
              <Card
                surface="layer3"
                padding="md"
                style={{ borderLeft: `4px solid ${colors.destructive.base}` }}
              >
                <Text size="sm" color="primary" style={{ marginBottom: 12 }}>
                  Não foi possível carregar as mesas. Tente novamente.
                </Text>
                <Button size="sm" tone="primary" onClick={() => refetch()}>
                  Tentar novamente
                </Button>
              </Card>
            )}

            {/* Table Grid — 4 columns, circular indicators */}
            {!error && (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 12,
                    padding: "4px 0",
                  }}
                >
                  {tables
                    .sort((a, b) => a.number - b.number)
                    .map((t) => (
                      <TableCircle
                        key={t.id}
                        number={t.number}
                        status={t.status}
                        guests={
                          t.status === "occupied" ? t.seats || 2 : undefined
                        }
                        time={t.status === "occupied" ? "On" : undefined}
                        onClick={() => setSelectedTableId(t.id)}
                      />
                    ))}
                </div>
                {!loading && tables.length === 0 && (
                  <Text
                    size="sm"
                    color="tertiary"
                    style={{ textAlign: "center", padding: 32 }}
                  >
                    Nenhuma mesa configurada.
                  </Text>
                )}

                {/* Status Legend */}
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    justifyContent: "center",
                    marginTop: 20,
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    { status: "free", label: "Livre" },
                    { status: "occupied", label: "Ocupada" },
                    { status: "alert", label: "Alerta" },
                    { status: "reserved", label: "Reserva" },
                    { status: "payment", label: "Pagamento" },
                  ].map((s) => (
                    <div
                      key={s.status}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor: (
                            TABLE_COLORS[s.status] || TABLE_COLORS.free
                          ).bg,
                        }}
                      />
                      <Text size="xs" color="tertiary">
                        {s.label}
                      </Text>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Comanda (estado vazio) */}
        {activeTab === "order" && (
          // ... same ...
          <div className="flex flex-col items-center justify-center h-64 animate-fade-in">
            <div className="text-4xl mb-4">📝</div>
            <Text size="lg" weight="bold">
              Comanda vazia
            </Text>
            <Text size="sm" color="tertiary" style={{ marginTop: 8 }}>
              Abra uma mesa no Salão para iniciar uma comanda.
            </Text>
            <Button
              style={{ marginTop: 24 }}
              onClick={() => setActiveTab("tables")}
            >
              Ir para Mesas
            </Button>
          </div>
        )}

        {activeTab === "menu" && (
          <div className="flex flex-col items-center justify-center h-64 animate-fade-in">
            <div className="text-4xl mb-4">🍔</div>
            <Text size="lg" weight="bold">
              Menu Digital
            </Text>
            <Text size="sm" color="tertiary" style={{ marginTop: 8 }}>
              Use o Salão para selecionar uma mesa e enviar pedidos.
            </Text>
            <Button
              style={{ marginTop: 24 }}
              onClick={() => setActiveTab("tables")}
            >
              Ir para Mesas
            </Button>
          </div>
        )}
      </div>
    </StaffLayout>
  );
};
