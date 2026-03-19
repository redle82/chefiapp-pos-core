/**
 * FloorPlanView -- Read-only floor plan for TPV table selection.
 *
 * Shows real-time table status with color coding.
 * Click a table to select it for a new order.
 * Touch-friendly for tablet use.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  TABLE_STATE_COLORS,
  TABLE_STATUS_LABELS,
  type TableStatus,
} from "../../../../core/operational/tableStates";
import type {
  FloorPlanTable,
  FloorPlanZone,
  TableLayout,
} from "../types/floorPlan";
import { GRID_SIZE } from "../types/floorPlan";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface FloorPlanViewProps {
  tables: FloorPlanTable[];
  zones: FloorPlanZone[];
  activeZone: string;
  onChangeZone: (zone: string) => void;
  onSelectTable: (tableId: string) => void;
  /** Show elapsed time since seated (live clock) */
  showElapsed?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Elapsed time formatter                                             */
/* ------------------------------------------------------------------ */

function formatElapsed(minutes: number): string {
  if (minutes < 1) return "";
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Table tile (read-only)                                             */
/* ------------------------------------------------------------------ */

function TableTile({
  table,
  nowMs,
  onClick,
}: {
  table: FloorPlanTable;
  nowMs: number;
  onClick: () => void;
}) {
  const { t } = useTranslation("tables");
  const color = TABLE_STATE_COLORS[table.status] ?? "#525252";
  const { layout } = table;
  const isFree = table.status === "free";
  const isBlocked = table.status === "blocked";

  const elapsedMinutes =
    !isFree && table.seatedAt
      ? Math.floor((nowMs - new Date(table.seatedAt).getTime()) / 60_000)
      : 0;

  const borderRadius =
    layout.shape === "round" || layout.shape === "bar" ? "50%" :
    layout.shape === "rectangle" ? 8 : 6;

  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        left: layout.x,
        top: layout.y,
        width: layout.width,
        height: layout.height,
        borderRadius,
        border: `2px solid ${isFree ? "#3f3f4650" : color}`,
        backgroundColor: `${color}${isFree ? "08" : "18"}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: isBlocked ? "not-allowed" : "pointer",
        opacity: isBlocked ? 0.4 : 1,
        transform: layout.rotation ? `rotate(${layout.rotation}deg)` : undefined,
        transition: "border-color 0.2s, background-color 0.2s",
        userSelect: "none",
        touchAction: "manipulation",
      }}
    >
      {/* Table number */}
      <span
        style={{
          fontSize: layout.shape === "bar" ? 11 : 16,
          fontWeight: 800,
          color: "#fff",
          lineHeight: 1,
        }}
      >
        {table.number}
      </span>

      {/* Seats */}
      <span style={{ fontSize: 9, color: "#a1a1aa", fontWeight: 600, marginTop: 1 }}>
        {table.seats}p
      </span>

      {/* Elapsed time badge */}
      {elapsedMinutes >= 1 && (
        <span
          style={{
            position: "absolute",
            bottom: -6,
            fontSize: 9,
            fontWeight: 700,
            padding: "1px 5px",
            borderRadius: 10,
            background: "#18181b",
            border: `1px solid ${color}60`,
            color: elapsedMinutes > 30 ? "#ef4444" : elapsedMinutes > 15 ? "#f59e0b" : "#22c55e",
            whiteSpace: "nowrap",
          }}
        >
          {formatElapsed(elapsedMinutes)}
        </span>
      )}

      {/* Status dot */}
      <div
        style={{
          position: "absolute",
          top: 3,
          right: 3,
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Legend                                                              */
/* ------------------------------------------------------------------ */

function StatusLegend() {
  const { t } = useTranslation("tables");
  const items: { status: TableStatus; label: string }[] = [
    { status: "free", label: t("status.free") },
    { status: "occupied", label: t("status.occupied") },
    { status: "reserved", label: t("status.reserved") },
    { status: "bill_requested", label: t("status.billRequested") },
  ];

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {items.map(({ status, label }) => (
        <div key={status} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: TABLE_STATE_COLORS[status],
            }}
          />
          <span style={{ fontSize: 11, color: "#a1a1aa", fontWeight: 500 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function FloorPlanView({
  tables,
  zones,
  activeZone,
  onChangeZone,
  onSelectTable,
  showElapsed = true,
}: FloorPlanViewProps) {
  const { t } = useTranslation("tables");

  // Live clock for elapsed-time display
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    if (!showElapsed) return;
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [showElapsed]);

  const zoneTables = useMemo(
    () => tables.filter((tbl) => tbl.layout.zone === activeZone),
    [tables, activeZone],
  );

  // Stats
  const stats = useMemo(() => {
    const free = zoneTables.filter((t) => t.status === "free").length;
    const total = zoneTables.length;
    return { free, total };
  }, [zoneTables]);

  // Auto-fit canvas dimensions from table positions
  const canvasDims = useMemo(() => {
    if (zoneTables.length === 0) return { width: 800, height: 500 };
    let maxX = 0;
    let maxY = 0;
    for (const tbl of zoneTables) {
      maxX = Math.max(maxX, tbl.layout.x + tbl.layout.width);
      maxY = Math.max(maxY, tbl.layout.y + tbl.layout.height);
    }
    return {
      width: Math.max(800, maxX + 60),
      height: Math.max(400, maxY + 60),
    };
  }, [zoneTables]);

  const handleTableClick = useCallback(
    (tableId: string) => {
      const table = tables.find((t) => t.id === tableId);
      if (table && table.status !== "blocked") {
        onSelectTable(tableId);
      }
    },
    [tables, onSelectTable],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%" }}>
      {/* Zone tabs + stats */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {zones.map((zone) => {
            const isActive = zone.name === activeZone;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => onChangeZone(zone.name)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  border: isActive ? "2px solid #6366f1" : "1px solid #3f3f46",
                  background: isActive ? "#6366f120" : "transparent",
                  color: isActive ? "#a5b4fc" : "#71717a",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {zone.name}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#71717a" }}>
            {stats.free}/{stats.total} {t("view.free")}
          </span>
          <StatusLegend />
        </div>
      </div>

      {/* Canvas */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: canvasDims.width,
          height: canvasDims.height,
          minHeight: 300,
          background: "#0a0a0a",
          border: "1px solid #1a1a1e",
          borderRadius: 10,
          overflow: "auto",
          backgroundImage: `radial-gradient(#1a1a1e 1px, transparent 1px)`,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        }}
      >
        {zoneTables.map((table) => (
          <TableTile
            key={table.id}
            table={table}
            nowMs={nowMs}
            onClick={() => handleTableClick(table.id)}
          />
        ))}

        {zoneTables.length === 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3f3f46",
              fontSize: 13,
            }}
          >
            {t("view.noTables")}
          </div>
        )}
      </div>
    </div>
  );
}
