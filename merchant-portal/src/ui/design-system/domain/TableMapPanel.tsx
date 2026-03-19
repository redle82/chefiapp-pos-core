import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { currencyService } from "../../../core/currency/CurrencyService";
import {
  type TableStatus,
  TABLE_STATE_COLORS,
  TABLE_STATUS_LABELS,
} from "../../../core/operational/tableStates";
import { Card } from "../Card";
import { Text } from "../primitives/Text";
import { colors } from "../tokens/colors";
import { spacing } from "../tokens/spacing";

export interface TableData {
  id: string;
  number: number;
  status: TableStatus;
  seats: number;
  x?: number;
  y?: number;
  /** Zone label (e.g. "Salão", "Esplanada") — used for grid grouping */
  zone?: string;
  /** ISO timestamp when table was occupied — used for elapsed-time display */
  seatedAt?: string | null;
  /** ISO timestamp when table entered current state — time-in-state tracking */
  lastStateChangeAt?: string | null;
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
  onCreateOrder?: (tableId: string) => void;
  onUpdatePosition?: (tableId: string, x: number, y: number) => void;
  onTableAction?: (tableId: string) => void;
}

export const TableMapPanel: React.FC<TableMapPanelProps> = memo(
  ({
    tables,
    onSelectTable,
    onCreateOrder,
    onUpdatePosition,
    onTableAction,
  }) => {
    const { t } = useTranslation("operational");

    // Action badges per state — shows what action is pending
    const ACTION_BADGES: Partial<Record<TableStatus, { icon: string; label: string }>> = {
      ready_to_serve: { icon: "🍽", label: t("tableMap.badgeServe") },
      bill_requested: { icon: "💳", label: t("tableMap.badgeBill") },
      cleaning: { icon: "🧹", label: t("tableMap.badgeClean") },
    };
    const hasPositionedTables = tables.some((tbl) => tbl.x != null && tbl.y != null);
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

    // Live clock for elapsed-time display (tick every 60s)
    const [nowMs, setNowMs] = useState(Date.now());
    useEffect(() => {
      const id = setInterval(() => setNowMs(Date.now()), 60_000);
      return () => clearInterval(id);
    }, []);

    // Aggregate stats — operational grouping
    const stats = useMemo(() => {
      const free = tables.filter((tbl) => tbl.status === "free").length;
      const active = tables.filter((tbl) =>
        ["occupied", "in_prep", "ready_to_serve"].includes(tbl.status),
      ).length;
      const attention = tables.filter((tbl) =>
        ["ready_to_serve", "bill_requested", "cleaning"].includes(tbl.status),
      ).length;
      const reserved = tables.filter((tbl) => tbl.status === "reserved").length;
      return { free, active, attention, reserved, total: tables.length };
    }, [tables]);

    // Zone groups for grid mode
    const zoneGroups = useMemo(() => {
      const hasZones = tables.some((tbl) => tbl.zone);
      if (!hasZones) return [{ zone: null as string | null, tables }];
      const map = new Map<string, TableData[]>();
      for (const tbl of tables) {
        const z = tbl.zone ?? t("tableMap.noZone");
        if (!map.has(z)) map.set(z, []);
        map.get(z)!.push(tbl);
      }
      return Array.from(map.entries()).map(([zone, tables]) => ({
        zone,
        tables,
      }));
    }, [tables, t]);

    const getStatusLabel = (
      status: TableStatus,
      orderInfo?: TableData["orderInfo"],
    ): string => {
      // Order status overrides table status label
      if (orderInfo) {
        switch (orderInfo.status) {
          case "partially_paid":
            return t("tableStates.partially_paid");
          case "paid":
            return t("tableStates.paid");
          case "ready":
            return t("tableStates.ready");
          case "preparing":
            return t("tableStates.preparing");
          default:
            break;
        }
      }
      return t(TABLE_STATUS_LABELS[status] ?? "tableMap.unknown");
    };

    // Color per state — direct from canonical map, with order override
    const getTableColor = (
      status: TableStatus,
      orderInfo?: TableData["orderInfo"],
    ): string => {
      if (orderInfo) {
        switch (orderInfo.status) {
          case "partially_paid":
            return colors.warning.base;
          case "paid":
            return colors.success.base;
          case "ready":
            return TABLE_STATE_COLORS.ready_to_serve;
          case "preparing":
            return TABLE_STATE_COLORS.in_prep;
          default:
            break;
        }
      }
      return TABLE_STATE_COLORS[status] ?? colors.text.tertiary;
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
      const statusColor = getTableColor(table.status, table.orderInfo);
      const isFree = table.status === "free";
      const hasOrder = !!table.orderInfo;
      const isBlocked = table.status === "blocked";
      const actionBadge = ACTION_BADGES[table.status];

      // Elapsed time since seating (total occupation)
      const elapsedMinutes =
        !isFree && table.seatedAt
          ? Math.floor((nowMs - new Date(table.seatedAt).getTime()) / 60_000)
          : 0;

      // Time in current state
      const stateMinutes = table.lastStateChangeAt
        ? Math.floor(
            (nowMs - new Date(table.lastStateChangeAt).getTime()) / 60_000,
          )
        : 0;

      const formatElapsed = (m: number): string => {
        if (m < 60) return `${m}m`;
        return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
      };

      const elapsedColor = (m: number): string =>
        m < 15
          ? colors.success.base
          : m < 30
            ? colors.warning.base
            : colors.destructive.base;

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
            backgroundColor: `${statusColor}10`,
            borderRadius: "8px",
            position: isCanvas ? "absolute" : "relative",
            opacity: isBlocked ? 0.5 : 1,
            userSelect: editMode ? "none" : undefined,
            touchAction: editMode ? "none" : undefined,
          }}
        >
          <Card surface="layer2" padding="md" hoverable>
            {/* Header: number + status dot */}
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
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: statusColor,
                }}
              />
            </div>

            {/* Status + times */}
            <div style={{ marginTop: spacing[2] }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text size="xs" weight="bold" style={{ color: statusColor }}>
                  {getStatusLabel(table.status, table.orderInfo)}
                </Text>

                {/* Dual time display */}
                {!isFree && !isBlocked && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {/* Total occupation time */}
                    {elapsedMinutes >= 1 && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: elapsedColor(elapsedMinutes),
                        }}
                      >
                        ⏱ {formatElapsed(elapsedMinutes)}
                      </span>
                    )}
                    {/* Time in current state (only if different from occupation) */}
                    {stateMinutes >= 1 &&
                      table.status !== "occupied" &&
                      stateMinutes !== elapsedMinutes && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: colors.text.tertiary,
                          }}
                        >
                          ↻ {formatElapsed(stateMinutes)}
                        </span>
                      )}
                  </div>
                )}
              </div>

              <Text size="xs" color="tertiary">
                {table.seats} {t("tableMap.seats")}
              </Text>

              {/* Action badge (pending action indicator) */}
              {actionBadge && !editMode && (
                <div
                  style={{
                    marginTop: 4,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    borderRadius: 10,
                    backgroundColor: `${statusColor}20`,
                    fontSize: 10,
                    fontWeight: 700,
                    color: statusColor,
                  }}
                >
                  {actionBadge.icon} {actionBadge.label}
                </div>
              )}

              {/* Order info */}
              {hasOrder && table.orderInfo && (
                <div
                  style={{
                    marginTop: spacing[1],
                    paddingTop: spacing[1],
                    borderTop: `1px solid ${colors.border.subtle}`,
                  }}
                >
                  <Text size="xs" color="primary" weight="bold">
                    {currencyService.formatAmount(table.orderInfo.total)}
                  </Text>
                  {table.orderInfo.status === "partially_paid" && (
                    <Text
                      size="xs"
                      color="warning"
                      style={{ display: "block", marginTop: 2 }}
                    >
                      ⚠️ {t("tableMap.partiallyPaid")}
                    </Text>
                  )}
                </div>
              )}
            </div>

            {/* Action button for non-free tables */}
            {!isFree && !isBlocked && onTableAction && !editMode && (
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
                    backgroundColor: `${statusColor}10`,
                    borderRadius: 4,
                  }}
                >
                  ⚙ {t("tableMap.actions")}
                </Text>
              </div>
            )}

            {/* Quick action for free tables */}
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
                  + {t("tableMap.openBill")}
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
            {t("tableMap.title")}
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
                  {mode === "grid" ? `⊞ ${t("tableMap.gridMode")}` : `◳ ${t("tableMap.canvasMode")}`}
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
                {editMode ? `✓ ${t("tableMap.save")}` : `✎ ${t("tableMap.edit")}`}
              </button>
            )}

            {/* Stats chips — operational grouping */}
            <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap" }}>
              {([
                { count: stats.free, color: TABLE_STATE_COLORS.free, label: t("tableMap.free") },
                { count: stats.active, color: TABLE_STATE_COLORS.occupied, label: t("tableMap.occupied") },
                { count: stats.attention, color: TABLE_STATE_COLORS.bill_requested, label: t("tableMap.attention") },
                { count: stats.reserved, color: TABLE_STATE_COLORS.reserved, label: t("tableMap.reserved") },
              ]).map(({ count, color, label }) =>
                count > 0 ? (
                  <span
                    key={label}
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
                    {count} {label}
                  </span>
                ) : null,
              )}
            </div>
          </div>
        </div>

        {/* ----- GRID VIEW ----- */}
        {viewMode === "grid" && (
          <div style={{ overflowY: "auto", paddingBottom: spacing[4] }}>
            {zoneGroups.map(({ zone, tables: zoneTables }) => (
              <div key={zone ?? "all"} style={{ marginBottom: spacing[6] }}>
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
                      {zoneTables.filter((tbl) => tbl.status === "free").length}/
                      {zoneTables.length} {t("tableMap.zoneFree")}
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

        {/* ----- CANVAS VIEW ----- */}
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
            {/* Dot grid background */}
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
    return (
      prevProps.tables.length === nextProps.tables.length &&
      prevProps.tables.every(
        (table, idx) =>
          table.id === nextProps.tables[idx]?.id &&
          table.status === nextProps.tables[idx]?.status &&
          table.lastStateChangeAt === nextProps.tables[idx]?.lastStateChangeAt &&
          table.seatedAt === nextProps.tables[idx]?.seatedAt,
      )
    );
  },
);
