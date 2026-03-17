/**
 * TPVTasksPage — Kanban execution board for operational tasks.
 *
 * Three-column layout (Action Now | In Progress | Done Today)
 * with a cockpit KPI strip, station filter bar, and a sliding
 * detail panel on task selection.
 *
 * Data: single query for all today's tasks, split client-side.
 * Poll: every 5 seconds.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { dockerCoreClient } from "../../infra/docker-core/connection";
import type { CoreTask } from "../../infra/docker-core/types";
import {
  acknowledgeTask,
  resolveTask,
  escalateTask,
  dismissTask,
} from "../../infra/writers/TaskWriter";
import { useTPVRestaurantId } from "./hooks/useTPVRestaurantId";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StationFilter = "ALL" | "SERVICE" | "KITCHEN" | "BAR";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRIORITY_COLOR: Record<string, string> = {
  CRITICA: "#dc2626",
  ALTA: "#ea580c",
  MEDIA: "#eab308",
  BAIXA: "#22c55e",
};

const PRIORITY_BG: Record<string, string> = {
  CRITICA: "rgba(220,38,38,0.15)",
  ALTA: "rgba(234,88,12,0.15)",
  MEDIA: "rgba(234,179,8,0.15)",
  BAIXA: "rgba(34,197,94,0.15)",
};

const COL_ORANGE = "#f97316";
const COL_BLUE = "#3b82f6";
const COL_GREEN = "#22c55e";

const OVERDUE_MS_CRITICA = 15 * 60 * 1000;
const OVERDUE_MS_DEFAULT = 30 * 60 * 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string, nowLabel: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return nowLabel;
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

function isOverdue(task: CoreTask): boolean {
  const age = Date.now() - new Date(task.created_at).getTime();
  const threshold =
    task.priority === "CRITICA" ? OVERDUE_MS_CRITICA : OVERDUE_MS_DEFAULT;
  return age > threshold;
}

function humanizeTitle(task: CoreTask): string {
  const msg = task.message ?? "";
  if (msg.match(/[0-9a-f]{8}-[0-9a-f]{4}/i)) {
    const ctx = task.context;
    if (ctx?.table_number)
      return `Mesa ${ctx.table_number} — ${ctx.category ?? msg.split(" ")[0]}`;
    if (ctx?.delay_seconds)
      return `Atraso ${Math.round(Number(ctx.delay_seconds) / 60)}min`;
    const stripped = msg
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        "",
      )
      .trim();
    return stripped || msg;
  }
  return msg;
}

function stationEmoji(station: string): string {
  switch (station) {
    case "KITCHEN":
      return "\u{1F373}";
    case "BAR":
      return "\u{1F37A}";
    case "SERVICE":
      return "\u{1F6CE}";
    default:
      return "\u{1F4CB}";
  }
}

function stationLabelKey(station: string): string {
  switch (station) {
    case "KITCHEN":
      return "Kitchen";
    case "BAR":
      return "Bar";
    case "SERVICE":
      return "Service";
    default:
      return "All";
  }
}

function sourceEventKey(s: string): string {
  const map: Record<string, string> = {
    MANUAL: "Manual",
    AUTO: "Auto",
    KDS: "KDS",
    TPV: "TPV",
    APPSTAFF: "AppStaff",
    DELIVERY: "Delivery",
    SYSTEM: "System",
  };
  return map[s.toUpperCase()] ?? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** Sort: CRITICA first, then by created_at descending */
function sortTasks(a: CoreTask, b: CoreTask): number {
  const prioOrder: Record<string, number> = {
    CRITICA: 0,
    ALTA: 1,
    MEDIA: 2,
    BAIXA: 3,
  };
  const pa = prioOrder[a.priority ?? "MEDIA"] ?? 2;
  const pb = prioOrder[b.priority ?? "MEDIA"] ?? 2;
  if (pa !== pb) return pa - pb;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

// ---------------------------------------------------------------------------
// Style factories
// ---------------------------------------------------------------------------

const filterBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: "6px 16px",
  borderRadius: 8,
  border: "none",
  fontSize: 13,
  fontWeight: active ? 700 : 500,
  cursor: "pointer",
  backgroundColor: active ? "#f97316" : "#1e1e1e",
  color: active ? "#000" : "#a3a3a3",
  transition: "all 0.15s ease",
});

