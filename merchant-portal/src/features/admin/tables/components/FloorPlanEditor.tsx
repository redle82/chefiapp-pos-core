/**
 * FloorPlanEditor -- Visual drag-and-drop floor plan editor.
 *
 * Features:
 *   - Div-based canvas with dot-grid background
 *   - Drag tables to position (snap-to-grid)
 *   - Resize via corner handle
 *   - Shape-aware rendering (round, square, rectangle, bar stool)
 *   - Status color coding
 *   - Zone/floor tabs
 *   - Table toolbox (drag new tables onto canvas)
 */

import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  TABLE_STATE_COLORS,
} from "../../../../core/operational/tableStates";
import type { TableStatus } from "../../../../core/operational/tableStates";
import {
  type FloorPlanTable,
  type FloorPlanZone,
  type TableLayout,
  type TableShape,
  GRID_SIZE,
  SHAPE_DEFAULTS,
  snapToGrid,
  defaultLayout,
} from "../types/floorPlan";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface FloorPlanEditorProps {
  tables: FloorPlanTable[];
  zones: FloorPlanZone[];
  activeZone: string;
  onChangeZone: (zone: string) => void;
  onUpdateLayout: (tableId: string, layout: TableLayout) => void;
  onAddTable: (shape: TableShape, layout: TableLayout) => void;
  onSelectTable: (tableId: string | null) => void;
  selectedTableId: string | null;
  onDeleteTable?: (tableId: string) => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

/* ------------------------------------------------------------------ */
/*  Drag types                                                         */
/* ------------------------------------------------------------------ */

type DragMode = "move" | "resize";

interface DragState {
  tableId: string;
  mode: DragMode;
  startX: number;
  startY: number;
  origLayout: TableLayout;
}

/* ------------------------------------------------------------------ */
/*  Table shape renderer                                               */
/* ------------------------------------------------------------------ */

function TableShapeElement({
  table,
  isSelected,
  isEditing,
}: {
  table: FloorPlanTable;
  isSelected: boolean;
  isEditing: boolean;
}) {
  const color = TABLE_STATE_COLORS[table.status] ?? "#525252";
  const { layout } = table;
  const borderColor = isSelected ? "#fff" : `${color}80`;

  const baseStyle: React.CSSProperties = {
    width: layout.width,
    height: layout.height,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: `2px solid ${borderColor}`,
    backgroundColor: `${color}18`,
    transition: "box-shadow 0.15s",
    boxShadow: isSelected ? `0 0 0 2px ${color}, 0 4px 16px rgba(0,0,0,0.4)` : "0 2px 8px rgba(0,0,0,0.3)",
    cursor: isEditing ? "grab" : "pointer",
    userSelect: "none",
    touchAction: "none",
    position: "relative",
    overflow: "hidden",
  };

  const borderRadius = layout.shape === "round" ? "50%" :
    layout.shape === "bar" ? "50%" :
    layout.shape === "rectangle" ? 8 : 6;

  return (
    <div
      style={{
        ...baseStyle,
        borderRadius,
        transform: layout.rotation ? `rotate(${layout.rotation}deg)` : undefined,
      }}
    >
      {/* Table number */}
      <span
        style={{
          fontSize: layout.shape === "bar" ? 12 : 18,
          fontWeight: 800,
          color: "#fff",
          lineHeight: 1,
        }}
      >
        {table.number}
      </span>

      {/* Seats indicator */}
      <span style={{ fontSize: 9, color: "#a1a1aa", fontWeight: 600, marginTop: 2 }}>
        {table.seats}p
      </span>

      {/* Status dot */}
      <div
        style={{
          position: "absolute",
          top: 4,
          right: 4,
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toolbox — drag new table shapes onto canvas                        */
/* ------------------------------------------------------------------ */

function TableToolbox({
  onDragStart,
}: {
  onDragStart: (shape: TableShape) => void;
}) {
  const { t } = useTranslation("tables");
  const shapes: { shape: TableShape; label: string; icon: string }[] = [
    { shape: "round", label: t("editor.shapeRound"), icon: "\u25CF" },
    { shape: "square", label: t("editor.shapeSquare"), icon: "\u25A0" },
    { shape: "rectangle", label: t("editor.shapeRectangle"), icon: "\u25AC" },
    { shape: "bar", label: t("editor.shapeBar"), icon: "\u25CB" },
  ];

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {shapes.map(({ shape, label, icon }) => (
        <button
          key={shape}
          type="button"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", shape);
            onDragStart(shape);
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: "8px 12px",
            background: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: 8,
            color: "#e4e4e7",
            fontSize: 11,
            fontWeight: 600,
            cursor: "grab",
          }}
        >
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main editor component                                              */
/* ------------------------------------------------------------------ */

export function FloorPlanEditor({
  tables,
  zones,
  activeZone,
  onChangeZone,
  onUpdateLayout,
  onAddTable,
  onSelectTable,
  selectedTableId,
  onDeleteTable,
  canvasWidth = 1200,
  canvasHeight = 800,
}: FloorPlanEditorProps) {
  const { t } = useTranslation("tables");
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [localPositions, setLocalPositions] = useState<Record<string, TableLayout>>({});
  const [toolboxShape, setToolboxShape] = useState<TableShape | null>(null);

  // Filter tables by active zone
  const zoneTables = tables.filter((tbl) => tbl.layout.zone === activeZone);

  // Get effective layout (local override during drag, or persisted)
  const getLayout = (table: FloorPlanTable): TableLayout =>
    localPositions[table.id] ?? table.layout;

  /* ---- Pointer handlers (move + resize) ---- */

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, tableId: string, mode: DragMode) => {
      e.preventDefault();
      e.stopPropagation();
      const table = tables.find((t) => t.id === tableId);
      if (!table) return;

      const layout = localPositions[tableId] ?? table.layout;
      dragRef.current = {
        tableId,
        mode,
        startX: e.clientX,
        startY: e.clientY,
        origLayout: { ...layout },
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onSelectTable(tableId);
    },
    [tables, localPositions, onSelectTable],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (drag.mode === "move") {
      setLocalPositions((prev) => ({
        ...prev,
        [drag.tableId]: {
          ...drag.origLayout,
          x: snapToGrid(drag.origLayout.x + dx),
          y: snapToGrid(drag.origLayout.y + dy),
        },
      }));
    } else {
      // resize
      const newW = Math.max(40, snapToGrid(drag.origLayout.width + dx));
      const newH = Math.max(40, snapToGrid(drag.origLayout.height + dy));
      setLocalPositions((prev) => ({
        ...prev,
        [drag.tableId]: {
          ...drag.origLayout,
          width: newW,
          height: newH,
        },
      }));
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;

    const updated = localPositions[drag.tableId];
    if (updated) {
      onUpdateLayout(drag.tableId, updated);
    }
  }, [localPositions, onUpdateLayout]);

  /* ---- Drop handler for toolbox ---- */

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const shape = e.dataTransfer.getData("text/plain") as TableShape;
      if (!shape || !SHAPE_DEFAULTS[shape]) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const layout = defaultLayout(shape, x, y, activeZone);
      onAddTable(shape, layout);
      setToolboxShape(null);
    },
    [activeZone, onAddTable],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  /* ---- Canvas click (deselect) ---- */

  const handleCanvasClick = useCallback(() => {
    onSelectTable(null);
  }, [onSelectTable]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      {/* Zone tabs */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {zones.map((zone) => {
          const isActive = zone.name === activeZone;
          const zoneCount = tables.filter((t) => t.layout.zone === zone.name).length;
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => onChangeZone(zone.name)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: isActive ? "2px solid #6366f1" : "1px solid #3f3f46",
                background: isActive ? "#6366f120" : "#18181b",
                color: isActive ? "#a5b4fc" : "#a1a1aa",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {zone.name}
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.6 }}>{zoneCount}</span>
            </button>
          );
        })}
      </div>

      {/* Toolbox */}
      <div
        style={{
          padding: "8px 12px",
          background: "#09090b",
          border: "1px solid #27272a",
          borderRadius: 10,
        }}
      >
        <div style={{ fontSize: 11, color: "#71717a", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t("editor.dragToAdd")}
        </div>
        <TableToolbox onDragStart={setToolboxShape} />
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: "relative",
          width: canvasWidth,
          maxWidth: "100%",
          height: canvasHeight,
          background: "#0a0a0a",
          border: "1px solid #27272a",
          borderRadius: 12,
          overflow: "auto",
          // Dot grid
          backgroundImage: `radial-gradient(#27272a 1px, transparent 1px)`,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        }}
      >
        {zoneTables.map((table) => {
          const layout = getLayout(table);
          const isSelected = table.id === selectedTableId;

          return (
            <div
              key={table.id}
              style={{
                position: "absolute",
                left: layout.x,
                top: layout.y,
                zIndex: isSelected ? 10 : 1,
                transition: dragRef.current?.tableId === table.id ? "none" : "left 0.1s, top 0.1s",
              }}
              onPointerDown={(e) => handlePointerDown(e, table.id, "move")}
              onClick={(e) => {
                e.stopPropagation();
                onSelectTable(table.id);
              }}
            >
              <TableShapeElement
                table={{ ...table, layout }}
                isSelected={isSelected}
                isEditing={true}
              />

              {/* Resize handle (bottom-right corner) */}
              {isSelected && (
                <div
                  onPointerDown={(e) => handlePointerDown(e, table.id, "resize")}
                  style={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    width: 12,
                    height: 12,
                    background: "#6366f1",
                    border: "2px solid #fff",
                    borderRadius: 3,
                    cursor: "nwse-resize",
                    zIndex: 20,
                  }}
                />
              )}

              {/* Delete button on selected */}
              {isSelected && onDeleteTable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTable(table.id);
                  }}
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#ef4444",
                    border: "2px solid #fff",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                    zIndex: 20,
                    padding: 0,
                  }}
                >
                  x
                </button>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {zoneTables.length === 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#52525b",
              fontSize: 14,
              fontWeight: 500,
              pointerEvents: "none",
            }}
          >
            {t("editor.emptyCanvas")}
          </div>
        )}
      </div>

      {/* Keyboard hint */}
      <div style={{ fontSize: 11, color: "#52525b" }}>
        {t("editor.hint")}
      </div>
    </div>
  );
}
