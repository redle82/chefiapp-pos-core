import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { currencyService } from "../../../core/currency/CurrencyService";
import { Card } from "../Card";
import { Text } from "../primitives/Text";
import { colors } from "../tokens/colors";
import { spacing } from "../tokens/spacing";

// Define Table interface locally or import (ideally import but avoiding huge refactor, redefining for now or importing from logic layer)
// Importing from context seems cleanest but it's in pages/TPV/context.
// For UI component, let's keep it pure and define interface props.
export interface TableData {
  id: string;
  number: number;
  status: "free" | "occupied" | "reserved";
  seats: number;
  x?: number;
  y?: number;
  /** Zone label (e.g. "Salão", "Esplanada") — used for grid grouping */
  zone?: string;
  /** ISO timestamp when table was occupied — used for elapsed-time display */
  seatedAt?: string | null;
  // SEMANA 1 - Tarefa 1.1: Informações do pedido ativo
  orderInfo?: {
    id: string;
    status:
      | "new"
      | "preparing"
      | "ready"
      | "served"
      | "paid"
      | "partially_paid"
      | "cancelled";
    total: number; // em centavos
  };
}

interface TableMapPanelProps {
  tables: TableData[];
  onSelectTable: (tableId: string) => void;
  onCreateOrder?: (tableId: string) => void; // SEMANA 1 - Tarefa 1.1: Ação rápida para criar pedido
  /** Gap #7: callback to persist table position after drag */
  onUpdatePosition?: (tableId: string, x: number, y: number) => void;
  /** Gap #10: open transfer/merge/split actions for occupied table */
  onTableAction?: (tableId: string) => void;
}

