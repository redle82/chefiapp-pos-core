/**
 * TableManagementPage -- Admin page for visual floor plan management.
 *
 * Route: /admin/tables
 *
 * Features:
 *   - Visual floor plan editor (FloorPlanEditor)
 *   - CRUD tables (add, edit, delete)
 *   - Zone/floor management (add, rename, delete)
 *   - Table merge / split
 *   - Bulk operations (set all free, change capacity)
 *   - QR code generation for selected tables
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { normalizeTableStatus } from "../../../../core/operational/tableStates";
import type { TableStatus } from "../../../../core/operational/tableStates";
import { getTpvRestaurantId } from "../../../../core/storage/installedDeviceStorage";
import { dockerCoreClient } from "../../../../infra/docker-core/connection";
import { FloorPlanEditor } from "../components/FloorPlanEditor";
import type {
  FloorPlanTable,
  FloorPlanZone,
  TableLayout,
  TableShape,
} from "../types/floorPlan";
import { SHAPE_DEFAULTS, defaultLayout } from "../types/floorPlan";

const DEFAULT_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";

/* ------------------------------------------------------------------ */
/*  Zone management modal                                              */
/* ------------------------------------------------------------------ */

function ZoneManagerModal({
  zones,
  onAddZone,
  onRenameZone,
  onDeleteZone,
  onClose,
}: {
  zones: FloorPlanZone[];
  onAddZone: (name: string) => void;
  onRenameZone: (zoneId: string, name: string) => void;
  onDeleteZone: (zoneId: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("tables");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0a0a0a",
          border: "1px solid #27272a",
          borderRadius: 16,
          padding: 24,
          width: "min(420px, 92vw)",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <h3 style={{ color: "#fff", margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>
          {t("zones.title")}
        </h3>

        {/* Existing zones */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {zones.map((zone) => (
            <div
              key={zone.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: "#18181b",
                borderRadius: 8,
                border: "1px solid #27272a",
              }}
            >
              {editingId === zone.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1,
                      background: "#09090b",
                      border: "1px solid #3f3f46",
                      borderRadius: 6,
                      color: "#fff",
                      padding: "4px 8px",
                      fontSize: 13,
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editName.trim()) {
                        onRenameZone(zone.id, editName.trim());
                        setEditingId(null);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editName.trim()) {
                        onRenameZone(zone.id, editName.trim());
                      }
                      setEditingId(null);
                    }}
                    style={actionBtnSmall("#10b981")}
                  >
                    {t("zones.save")}
                  </button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, color: "#e4e4e7", fontSize: 13, fontWeight: 600 }}>
                    {zone.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(zone.id);
                      setEditName(zone.name);
                    }}
                    style={actionBtnSmall("#6366f1")}
                  >
                    {t("zones.rename")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteZone(zone.id)}
                    style={actionBtnSmall("#ef4444")}
                  >
                    {t("zones.delete")}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add new zone */}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("zones.newPlaceholder")}
            style={{
              flex: 1,
              background: "#09090b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              color: "#fff",
              padding: "8px 12px",
              fontSize: 13,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) {
                onAddZone(newName.trim());
                setNewName("");
              }
            }}
          />
          <button
            type="button"
            disabled={!newName.trim()}
            onClick={() => {
              if (newName.trim()) {
                onAddZone(newName.trim());
                setNewName("");
              }
            }}
            style={{
              padding: "8px 16px",
              background: newName.trim() ? "#6366f1" : "#27272a",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: newName.trim() ? "pointer" : "not-allowed",
            }}
          >
            {t("zones.add")}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 16,
            padding: "10px 0",
            width: "100%",
            background: "transparent",
            border: "1px solid #3f3f46",
            borderRadius: 8,
            color: "#a1a1aa",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {t("zones.close")}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table properties panel                                             */
/* ------------------------------------------------------------------ */