const actionBtnStyle = (color: string): React.CSSProperties => ({
  padding: "4px 10px",
  borderRadius: 6,
  border: "none",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  backgroundColor: color + "20",
  color,
  transition: "background-color 0.15s ease",
});

const fullActionBtnStyle = (color: string): React.CSSProperties => ({
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  backgroundColor: color + "20",
  color,
  width: "100%",
  transition: "background-color 0.15s ease",
});

// ---------------------------------------------------------------------------
// Sub-components (inline)
// ---------------------------------------------------------------------------

function KpiBox({
  value,
  label,
  color,
  active,
}: {
  value: string | number;
  label: string;
  color: string;
  active: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "8px 16px",
        borderRadius: 12,
        backgroundColor: active ? color + "15" : "#141414",
        border: `1px solid ${active ? color + "40" : "#27272a"}`,
        minWidth: 100,
      }}
    >
      <span
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: active ? color : "#fafafa",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 10,
          color: "#737373",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          fontSize: 10,
          color: "#737373",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, color: "#fafafa", fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TPVTasksPage() {
  const { t } = useTranslation("tpv");
  const restaurantId = useTPVRestaurantId();
  const { runtime } = useRestaurantRuntime();

  // State
  const [allTasks, setAllTasks] = useState<CoreTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationFilter, setStationFilter] = useState<StationFilter>("ALL");
  const [selectedTask, setSelectedTask] = useState<CoreTask | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIA");
  const [newTaskStation, setNewTaskStation] = useState("SERVICE");

  // ---- Data loading ----
  const loadTasks = useCallback(async () => {
    if (runtime.loading || !runtime.coreReachable) {
      setAllTasks([]);
      setLoading(false);
      return;
    }
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data } = await dockerCoreClient
        .from("gm_tasks")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", todayStart.toISOString())
        .order("created_at", { ascending: false });

      setAllTasks((data as CoreTask[]) ?? []);
    } catch (err) {
      console.error("[TPV Tasks] Load error:", err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, runtime.loading, runtime.coreReachable]);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  // ---- Computed columns ----
  const filtered = useMemo(
    () =>
      allTasks.filter(
        (task) =>
          stationFilter === "ALL" ||
          (task.station ?? "SERVICE").toUpperCase() === stationFilter,
      ),
    [allTasks, stationFilter],
  );

  const columnNow = useMemo(
    () =>
      filtered
        .filter(
          (t) => t.status === "OPEN" || t.status === "ACKNOWLEDGED",
        )
        .sort(sortTasks),
    [filtered],
  );

  const columnInProgress = useMemo(
    () =>
      filtered
        .filter((t) => t.status === "IN_PROGRESS")
        .sort(sortTasks),
    [filtered],
  );

  const columnDone = useMemo(
    () =>
      filtered.filter(
        (t) => t.status === "RESOLVED" || t.status === "DISMISSED",
      ),
    [filtered],
  );

  // ---- KPI computations ----
  const criticalCount = columnNow.filter(
    (t) => t.priority === "CRITICA",
  ).length;

  const overdueCount = columnNow.filter((t) => isOverdue(t)).length;

  const avgResolutionMins = useMemo(() => {
    const resolved = columnDone.filter(
      (t) => t.resolved_at || t.completed_at,
    );
    if (!resolved.length) return 0;
    const total = resolved.reduce((sum, t) => {
      const end = new Date(
        t.resolved_at || t.completed_at || t.updated_at || t.created_at,
      ).getTime();
      const start = new Date(t.created_at).getTime();
      return sum + (end - start);
    }, 0);
    return Math.round(total / resolved.length / 60000);
  }, [columnDone]);

  const bottleneck = useMemo(() => {
    const counts: Record<string, number> = {};
    columnNow.forEach((t) => {
      const st = t.station || "SERVICE";
      counts[st] = (counts[st] || 0) + 1;
    });
    const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return max && max[1] > 2 ? max[0] : null;
  }, [columnNow]);

  // ---- Actions ----
  const handleAcknowledge = useCallback(
    async (taskId: string) => {
      try {
        setActingOn(taskId);
        await acknowledgeTask(taskId);
        await loadTasks();
        if (selectedTask?.id === taskId) {
          setSelectedTask((prev) =>
            prev ? { ...prev, status: "ACKNOWLEDGED" } : null,
          );
        }
      } catch (err) {
        console.error("[TPV Tasks] Acknowledge error:", err);
      } finally {
        setActingOn(null);
      }
    },
    [loadTasks, selectedTask?.id],
  );

  const handleResolve = useCallback(
    async (taskId: string) => {
      try {
        setActingOn(taskId);
        await resolveTask(taskId);
        await loadTasks();
        if (selectedTask?.id === taskId) setSelectedTask(null);
      } catch (err) {
        console.error("[TPV Tasks] Resolve error:", err);
      } finally {
        setActingOn(null);
      }
    },
    [loadTasks, selectedTask?.id],
  );

  const handleEscalate = useCallback(
    async (taskId: string) => {
      try {
        setActingOn(taskId);
        await escalateTask(taskId);
        await loadTasks();
      } catch (err) {
        console.error("[TPV Tasks] Escalate error:", err);
      } finally {
        setActingOn(null);
      }
    },
    [loadTasks],
  );

  const handleDismiss = useCallback(
    async (taskId: string) => {
      try {
        setActingOn(taskId);
        await dismissTask(taskId);
        await loadTasks();
        if (selectedTask?.id === taskId) setSelectedTask(null);
      } catch (err) {
        console.error("[TPV Tasks] Dismiss error:", err);
      } finally {
        setActingOn(null);
      }
    },
    [loadTasks, selectedTask?.id],
  );

  const handleCreateTask = useCallback(async () => {
    if (!newTaskTitle.trim()) return;
    try {
      setActingOn("creating");
      await dockerCoreClient.from("gm_tasks").insert({
        restaurant_id: restaurantId,
        message: newTaskTitle.trim(),
        priority: newTaskPriority,
        status: "OPEN",
        station: newTaskStation,
        source_event: "MANUAL",
        created_at: new Date().toISOString(),
      });
      setNewTaskTitle("");
      setShowCreateForm(false);
      await loadTasks();
    } catch (err) {
      console.error("[TPV Tasks] Create error:", err);
    } finally {
      setActingOn(null);
    }
  }, [restaurantId, newTaskTitle, newTaskPriority, newTaskStation, loadTasks]);

  // Keep selected task in sync with refreshed data
  useEffect(() => {
    if (selectedTask) {
      const updated = allTasks.find((t) => t.id === selectedTask.id);
      if (updated && updated.status !== selectedTask.status) {
        setSelectedTask(updated);
      }
    }
  }, [allTasks, selectedTask]);

  // ---- Loading skeleton ----
  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: 16,
          backgroundColor: "#0a0a0a",
        }}
      >
        {/* KPI strip skeleton */}
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                width: 100,
                height: 56,
                borderRadius: 12,
                backgroundColor: "#141414",
                border: "1px solid #27272a",
              }}
            />
          ))}
        </div>
        {/* Column skeletons */}
        <div style={{ display: "flex", gap: 12, flex: 1 }}>
          {[1, 2, 3].map((c) => (
            <div
              key={c}
              style={{
                flex: 1,
                backgroundColor: "#0f0f0f",
                borderRadius: 16,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: "#141414",
                }}
              />
              {[1, 2].map((r) => (
                <div
                  key={r}
                  style={{
                    height: 80,
                    borderRadius: 12,
                    backgroundColor: "#1e1e1e",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- Render task card ----
  const renderTaskCard = (task: CoreTask, columnStatus: string) => {
    const pColor = PRIORITY_COLOR[task.priority ?? "MEDIA"] ?? PRIORITY_COLOR.MEDIA;
    const pBg = PRIORITY_BG[task.priority ?? "MEDIA"] ?? PRIORITY_BG.MEDIA;
    const overdue = isOverdue(task);
    const isSelected = selectedTask?.id === task.id;
    const isActing = actingOn === task.id;

    return (
      <div
        key={task.id}
        onClick={() => setSelectedTask(task)}
        style={{
          backgroundColor: "#1e1e1e",
          borderRadius: 12,
          padding: 12,
          cursor: "pointer",
          borderLeft: `3px solid ${pColor}`,
          border: isSelected
            ? `1px solid ${COL_ORANGE}`
            : `1px solid #27272a`,
          borderLeftWidth: 3,
          borderLeftColor: pColor,
          transition: "all 0.15s ease",
          opacity: isActing ? 0.6 : 1,
        }}
      >
        {/* Top row: priority badge + time */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 4,
              backgroundColor: pBg,
              color: pColor,
            }}
          >
            {t(`tasks.priority.${task.priority}`, task.priority ?? "MEDIA")}
          </span>
          <span
            style={{
              fontSize: 10,
              color: overdue ? "#dc2626" : "#737373",
              fontWeight: overdue ? 700 : 400,
            }}
          >
            {timeAgo(task.created_at, t("tasks.now", "now"))}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#fafafa",
            marginBottom: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {humanizeTitle(task)}
        </div>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {task.station && (
            <span
              style={{
                fontSize: 10,
                padding: "1px 6px",
                borderRadius: 4,
                backgroundColor: "#27272a",
                color: "#a3a3a3",
              }}
            >
              {stationEmoji(task.station)}{" "}
              {t(
                `tasks.filter${stationLabelKey(task.station)}`,
                stationLabelKey(task.station),
              )}
            </span>
          )}
          {task.source_event && (
            <span style={{ fontSize: 10, color: "#737373" }}>
              {t(
                `tasks.source${sourceEventKey(task.source_event)}`,
                sourceEventKey(task.source_event),
              )}
            </span>
          )}
        </div>

        {/* Quick actions: Action Now column */}
        {(columnStatus === "NOW") && (
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            {task.status === "OPEN" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcknowledge(task.id);
                }}
                disabled={isActing}
                style={actionBtnStyle(COL_BLUE)}
              >
                {isActing ? "..." : t("tasks.actionAcknowledge", "Ack")}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResolve(task.id);
              }}
              disabled={isActing}
              style={actionBtnStyle(COL_GREEN)}
            >
              {isActing ? "..." : t("tasks.actionResolve", "Done")}
            </button>
          </div>
        )}

        {/* Quick action: In Progress column */}
        {columnStatus === "PROGRESS" && (
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResolve(task.id);
              }}
              disabled={isActing}
              style={actionBtnStyle(COL_GREEN)}
            >
              {isActing ? "..." : t("tasks.actionResolve", "Done")}
            </button>
          </div>
        )}
      </div>
    );
  };

  // ---- Render column ----
  const renderColumn = (
    title: string,
    color: string,
    tasks: CoreTask[],
    columnKey: string,
    emptyMsg: string,
  ) => (
    <div
      style={{
        flex: 1,
        backgroundColor: "#0f0f0f",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: "8px 12px",
          borderRadius: "12px 12px 0 0",
          backgroundColor: color + "10",
          borderBottom: `2px solid ${color}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{title}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color,
            backgroundColor: color + "20",
            padding: "2px 8px",
            borderRadius: 10,
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Card list */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 8,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {tasks.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#737373",
              fontSize: 12,
              padding: 20,
              textAlign: "center",
            }}
          >
            {emptyMsg}
          </div>
        ) : (
          tasks.map((task) => renderTaskCard(task, columnKey))
        )}
      </div>
    </div>
  );

  // ---- Main render ----
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0a0a0a",
        overflow: "hidden",
      }}
    >
      {/* Top section: KPI strip + filter bar */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          flexShrink: 0,
        }}
      >
        {/* Cockpit KPI Strip */}
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 4,
          }}
        >
          <KpiBox
            value={criticalCount}
            label={t("tasks.kpiCritical", "Critical")}
            color="#dc2626"
            active={criticalCount > 0}
          />
          <KpiBox
            value={overdueCount}
            label={t("tasks.kpiOverdue", "Overdue")}
            color="#ea580c"
            active={overdueCount > 0}
          />
          <KpiBox
            value={columnInProgress.length}
            label={t("tasks.kpiInProgress", "In progress")}
            color={COL_BLUE}
            active={columnInProgress.length > 0}
          />
          <KpiBox
            value={columnDone.length}
            label={t("tasks.kpiDoneToday", "Done today")}
            color={COL_GREEN}
            active={columnDone.length > 0}
          />
          <KpiBox
            value={avgResolutionMins > 0 ? `${avgResolutionMins}m` : "--"}
            label={t("tasks.kpiAvgTime", "Avg time")}
            color="#a3a3a3"
            active={false}
          />
          <KpiBox
            value={
              bottleneck
                ? t(
                    `tasks.filter${stationLabelKey(bottleneck)}`,
                    stationLabelKey(bottleneck),
                  )
                : "--"
            }
            label={t("tasks.kpiBottleneck", "Bottleneck")}
            color="#eab308"
            active={bottleneck !== null}
          />
        </div>

        {/* Filter bar */}
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {(["ALL", "SERVICE", "KITCHEN", "BAR"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStationFilter(f)}
              style={filterBtnStyle(stationFilter === f)}
            >
              {f === "ALL"
                ? t("tasks.filterAll", "All")
                : f === "SERVICE"
                  ? t("tasks.filterService", "Service")
                  : f === "KITCHEN"
                    ? t("tasks.filterKitchen", "Kitchen")
                    : t("tasks.filterBar", "Bar")}
            </button>
          ))}

          <div
            style={{
              width: 1,
              height: 20,
              backgroundColor: "#27272a",
              margin: "0 4px",
            }}
          />

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor: showCreateForm
                ? "rgba(220,38,38,0.15)"
                : COL_ORANGE,
              color: showCreateForm ? "#dc2626" : "#000",
            }}
          >
            {showCreateForm
              ? t("common:cancel", "Cancel")
              : t("tasks.newTask", "+ New")}
          </button>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 12,
              backgroundColor: "#141414",
              borderRadius: 12,
              alignItems: "center",
              border: "1px solid #27272a",
            }}
          >
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder={t("tasks.taskPlaceholder", "Task description...")}
              onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #27272a",
                backgroundColor: "#0a0a0a",
                color: "#fafafa",
                fontSize: 14,
                outline: "none",
              }}
            />
            <select
              title={t("tasks.priorityLabel", "Priority")}
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #27272a",
                backgroundColor: "#0a0a0a",
                color: "#fafafa",
                fontSize: 13,
                outline: "none",
              }}
            >
              <option value="BAIXA">
                {t("tasks.priority.BAIXA", "Low")}
              </option>
              <option value="MEDIA">
                {t("tasks.priority.MEDIA", "Medium")}
              </option>
              <option value="ALTA">
                {t("tasks.priority.ALTA", "High")}
              </option>
              <option value="CRITICA">
                {t("tasks.priority.CRITICA", "Critical")}
              </option>
            </select>
            <select
              title={t("tasks.stationLabel", "Station")}
              value={newTaskStation}
              onChange={(e) => setNewTaskStation(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #27272a",
                backgroundColor: "#0a0a0a",
                color: "#fafafa",
                fontSize: 13,
                outline: "none",
              }}
            >
              <option value="SERVICE">
                {t("tasks.filterService", "Service")}
              </option>
              <option value="KITCHEN">
                {t("tasks.filterKitchen", "Kitchen")}
              </option>
              <option value="BAR">
                {t("tasks.filterBar", "Bar")}
              </option>
            </select>
            <button
              onClick={handleCreateTask}
              disabled={!newTaskTitle.trim() || actingOn === "creating"}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: newTaskTitle.trim() ? "pointer" : "not-allowed",
                backgroundColor: newTaskTitle.trim() ? COL_ORANGE : "#1e1e1e",
                color: newTaskTitle.trim() ? "#000" : "#737373",
              }}
            >
              {actingOn === "creating"
                ? "..."
                : t("common:create", "Create")}
            </button>
          </div>
        )}
      </div>

      {/* Main content: Kanban + Detail panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Kanban columns */}
        <div
          style={{
            flex: 1,
            display: "flex",
            gap: 12,
            padding: "0 16px 16px 16px",
            overflow: "hidden",
          }}
        >
          {renderColumn(
            t("tasks.columnNow", "Action Now"),
            COL_ORANGE,
            columnNow,
            "NOW",
            t("tasks.emptyNow", "No pending tasks"),
          )}
          {renderColumn(
            t("tasks.columnInProgress", "In Progress"),
            COL_BLUE,
            columnInProgress,
            "PROGRESS",
            t("tasks.emptyInProgress", "No tasks in progress"),
          )}
          {renderColumn(
            t("tasks.columnDone", "Done Today"),
            COL_GREEN,
            columnDone,
            "DONE",
            t("tasks.emptyDone", "No completed tasks yet"),
          )}
        </div>

        {/* Detail panel (overlay on right) */}
        {selectedTask && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 340,
              backgroundColor: "#141414",
              borderLeft: "1px solid #27272a",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              overflow: "auto",
              zIndex: 10,
              boxShadow: "-4px 0 16px rgba(0,0,0,0.4)",
            }}
          >
            {/* Close button */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}
              >
                {t("tasks.detailPanel", "Task Details")}
              </span>
              <button
                onClick={() => setSelectedTask(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#737373",
                  cursor: "pointer",
                  fontSize: 18,
                  padding: 4,
                }}
              >
                {"\u2715"}
              </button>
            </div>

            {/* Priority + Status badges */}
            <div style={{ display: "flex", gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 6,
                  backgroundColor:
                    PRIORITY_BG[selectedTask.priority ?? "MEDIA"] ??
                    PRIORITY_BG.MEDIA,
                  color:
                    PRIORITY_COLOR[selectedTask.priority ?? "MEDIA"] ??
                    PRIORITY_COLOR.MEDIA,
                }}
              >
                {t(
                  `tasks.priority.${selectedTask.priority}`,
                  selectedTask.priority ?? "MEDIA",
                )}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: 6,
                  backgroundColor: "#0a0a0a",
                  color: "#a3a3a3",
                }}
              >
                {t(
                  `tasks.status.${selectedTask.status}`,
                  selectedTask.status,
                )}
              </span>
            </div>

            {/* Title */}
            <div
              style={{ fontSize: 16, fontWeight: 700, color: "#fafafa" }}
            >
              {humanizeTitle(selectedTask)}
            </div>

            {/* Original message if different */}
            {selectedTask.message &&
              selectedTask.message !== humanizeTitle(selectedTask) && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#737373",
                    fontStyle: "italic",
                  }}
                >
                  {selectedTask.message}
                </div>
              )}

            {/* Metadata grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <MetaItem
                label={t("tasks.detailOrigin", "Origin")}
                value={
                  selectedTask.source_event
                    ? t(
                        `tasks.source${sourceEventKey(selectedTask.source_event)}`,
                        sourceEventKey(selectedTask.source_event),
                      )
                    : "--"
                }
              />
              <MetaItem
                label={t("tasks.stationLabel", "Station")}
                value={
                  selectedTask.station
                    ? `${stationEmoji(selectedTask.station)} ${t(
                        `tasks.filter${stationLabelKey(selectedTask.station)}`,
                        stationLabelKey(selectedTask.station),
                      )}`
                    : "--"
                }
              />
              <MetaItem
                label={t("tasks.detailCreated", "Created")}
                value={timeAgo(
                  selectedTask.created_at,
                  t("tasks.now", "now"),
                )}
              />
              <MetaItem
                label={t("tasks.detailSLA", "SLA")}
                value={
                  isOverdue(selectedTask)
                    ? t("tasks.slaOverdue", "Overdue")
                    : t("tasks.slaOnTrack", "On track")
                }
              />
            </div>

            {/* Context details */}
            {selectedTask.context &&
              Object.keys(selectedTask.context).length > 0 && (
                <div
                  style={{
                    padding: 12,
                    backgroundColor: "#1e1e1e",
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "#737373",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 4,
                    }}
                  >
                    {t("tasks.detailContext", "Context")}
                  </span>
                  {selectedTask.context.table_number && (
                    <div style={{ fontSize: 12, color: "#a3a3a3" }}>
                      {t("tasks.contextTable", "Table")}:{" "}
                      <span style={{ color: "#fafafa", fontWeight: 600 }}>
                        {String(selectedTask.context.table_number)}
                      </span>
                    </div>
                  )}
                  {selectedTask.context.delay_seconds && (
                    <div style={{ fontSize: 12, color: "#a3a3a3" }}>
                      {t("tasks.contextDelay", "Delay")}:{" "}
                      <span style={{ color: "#fafafa", fontWeight: 600 }}>
                        {Math.round(
                          Number(selectedTask.context.delay_seconds) / 60,
                        )}
                        min
                      </span>
                    </div>
                  )}
                  {selectedTask.context.category && (
                    <div style={{ fontSize: 12, color: "#a3a3a3" }}>
                      {t("tasks.contextCategory", "Category")}:{" "}
                      <span style={{ color: "#fafafa", fontWeight: 600 }}>
                        {String(selectedTask.context.category)}
                      </span>
                    </div>
                  )}
                </div>
              )}

            {/* Action buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: "auto",
              }}
            >
              {selectedTask.status === "OPEN" && (
                <button
                  onClick={() => handleAcknowledge(selectedTask.id)}
                  disabled={actingOn === selectedTask.id}
                  style={fullActionBtnStyle(COL_BLUE)}
                >
                  {actingOn === selectedTask.id
                    ? "..."
                    : t("tasks.actionAcknowledge", "Acknowledge")}
                </button>
              )}
              {(selectedTask.status === "OPEN" ||
                selectedTask.status === "ACKNOWLEDGED" ||
                selectedTask.status === "IN_PROGRESS") && (
                <button
                  onClick={() => handleResolve(selectedTask.id)}
                  disabled={actingOn === selectedTask.id}
                  style={fullActionBtnStyle(COL_GREEN)}
                >
                  {actingOn === selectedTask.id
                    ? "..."
                    : t("tasks.actionResolve", "Resolve")}
                </button>
              )}
              {selectedTask.status !== "RESOLVED" &&
                selectedTask.priority !== "CRITICA" && (
                  <button
                    onClick={() => handleEscalate(selectedTask.id)}
                    disabled={actingOn === selectedTask.id}
                    style={fullActionBtnStyle("#ea580c")}
                  >
                    {actingOn === selectedTask.id
                      ? "..."
                      : t("tasks.actionEscalate", "Escalate")}
                  </button>
                )}
              {selectedTask.status !== "RESOLVED" &&
                selectedTask.status !== "DISMISSED" && (
                  <button
                    onClick={() => handleDismiss(selectedTask.id)}
                    disabled={actingOn === selectedTask.id}
                    style={fullActionBtnStyle("#737373")}
                  >
                    {actingOn === selectedTask.id
                      ? "..."
                      : t("tasks.actionDismiss", "Dismiss")}
                  </button>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