// FASE 5: Memoizar componente pesado para melhorar performance
export const TableMapPanel: React.FC<TableMapPanelProps> = memo(
  ({
    tables,
    onSelectTable,
    onCreateOrder,
    onUpdatePosition,
    onTableAction,
  }) => {
    // Gap #7: Canvas / Grid toggle + drag state
    const hasPositionedTables = tables.some((t) => t.x != null && t.y != null);
    const [viewMode, setViewMode] = useState<"grid" | "canvas">(
      hasPositionedTables ? "canvas" : "grid",
    );
    const [editMode, setEditMode] = useState(false);

    // Drag state
    const canvasRef = useRef<HTMLDivElement>(null);
    const dragState = useRef<{
      tableId: string;
      startX: number;
      startY: number;
      origX: number;
      origY: number;
    } | null>(null);
    const [dragPositions, setDragPositions] = useState<
      Record<string, { x: number; y: number }>
    >({});

    // Phase 7: live clock for elapsed-time display (tick every 60s)
    const [nowMs, setNowMs] = useState(Date.now());
    useEffect(() => {
      const id = setInterval(() => setNowMs(Date.now()), 60_000);
      return () => clearInterval(id);
    }, []);

    // Phase 7: aggregate stats
    const stats = useMemo(() => {
      const free = tables.filter((t) => t.status === "free").length;
      const occupied = tables.filter((t) => t.status === "occupied").length;
      const reserved = tables.filter((t) => t.status === "reserved").length;
      return { free, occupied, reserved, total: tables.length };
    }, [tables]);

    // Phase 7: zone groups for grid mode
    const zoneGroups = useMemo(() => {
      const hasZones = tables.some((t) => t.zone);
      if (!hasZones) return [{ zone: null as string | null, tables }];
      const map = new Map<string, TableData[]>();
      for (const t of tables) {
        const z = t.zone ?? "Sem zona";
        if (!map.has(z)) map.set(z, []);
        map.get(z)!.push(t);
      }
      return Array.from(map.entries()).map(([zone, tables]) => ({
        zone,
        tables,
      }));
    }, [tables]);

    const getStatusLabel = (
      status: string,
      orderInfo?: TableData["orderInfo"],
    ) => {
      if (orderInfo) {
        switch (orderInfo.status) {
          case "partially_paid":
            return "PAGO PARCIAL";
          case "paid":
            return "PAGO";
          case "ready":
            return "PRONTO";
          case "preparing":
            return "PREPARANDO";
          default:
            return "OCUPADA";
        }
      }
      switch (status) {
        case "free":
          return "LIVRE";
        case "occupied":
          return "OCUPADA";
        case "reserved":
          return "RESERVADA";
        default:
          return "DESC.";
      }
    };

    // RADAR: Enhanced Color Logic
    const getHealthAwareColor = (
      status: string,
      health: string | undefined,
      orderInfo?: TableData["orderInfo"],
    ) => {
      // 1. Critical Operational States (Override everything)
      if (health === "angry") return colors.destructive.base;
      if (health === "pulsing") return colors.action.base;

      // 2. Order Status
      if (orderInfo) {
        switch (orderInfo.status) {
          case "partially_paid":
            return colors.warning.base;
          case "paid":
            return colors.success.base;
          case "ready":
            return colors.info.base;
          case "preparing":
            return colors.action.base;
          default:
            return health === "bored"
              ? colors.warning.base
              : colors.success.base;
        }
      }

      // 4. Default Status Colors
      switch (status) {
        case "free":
          return colors.success.base;
        case "occupied":
          return health === "bored" ? colors.warning.base : colors.success.base;
        case "reserved":
          return colors.info.base;
        default:
          return colors.text.tertiary;
      }
    };

    // --- Drag handlers (canvas mode) ---
    const handlePointerDown = useCallback(
      (e: React.PointerEvent, table: TableData) => {
        if (!editMode) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const pos = dragPositions[table.id] ?? {
          x: table.x ?? 0,
          y: table.y ?? 0,
        };
        dragState.current = {
          tableId: table.id,
          startX: e.clientX,
          startY: e.clientY,
          origX: pos.x,
          origY: pos.y,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      },
      [editMode, dragPositions],
    );

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
      if (!dragState.current) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      setDragPositions((prev) => ({
        ...prev,
        [dragState.current!.tableId]: {
          x: dragState.current!.origX + dx,
          y: dragState.current!.origY + dy,
        },
      }));
    }, []);

    const handlePointerUp = useCallback(() => {
      if (!dragState.current) return;
      const { tableId } = dragState.current;
      const pos = dragPositions[tableId];
      if (pos && onUpdatePosition) {
        onUpdatePosition(tableId, Math.round(pos.x), Math.round(pos.y));
      }
      dragState.current = null;
    }, [dragPositions, onUpdatePosition]);

    // ---- Shared table card renderer ----
    const renderTableCard = (table: TableData, isCanvas: boolean) => {
      const health = (table as any).health;
      const statusColor = getHealthAwareColor(
        table.status,
        health,
        table.orderInfo,
      );
      const isFree = table.status === "free";
      const hasOrder = !!table.orderInfo;
      const formatTotal = (cents: number) =>
        currencyService.formatAmount(cents);

      return (
        <div
          key={table.id}
          onClick={() => {
            if (!editMode) onSelectTable(table.id);
          }}
          onDoubleClick={() => {
            if (isFree && onCreateOrder && !editMode) {
              onCreateOrder(table.id);
            }
          }}
          onPointerDown={
            isCanvas ? (e) => handlePointerDown(e, table) : undefined
          }
          style={{
            cursor: editMode ? "grab" : "pointer",
            width: isCanvas ? 140 : undefined,
            minHeight: hasOrder ? 140 : 120,
            border: `2px solid ${isFree ? "transparent" : statusColor}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: isFree ? `${colors.success.base}10` : undefined,
            borderRadius: "8px",
            position: isCanvas ? "absolute" : "relative",
            userSelect: editMode ? "none" : undefined,
            touchAction: editMode ? "none" : undefined,
          }}
        >
          <Card surface="layer2" padding="md" hoverable>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Text size="2xl" weight="black" color="primary">
                {table.number}
              </Text>
              {/* RADAR OPERACIONAL: Heartbeat Visualization */}
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: statusColor,
                  boxShadow:
                    health === "pulsing" || health === "angry"
                      ? `0 0 8px ${statusColor}`
                      : "none",
                  animation:
                    health === "pulsing"
                      ? "pulse-radar 1.5s infinite"
                      : health === "angry"
                      ? "pulse-slow 3s infinite"
                      : "none",
                }}
              />
            </div>

            <div style={{ marginTop: spacing[2] }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Text size="xs" weight="bold" style={{ color: statusColor }}>
                  {getStatusLabel(table.status, table.orderInfo)}
                </Text>

                {/* RADAR: Show Wait Time if relevant */}
                {((table as any).waitMinutes > 15 || health === "pulsing") && (
                  <Text size="xs" color="destructive" weight="bold">
                    {health === "pulsing"
                      ? "CHAMANDO"
                      : `${Math.floor((table as any).waitMinutes)}m`}
                  </Text>
                )}
                {/* Phase 7: elapsed time since seating */}
                {!isFree &&
                  table.seatedAt &&
                  (() => {
                    const elapsed = Math.floor(
                      (nowMs - new Date(table.seatedAt).getTime()) / 60_000,
                    );
                    if (elapsed < 1) return null;
                    const elColor =
                      elapsed < 15
                        ? colors.success.base
                        : elapsed < 30
                        ? colors.warning.base
                        : colors.destructive.base;
                    return (
                      <Text size="xs" weight="bold" style={{ color: elColor }}>
                        ⏱ {elapsed}m
                      </Text>
                    );
                  })()}
              </div>
              <Text size="xs" color="tertiary">
                {table.seats} Lugares
              </Text>

              {/* SEMANA 1 - Tarefa 1.1: Mostrar informações do pedido */}
              {hasOrder && table.orderInfo && (
                <div
                  style={{
                    marginTop: spacing[1],
                    paddingTop: spacing[1],
                    borderTop: `1px solid ${colors.border.subtle}`,
                  }}
                >
                  <Text size="xs" color="primary" weight="bold">
                    {formatTotal(table.orderInfo.total)}
                  </Text>
                  {table.orderInfo.status === "partially_paid" && (
                    <Text
                      size="xs"
                      color="warning"
                      style={{ display: "block", marginTop: 2 }}
                    >
                      ⚠️ Parcial
                    </Text>
                  )}
                </div>
              )}
            </div>

            {/* Gap #10: Action button for occupied tables (Transfer/Merge/Split) */}
            {!isFree && hasOrder && onTableAction && !editMode && (
              <div
                style={{
                  marginTop: spacing[2],
                  paddingTop: spacing[2],
                  borderTop: `1px solid ${colors.border.subtle}`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onTableAction(table.id);
                }}
              >
                <Text
                  size="xs"
                  color="tertiary"
                  weight="bold"
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    padding: spacing[1],
                    backgroundColor: `${colors.warning.base}10`,
                    borderRadius: 4,
                  }}
                >
                  ⚙ Ações
                </Text>
              </div>
            )}

            {/* SEMANA 1 - Tarefa 1.1: Botão de ação rápida para mesa livre */}
            {isFree && onCreateOrder && !editMode && (
              <div
                style={{
                  marginTop: spacing[2],
                  paddingTop: spacing[2],
                  borderTop: `1px solid ${colors.border.subtle}`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateOrder(table.id);
                }}
              >
                <Text
                  size="xs"
                  color="action"
                  weight="bold"
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    padding: spacing[1],
                    backgroundColor: `${colors.action.base}10`,
                    borderRadius: 4,
                  }}
                >
                  + Abrir Conta
                </Text>
              </div>
            )}
          </Card>
        </div>
      );
    };

    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: spacing[4],
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: spacing[2],
          }}
        >
          <Text size="xl" weight="black" color="primary">
            Mapa de Mesas
          </Text>

          <div
            style={{ display: "flex", gap: spacing[2], alignItems: "center" }}
          >
            {/* View mode toggle */}
            <div
              style={{
                display: "flex",
                borderRadius: 6,
                overflow: "hidden",
                border: `1px solid ${colors.border.subtle}`,
              }}
            >
              {(["grid", "canvas"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setViewMode(mode);
                    if (mode === "grid") setEditMode(false);
                  }}
                  style={{
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor:
                      viewMode === mode
                        ? colors.action.base
                        : colors.surface.layer1,
                    color: viewMode === mode ? "#fff" : colors.text.secondary,
                  }}
                >
                  {mode === "grid" ? "⊞ Grade" : "◳ Planta"}
                </button>
              ))}
            </div>

            {/* Edit toggle (canvas only) */}
            {viewMode === "canvas" && onUpdatePosition && (
              <button
                onClick={() => setEditMode((prev) => !prev)}
                style={{
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: editMode
                    ? `2px solid ${colors.action.base}`
                    : `1px solid ${colors.border.subtle}`,
                  cursor: "pointer",
                  backgroundColor: editMode
                    ? `${colors.action.base}20`
                    : colors.surface.layer1,
                  color: editMode ? colors.action.base : colors.text.secondary,
                }}
              >
                {editMode ? "✓ Guardar" : "✎ Editar"}
              </button>
            )}

            {/* Phase 7: stats chips */}
            <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap" }}>
              {(
                [
                  { key: "free", color: colors.success.base, label: "Livres" },
                  {
                    key: "occupied",
                    color: colors.action.base,
                    label: "Ocupadas",
                  },
                  {
                    key: "reserved",
                    color: colors.info.base,
                    label: "Reservadas",
                  },
                ] as const
              ).map(({ key, color, label }) =>
                stats[key] > 0 ? (
                  <span
                    key={key}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 20,
                      background: `${color}18`,
                      color,
                      border: `1px solid ${color}40`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {stats[key]} {label}
                  </span>
                ) : null,
              )}
            </div>
          </div>
        </div>

        {/* Keyframe animations */}
        <style>{`
          @keyframes pulse-radar {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(var(--color-action-base), 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(var(--color-action-base), 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(var(--color-action-base), 0); }
          }
          @keyframes pulse-slow {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
          }
        `}</style>

        {/* ----- GRID VIEW ----- */}
        {viewMode === "grid" && (
          <div style={{ overflowY: "auto", paddingBottom: spacing[4] }}>
            {zoneGroups.map(({ zone, tables: zoneTables }) => (
              <div key={zone ?? "all"} style={{ marginBottom: spacing[6] }}>
                {/* Zone header (only when zones exist) */}
                {zone !== null && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: spacing[2],
                      marginBottom: spacing[3],
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: colors.text.tertiary,
                      }}
                    >
                      {zone}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: colors.text.tertiary,
                        background: colors.surface.layer2,
                        borderRadius: 10,
                        padding: "1px 7px",
                      }}
                    >
                      {zoneTables.filter((t) => t.status === "free").length}/
                      {zoneTables.length} livres
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 1,
                        background: colors.border.subtle,
                      }}
                    />
                  </div>
                )}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(140px, 1fr))",
                    gap: spacing[4],
                  }}
                >
                  {zoneTables.map((table) => renderTableCard(table, false))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ----- CANVAS VIEW (Gap #7) ----- */}
        {viewMode === "canvas" && (
          <div
            ref={canvasRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              flex: 1,
              position: "relative",
              overflow: "auto",
              backgroundColor: `${colors.surface.layer1}`,
              borderRadius: 8,
              border: editMode
                ? `2px dashed ${colors.action.base}`
                : `1px solid ${colors.border.subtle}`,
              minHeight: 400,
            }}
          >
            {/* Dot grid background for spatial reference */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `radial-gradient(${colors.border.subtle} 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
                pointerEvents: "none",
              }}
            />

            {tables.map((table) => {
              const pos = dragPositions[table.id] ?? {
                x: table.x ?? ((table.number - 1) % 5) * 160 + 20,
                y: table.y ?? Math.floor((table.number - 1) / 5) * 170 + 20,
              };
              return (
                <div
                  key={table.id}
                  style={{
                    position: "absolute",
                    left: pos.x,
                    top: pos.y,
                    transition:
                      dragState.current?.tableId === table.id
                        ? "none"
                        : "left 0.15s, top 0.15s",
                  }}
                >
                  {renderTableCard(table, true)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // FASE 5: Comparação customizada para evitar re-renders desnecessários
    return (
      prevProps.tables.length === nextProps.tables.length &&
      prevProps.tables.every(
        (table, idx) =>
          table.id === nextProps.tables[idx]?.id &&
          table.status === nextProps.tables[idx]?.status,
      )
    );
  },
);