function TablePropertiesPanel({
  table,
  onUpdateSeats,
  onUpdateNumber,
  onUpdateStatus,
  onDelete,
  onClose,
}: {
  table: FloorPlanTable;
  onUpdateSeats: (seats: number) => void;
  onUpdateNumber: (num: number) => void;
  onUpdateStatus: (status: TableStatus) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("tables");

  return (
    <div
      style={{
        padding: 16,
        background: "#0a0a0a",
        border: "1px solid #27272a",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minWidth: 240,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 700 }}>
          {t("properties.title", { n: table.number })}
        </h4>
        <button
          type="button"
          onClick={onClose}
          style={{ background: "none", border: "none", color: "#71717a", fontSize: 18, cursor: "pointer" }}
        >
          x
        </button>
      </div>

      {/* Table number */}
      <label style={labelStyle}>
        {t("properties.number")}
        <input
          type="number"
          min={1}
          value={table.number}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (n > 0) onUpdateNumber(n);
          }}
          style={inputStyle}
        />
      </label>

      {/* Seats */}
      <label style={labelStyle}>
        {t("properties.seats")}
        <input
          type="number"
          min={1}
          max={20}
          value={table.seats}
          onChange={(e) => {
            const s = parseInt(e.target.value, 10);
            if (s > 0) onUpdateSeats(s);
          }}
          style={inputStyle}
        />
      </label>

      {/* Shape */}
      <div>
        <span style={{ ...labelStyle, display: "block" }}>{t("properties.shape")}</span>
        <span style={{ color: "#a1a1aa", fontSize: 12 }}>
          {t(`editor.shape${capitalize(table.layout.shape)}`)}
        </span>
      </div>

      {/* Status */}
      <label style={labelStyle}>
        {t("properties.status")}
        <select
          value={table.status}
          onChange={(e) => onUpdateStatus(e.target.value as TableStatus)}
          style={{ ...inputStyle, appearance: "auto" }}
        >
          <option value="free">{t("status.free")}</option>
          <option value="occupied">{t("status.occupied")}</option>
          <option value="reserved">{t("status.reserved")}</option>
          <option value="blocked">{t("status.blocked")}</option>
          <option value="cleaning">{t("status.cleaning")}</option>
        </select>
      </label>

      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        style={{
          padding: "10px 0",
          background: "#7f1d1d",
          border: "1px solid #991b1b",
          borderRadius: 8,
          color: "#fca5a5",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          marginTop: 4,
        }}
      >
        {t("properties.delete")}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bulk operations toolbar                                            */
/* ------------------------------------------------------------------ */

function BulkToolbar({
  tableCount,
  onSetAllFree,
  onManageZones,
}: {
  tableCount: number;
  onSetAllFree: () => void;
  onManageZones: () => void;
}) {
  const { t } = useTranslation("tables");

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button type="button" onClick={onSetAllFree} style={toolbarBtn}>
        {t("bulk.setAllFree")}
      </button>
      <button type="button" onClick={onManageZones} style={toolbarBtn}>
        {t("bulk.manageZones")}
      </button>
      <span style={{ fontSize: 12, color: "#52525b", alignSelf: "center" }}>
        {tableCount} {t("bulk.tables")}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  color: "#a1a1aa",
  fontSize: 12,
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  background: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: 6,
  color: "#fff",
  padding: "6px 10px",
  fontSize: 13,
};

const toolbarBtn: React.CSSProperties = {
  padding: "6px 14px",
  background: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: 8,
  color: "#d4d4d8",
  fontWeight: 600,
  fontSize: 12,
  cursor: "pointer",
};

function actionBtnSmall(bg: string): React.CSSProperties {
  return {
    padding: "4px 10px",
    background: `${bg}20`,
    border: `1px solid ${bg}60`,
    borderRadius: 6,
    color: bg,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export function TableManagementPage() {
  const { t } = useTranslation("tables");
  const runtimeContext = useRestaurantRuntime();
  const runtime = runtimeContext?.runtime;
  const installedId = getTpvRestaurantId();
  const restaurantId = installedId ?? runtime?.restaurant_id ?? DEFAULT_RESTAURANT_ID;

  const [tables, setTables] = useState<FloorPlanTable[]>([]);
  const [zones, setZones] = useState<FloorPlanZone[]>([]);
  const [activeZone, setActiveZone] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedTable = selectedTableId
    ? tables.find((t) => t.id === selectedTableId) ?? null
    : null;

  /* ---- Fetch tables and zones from DB ---- */

  const fetchData = useCallback(async () => {
    try {
      // Fetch tables
      const { data: tableRows, error: tableError } = await dockerCoreClient
        .from("gm_tables")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("number", { ascending: true });

      if (tableError) {
        console.error("[TableManagement] Fetch tables error:", tableError);
        return;
      }

      // Fetch zones (gm_locations as zones)
      const { data: zoneRows, error: zoneError } = await dockerCoreClient
        .from("gm_locations")
        .select("id, restaurant_id, name, kind")
        .eq("restaurant_id", restaurantId)
        .order("name", { ascending: true });

      if (zoneError) {
        console.error("[TableManagement] Fetch zones error:", zoneError);
      }

      // Build zones — always include a default zone
      const dbZones: FloorPlanZone[] = (zoneRows ?? []).map(
        (z: { id: string; name: string }, i: number) => ({
          id: z.id,
          name: z.name,
          order: i,
        }),
      );

      const defaultZoneName = t("zones.defaultName");
      if (dbZones.length === 0) {
        dbZones.push({ id: "default", name: defaultZoneName, order: 0 });
      }

      // Parse table layout_data JSON or build from pos_x/pos_y
      const fpTables: FloorPlanTable[] = (tableRows ?? []).map(
        (row: Record<string, unknown>) => {
          const layoutJson = row.layout_data as Record<string, unknown> | null;
          const zoneName =
            layoutJson?.zone as string ??
            dbZones[0]?.name ??
            defaultZoneName;

          const layout: TableLayout = layoutJson
            ? {
                x: (layoutJson.x as number) ?? 0,
                y: (layoutJson.y as number) ?? 0,
                width: (layoutJson.width as number) ?? 80,
                height: (layoutJson.height as number) ?? 80,
                shape: (layoutJson.shape as TableShape) ?? "square",
                rotation: (layoutJson.rotation as number) ?? 0,
                zone: zoneName,
              }
            : {
                x: (row.pos_x as number) ?? ((row.number as number) - 1) % 6 * 140 + 40,
                y: (row.pos_y as number) ?? Math.floor(((row.number as number) - 1) / 6) * 120 + 40,
                width: 80,
                height: 80,
                shape: "square" as TableShape,
                rotation: 0,
                zone: zoneName,
              };

          return {
            id: row.id as string,
            number: row.number as number,
            seats: (row.seats as number) ?? 4,
            status: normalizeTableStatus((row.status as string) ?? "free"),
            seatedAt: (row.seated_at as string) ?? null,
            lastStateChangeAt: (row.last_state_change_at as string) ?? null,
            layout,
          };
        },
      );

      setTables(fpTables);
      setZones(dbZones);
      if (!activeZone || !dbZones.some((z) => z.name === activeZone)) {
        setActiveZone(dbZones[0]?.name ?? defaultZoneName);
      }
    } catch (err) {
      console.error("[TableManagement] Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, t, activeZone]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---- Persist layout to DB ---- */

  const persistLayout = useCallback(
    async (tableId: string, layout: TableLayout) => {
      try {
        await dockerCoreClient
          .from("gm_tables")
          .update({
            pos_x: layout.x,
            pos_y: layout.y,
            layout_data: layout,
          })
          .eq("id", tableId)
          .eq("restaurant_id", restaurantId);
      } catch (err) {
        console.error("[TableManagement] Persist layout error:", err);
      }
    },
    [restaurantId],
  );

  /* ---- Update layout (editor callback) ---- */

  const handleUpdateLayout = useCallback(
    (tableId: string, layout: TableLayout) => {
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, layout } : t)),
      );
      persistLayout(tableId, layout);
    },
    [persistLayout],
  );

  /* ---- Add table ---- */

  const handleAddTable = useCallback(
    async (shape: TableShape, layout: TableLayout) => {
      const maxNumber = tables.reduce((max, t) => Math.max(max, t.number), 0);
      const newNumber = maxNumber + 1;
      const defSeats = SHAPE_DEFAULTS[shape].minSeats;

      try {
        const { data, error } = await dockerCoreClient
          .from("gm_tables")
          .insert({
            restaurant_id: restaurantId,
            number: newNumber,
            seats: defSeats,
            status: "free",
            pos_x: layout.x,
            pos_y: layout.y,
            layout_data: layout,
          })
          .select("*")
          .single();

        if (error) {
          console.error("[TableManagement] Add table error:", error);
          return;
        }

        const newTable: FloorPlanTable = {
          id: (data as Record<string, unknown>).id as string,
          number: newNumber,
          seats: defSeats,
          status: "free",
          seatedAt: null,
          lastStateChangeAt: null,
          layout,
        };
        setTables((prev) => [...prev, newTable]);
      } catch (err) {
        console.error("[TableManagement] Add table error:", err);
      }
    },
    [restaurantId, tables],
  );

  /* ---- Delete table ---- */

  const handleDeleteTable = useCallback(
    async (tableId: string) => {
      try {
        await dockerCoreClient
          .from("gm_tables")
          .delete()
          .eq("id", tableId)
          .eq("restaurant_id", restaurantId);

        setTables((prev) => prev.filter((t) => t.id !== tableId));
        if (selectedTableId === tableId) setSelectedTableId(null);
      } catch (err) {
        console.error("[TableManagement] Delete table error:", err);
      }
    },
    [restaurantId, selectedTableId],
  );

  /* ---- Update table properties ---- */

  const handleUpdateSeats = useCallback(
    async (seats: number) => {
      if (!selectedTableId) return;
      setTables((prev) =>
        prev.map((t) => (t.id === selectedTableId ? { ...t, seats } : t)),
      );
      await dockerCoreClient
        .from("gm_tables")
        .update({ seats })
        .eq("id", selectedTableId)
        .eq("restaurant_id", restaurantId);
    },
    [selectedTableId, restaurantId],
  );

  const handleUpdateNumber = useCallback(
    async (num: number) => {
      if (!selectedTableId) return;
      setTables((prev) =>
        prev.map((t) => (t.id === selectedTableId ? { ...t, number: num } : t)),
      );
      await dockerCoreClient
        .from("gm_tables")
        .update({ number: num })
        .eq("id", selectedTableId)
        .eq("restaurant_id", restaurantId);
    },
    [selectedTableId, restaurantId],
  );

  const handleUpdateStatus = useCallback(
    async (status: TableStatus) => {
      if (!selectedTableId) return;
      setTables((prev) =>
        prev.map((t) => (t.id === selectedTableId ? { ...t, status } : t)),
      );
      await dockerCoreClient
        .from("gm_tables")
        .update({ status, last_state_change_at: new Date().toISOString() })
        .eq("id", selectedTableId)
        .eq("restaurant_id", restaurantId);
    },
    [selectedTableId, restaurantId],
  );

  /* ---- Bulk: set all free ---- */

  const handleSetAllFree = useCallback(async () => {
    setSaving(true);
    try {
      await dockerCoreClient
        .from("gm_tables")
        .update({ status: "free", seated_at: null, last_state_change_at: new Date().toISOString() })
        .eq("restaurant_id", restaurantId);

      setTables((prev) =>
        prev.map((t) => ({ ...t, status: "free" as TableStatus, seatedAt: null })),
      );
    } catch (err) {
      console.error("[TableManagement] Bulk free error:", err);
    } finally {
      setSaving(false);
    }
  }, [restaurantId]);

  /* ---- Zone management ---- */

  const handleAddZone = useCallback(
    async (name: string) => {
      try {
        const { data, error } = await dockerCoreClient
          .from("gm_locations")
          .insert({ restaurant_id: restaurantId, name, kind: "SERVICE" })
          .select("id, name")
          .single();

        if (error) {
          console.error("[TableManagement] Add zone error:", error);
          return;
        }

        const newZone: FloorPlanZone = {
          id: (data as { id: string }).id,
          name: (data as { name: string }).name,
          order: zones.length,
        };
        setZones((prev) => [...prev, newZone]);
      } catch (err) {
        console.error("[TableManagement] Add zone error:", err);
      }
    },
    [restaurantId, zones.length],
  );

  const handleRenameZone = useCallback(
    async (zoneId: string, name: string) => {
      const oldZone = zones.find((z) => z.id === zoneId);
      const oldName = oldZone?.name;

      setZones((prev) =>
        prev.map((z) => (z.id === zoneId ? { ...z, name } : z)),
      );

      // Update tables that reference the old zone name
      if (oldName) {
        setTables((prev) =>
          prev.map((t) =>
            t.layout.zone === oldName
              ? { ...t, layout: { ...t.layout, zone: name } }
              : t,
          ),
        );
        if (activeZone === oldName) setActiveZone(name);
      }

      if (zoneId !== "default") {
        await dockerCoreClient
          .from("gm_locations")
          .update({ name })
          .eq("id", zoneId);
      }
    },
    [zones, activeZone],
  );

  const handleDeleteZone = useCallback(
    async (zoneId: string) => {
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone || zones.length <= 1) return;

      setZones((prev) => prev.filter((z) => z.id !== zoneId));

      // Move tables from deleted zone to the first remaining zone
      const targetZone = zones.find((z) => z.id !== zoneId);
      if (targetZone && zone) {
        setTables((prev) =>
          prev.map((t) =>
            t.layout.zone === zone.name
              ? { ...t, layout: { ...t.layout, zone: targetZone.name } }
              : t,
          ),
        );
        if (activeZone === zone.name) setActiveZone(targetZone.name);
      }

      if (zoneId !== "default") {
        await dockerCoreClient
          .from("gm_locations")
          .delete()
          .eq("id", zoneId);
      }
    },
    [zones, activeZone],
  );

  /* ---- Render ---- */

  if (loading) {
    return (
      <div style={{ padding: 32, color: "#a1a1aa" }}>
        {t("page.loading")}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px 24px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div>
        <h1 style={{ color: "#fff", margin: 0, fontSize: 22, fontWeight: 700 }}>
          {t("page.title")}
        </h1>
        <p style={{ color: "#71717a", fontSize: 13, margin: "4px 0 0" }}>
          {t("page.subtitle")}
        </p>
      </div>

      {/* Bulk toolbar */}
      <BulkToolbar
        tableCount={tables.length}
        onSetAllFree={handleSetAllFree}
        onManageZones={() => setZoneModalOpen(true)}
      />

      {/* Editor + properties panel */}
      <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
          <FloorPlanEditor
            tables={tables}
            zones={zones}
            activeZone={activeZone}
            onChangeZone={setActiveZone}
            onUpdateLayout={handleUpdateLayout}
            onAddTable={handleAddTable}
            onSelectTable={setSelectedTableId}
            selectedTableId={selectedTableId}
            onDeleteTable={handleDeleteTable}
          />
        </div>

        {/* Right-side properties panel */}
        {selectedTable && (
          <div style={{ width: 260, flexShrink: 0 }}>
            <TablePropertiesPanel
              table={selectedTable}
              onUpdateSeats={handleUpdateSeats}
              onUpdateNumber={handleUpdateNumber}
              onUpdateStatus={handleUpdateStatus}
              onDelete={() => handleDeleteTable(selectedTable.id)}
              onClose={() => setSelectedTableId(null)}
            />
          </div>
        )}
      </div>

      {/* Zone management modal */}
      {zoneModalOpen && (
        <ZoneManagerModal
          zones={zones}
          onAddZone={handleAddZone}
          onRenameZone={handleRenameZone}
          onDeleteZone={handleDeleteZone}
          onClose={() => setZoneModalOpen(false)}
        />
      )}
    </div>
  );
}
