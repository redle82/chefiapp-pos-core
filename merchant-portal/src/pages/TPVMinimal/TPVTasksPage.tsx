/**
 * TPVTasksPage — Kanban execution board for operational tasks.
 *
 * Four-column layout (Agir Agora | Em Curso | Aguardando | Concluídas)
 * with a cockpit KPI strip, station filter bar, and a sliding
 * detail panel on task selection.
 *
 * Data: single query for all today's tasks, split client-side.
 * Poll: every 5 seconds.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { dockerCoreClient } from "../../infra/docker-core/connection";
import type { CoreTask } from "../../infra/docker-core/types";
import {
  acknowledgeTask,
  assumeTask,
  resolveTask,
  escalateTask,
  dismissTask,
  reassignTask,
} from "../../infra/writers/TaskWriter";
import {
  readRestaurantPeople,
  type CoreRestaurantPerson,
} from "../../infra/readers/RestaurantPeopleReader";
import { useTPVRestaurantId } from "./hooks/useTPVRestaurantId";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StationFilter =
  | "ALL"
  | "SERVICE"
  | "KITCHEN"
  | "BAR"
  | "DELIVERY"
  | "STOCK"
  | "CLEANING";

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
const COL_YELLOW = "#eab308";
const COL_AMBER = "#f59e0b";

const OVERDUE_MS_CRITICA = 15 * 60 * 1000;
const OVERDUE_MS_DEFAULT = 30 * 60 * 1000;

const ORIGIN_COLORS: Record<string, string> = {
  TPV: "#f97316",
  KDS: "#8b5cf6",
  APPSTAFF: "#3b82f6",
  AUTO: "#06b6d4",
  MANUAL: "#a3a3a3",
  SYSTEM: "#6b7280",
  DELIVERY: "#ec4899",
};

const OVERDUE_STYLE_ID = "tpv-tasks-overdue-keyframes";

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
  if (task.due_at) {
    return Date.now() > new Date(task.due_at).getTime();
  }
  const age = Date.now() - new Date(task.created_at).getTime();
  const threshold =
    task.priority === "CRITICA" ? OVERDUE_MS_CRITICA : OVERDUE_MS_DEFAULT;
  return age > threshold;
}

function slaDisplay(task: CoreTask, t: (key: string, fallback: string) => string): { text: string; color: string } {
  if (task.due_at) {
    const remaining = new Date(task.due_at).getTime() - Date.now();
    if (remaining <= 0) {
      const overMins = Math.abs(Math.floor(remaining / 60000));
      return {
        text: t("tasks.slaOverdueMin", `Overdue ${overMins}min`).replace("{min}", String(overMins)),
        color: "#dc2626",
      };
    }
    const minsLeft = Math.floor(remaining / 60000);
    if (minsLeft < 60) {
      return { text: `${minsLeft}m`, color: minsLeft < 5 ? "#dc2626" : minsLeft < 15 ? "#eab308" : "#22c55e" };
    }
    const hrsLeft = Math.floor(minsLeft / 60);
    return { text: `${hrsLeft}h ${minsLeft % 60}m`, color: "#22c55e" };
  }

  // Elapsed-based SLA
  const elapsed = Date.now() - new Date(task.created_at).getTime();
  const mins = Math.floor(elapsed / 60000);
  const isCritica = task.priority === "CRITICA";
  const greenThresh = isCritica ? 15 : 30;
  const yellowThresh = isCritica ? 30 : 60;

  let color = "#22c55e";
  if (mins >= yellowThresh) color = "#dc2626";
  else if (mins >= greenThresh) color = "#eab308";

  if (mins < 60) return { text: `${mins}m`, color };
  const hours = Math.floor(mins / 60);
  return { text: `${hours}h ${mins % 60}m`, color };
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
    case "DELIVERY":
      return "\u{1F6F5}";
    case "STOCK":
      return "\u{1F4E6}";
    case "CLEANING":
      return "\u{1F9F9}";
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
    case "DELIVERY":
      return "Delivery";
    case "STOCK":
      return "Stock";
    case "CLEANING":
      return "Cleaning";
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

function isWaiting(task: CoreTask): boolean {
  if ((task as Record<string, unknown>).status === "WAITING") return true;
  if (task.context && typeof task.context === "object" && "waiting_on" in task.context && task.context.waiting_on) return true;
  return false;
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

const originBadgeStyle = (source: string): React.CSSProperties => ({
  fontSize: 9,
  fontWeight: 700,
  padding: "1px 5px",
  borderRadius: 4,
  backgroundColor: (ORIGIN_COLORS[source.toUpperCase()] ?? "#6b7280") + "20",
  color: ORIGIN_COLORS[source.toUpperCase()] ?? "#6b7280",
  textTransform: "uppercase",
  letterSpacing: 0.3,
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
        minWidth: 90,
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

function MetaItem({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
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
      <span style={{ fontSize: 13, color: valueColor ?? "#fafafa", fontWeight: 500 }}>
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
  const styleInjected = useRef(false);

  // Inject overdue keyframes once
  useEffect(() => {
    if (styleInjected.current) return;
    if (document.getElementById(OVERDUE_STYLE_ID)) {
      styleInjected.current = true;
      return;
    }
    const style = document.createElement("style");
    style.id = OVERDUE_STYLE_ID;
    style.textContent = `
      @keyframes overdueFlash {
        0%, 100% { border-left-color: #dc2626; }
        50% { border-left-color: #7f1d1d; }
      }
    `;
    document.head.appendChild(style);
    styleInjected.current = true;
  }, []);

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
  const [people, setPeople] = useState<CoreRestaurantPerson[]>([]);
  const [reassigning, setReassigning] = useState(false);

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

  // Load people for reassignment dropdown
  useEffect(() => {
    if (!restaurantId) return;
    readRestaurantPeople(restaurantId).then(setPeople).catch(() => {});
  }, [restaurantId]);

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

  // Agir Agora: OPEN tasks (not waiting)
  const columnNow = useMemo(
    () =>
      filtered
        .filter((t) => t.status === "OPEN" && !isWaiting(t))
        .sort(sortTasks),
    [filtered],
  );

  // Em Curso: ACKNOWLEDGED + IN_PROGRESS (not waiting)
  const columnInProgress = useMemo(
    () =>
      filtered
        .filter(
          (t) =>
            (t.status === "ACKNOWLEDGED" || t.status === "IN_PROGRESS") &&
            !isWaiting(t),
        )
        .sort(sortTasks),
    [filtered],
  );

  // Aguardando: tasks with waiting_on context or WAITING status
  const columnWaiting = useMemo(
    () =>
      filtered
        .filter((t) => isWaiting(t) && t.status !== "RESOLVED" && t.status !== "DISMISSED")
        .sort(sortTasks),
    [filtered],
  );

  // Concluídas: RESOLVED + DISMISSED
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

  const unassignedCount = columnNow.filter(
    (t) => !t.assigned_name,
  ).length;

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
  const handleAssume = useCallback(
    async (taskId: string) => {
      try {
        setActingOn(taskId);
        await assumeTask(taskId);
        await loadTasks();
        if (selectedTask?.id === taskId) {
          setSelectedTask((prev) =>
            prev ? { ...prev, status: "ACKNOWLEDGED" } : null,
          );
        }
      } catch (err) {
        console.error("[TPV Tasks] Assume error:", err);
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
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              style={{
                width: 90,
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
          {[1, 2, 3, 4].map((c) => (
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
  const renderTaskCard = (task: CoreTask, columnKey: string) => {
    const pColor = PRIORITY_COLOR[task.priority ?? "MEDIA"] ?? PRIORITY_COLOR.MEDIA;
    const pBg = PRIORITY_BG[task.priority ?? "MEDIA"] ?? PRIORITY_BG.MEDIA;
    const overdue = isOverdue(task);
    const isSelected = selectedTask?.id === task.id;
    const isActing = actingOn === task.id;
    const sla = slaDisplay(task, t);

    return (
      <div
        key={task.id}
        onClick={() => setSelectedTask(task)}
        style={{
          backgroundColor: "#1e1e1e",
          borderRadius: 12,
          padding: 12,
          cursor: "pointer",
          border: isSelected
            ? `1px solid ${COL_ORANGE}`
            : `1px solid #27272a`,
          borderLeftWidth: 3,
          borderLeftColor: pColor,
          borderLeftStyle: "solid",
          transition: "all 0.15s ease",
          opacity: isActing ? 0.6 : 1,
          ...(overdue
            ? {
                animation: "overdueFlash 2s ease-in-out infinite",
                borderLeftWidth: 3,
                borderLeftStyle: "solid",
              }
            : {}),
        }}
      >
        {/* Top row: priority badge + SLA */}
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
              color: sla.color,
              fontWeight: overdue ? 700 : 500,
            }}
          >
            {sla.text}
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

        {/* Meta row: origin + station + assignee */}
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 2,
          }}
        >
          {task.source_event && (
            <span style={originBadgeStyle(task.source_event)}>
              {sourceEventKey(task.source_event)}
            </span>
          )}
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
        </div>

        {/* Assignee line */}
        <div
          style={{
            fontSize: 10,
            color: task.assigned_name ? "#a3a3a3" : "#737373",
            display: "flex",
            alignItems: "center",
            gap: 3,
            marginTop: 2,
          }}
        >
          <span>{"\u{1F464}"}</span>
          <span>{task.assigned_name ?? t("tasks.unassigned", "Unassigned")}</span>
        </div>

        {/* Quick actions based on column */}
        {columnKey === "NOW" && (
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAssume(task.id);
              }}
              disabled={isActing}
              style={actionBtnStyle(COL_BLUE)}
            >
              {isActing ? "..." : t("tasks.actionAssume", "Assumir")}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResolve(task.id);
              }}
              disabled={isActing}
              style={actionBtnStyle(COL_GREEN)}
            >
              {isActing ? "..." : t("tasks.actionResolve", "Concluir")}
            </button>
          </div>
        )}

        {columnKey === "PROGRESS" && (
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResolve(task.id);
              }}
              disabled={isActing}
              style={actionBtnStyle(COL_GREEN)}
            >
              {isActing ? "..." : t("tasks.actionResolve", "Concluir")}
            </button>
          </div>
        )}

        {columnKey === "WAITING" && (
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResolve(task.id);
              }}
              disabled={isActing}
              style={actionBtnStyle(COL_GREEN)}
            >
              {isActing ? "..." : t("tasks.actionResolve", "Concluir")}
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

  // ---- Detail panel SLA ----
  const detailSla = selectedTask ? slaDisplay(selectedTask, t) : null;

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
            value={unassignedCount}
            label={t("tasks.kpiUnassigned", "Unassigned")}
            color={COL_AMBER}
            active={unassignedCount > 0}
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
          {(["ALL", "SERVICE", "KITCHEN", "BAR", "DELIVERY", "STOCK", "CLEANING"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStationFilter(f)}
              style={filterBtnStyle(stationFilter === f)}
            >
              {f === "ALL"
                ? t("tasks.filterAll", "All")
                : `${stationEmoji(f)} ${t(`tasks.filter${stationLabelKey(f)}`, stationLabelKey(f))}`}
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
              <option value="DELIVERY">
                {t("tasks.filterDelivery", "Delivery")}
              </option>
              <option value="STOCK">
                {t("tasks.filterStock", "Stock")}
              </option>
              <option value="CLEANING">
                {t("tasks.filterCleaning", "Cleaning")}
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
            t("tasks.columnNow", "Agir Agora"),
            COL_ORANGE,
            columnNow,
            "NOW",
            t("tasks.emptyNow", "No pending tasks"),
          )}
          {renderColumn(
            t("tasks.columnInProgress", "Em Curso"),
            COL_BLUE,
            columnInProgress,
            "PROGRESS",
            t("tasks.emptyInProgress", "No tasks in progress"),
          )}
          {renderColumn(
            t("tasks.columnWaiting", "Aguardando"),
            COL_YELLOW,
            columnWaiting,
            "WAITING",
            t("tasks.emptyWaiting", "No waiting tasks"),
          )}
          {renderColumn(
            t("tasks.columnDone", "Conclu\u00eddas"),
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
              width: 360,
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
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
              {selectedTask.source_event && (
                <span style={originBadgeStyle(selectedTask.source_event)}>
                  {sourceEventKey(selectedTask.source_event)}
                </span>
              )}
            </div>

            {/* Table number prominent display */}
            {selectedTask.context?.table_number && (
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: COL_ORANGE + "15",
                  borderRadius: 8,
                  border: `1px solid ${COL_ORANGE}40`,
                  fontSize: 16,
                  fontWeight: 700,
                  color: COL_ORANGE,
                  textAlign: "center",
                }}
              >
                Mesa {String(selectedTask.context.table_number)}
              </div>
            )}

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
                valueColor={
                  selectedTask.source_event
                    ? ORIGIN_COLORS[selectedTask.source_event.toUpperCase()] ?? "#fafafa"
                    : undefined
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
                value={detailSla?.text ?? "--"}
                valueColor={detailSla?.color}
              />
              <MetaItem
                label={t("tasks.detailAssignee", "Assignee")}
                value={
                  selectedTask.assigned_name
                    ? `\u{1F464} ${selectedTask.assigned_name}`
                    : `\u{1F464} ${t("tasks.unassigned", "Unassigned")}`
                }
              />
              {/* Reassign dropdown */}
              {people.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span
                    style={{
                      fontSize: 10,
                      color: "#737373",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {t("tasks.reassign", "Reassign")}
                  </span>
                  <select
                    disabled={reassigning}
                    value={selectedTask.assigned_name ?? ""}
                    onChange={async (e) => {
                      const person = people.find((p) => p.name === e.target.value);
                      setReassigning(true);
                      try {
                        await reassignTask(
                          selectedTask.id,
                          person?.id ?? null,
                          person?.name ?? null,
                        );
                        await loadTasks();
                        // Update selected task in-place
                        setSelectedTask((prev) =>
                          prev
                            ? { ...prev, assigned_to: person?.id ?? null, assigned_name: person?.name ?? null }
                            : null,
                        );
                      } catch {
                        // silent
                      } finally {
                        setReassigning(false);
                      }
                    }}
                    style={{
                      fontSize: 12,
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: "1px solid #404040",
                      background: "#1e1e1e",
                      color: "#e5e5e5",
                      cursor: reassigning ? "wait" : "pointer",
                    }}
                  >
                    <option value="">{t("tasks.unassigned", "Unassigned")}</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Order link */}
            {selectedTask.context?.order_id && (
              <div
                style={{
                  fontSize: 12,
                  color: COL_BLUE,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {t("tasks.viewOrder", "View Order")} #{String(selectedTask.context.order_id).slice(0, 8)}
              </div>
            )}

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
                  {selectedTask.context.waiting_on && (
                    <div style={{ fontSize: 12, color: "#a3a3a3" }}>
                      {t("tasks.contextWaitingOn", "Waiting on")}:{" "}
                      <span style={{ color: COL_YELLOW, fontWeight: 600 }}>
                        {String(selectedTask.context.waiting_on)}
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
              {(selectedTask.status === "RESOLVED" ||
                selectedTask.status === "DISMISSED") ? (
                <div
                  style={{
                    padding: "10px 16px",
                    borderRadius: 8,
                    backgroundColor: COL_GREEN + "10",
                    color: COL_GREEN,
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  {t("tasks.completed", "Completed")}
                </div>
              ) : (
                <>
                  {selectedTask.status === "OPEN" && (
                    <button
                      onClick={() => handleAssume(selectedTask.id)}
                      disabled={actingOn === selectedTask.id}
                      style={fullActionBtnStyle(COL_BLUE)}
                    >
                      {actingOn === selectedTask.id
                        ? "..."
                        : t("tasks.actionAssume", "Assumir")}
                    </button>
                  )}
                  <button
                    onClick={() => handleResolve(selectedTask.id)}
                    disabled={actingOn === selectedTask.id}
                    style={fullActionBtnStyle(COL_GREEN)}
                  >
                    {actingOn === selectedTask.id
                      ? "..."
                      : t("tasks.actionResolve", "Concluir")}
                  </button>
                  {selectedTask.priority !== "CRITICA" && (
                    <button
                      onClick={() => handleEscalate(selectedTask.id)}
                      disabled={actingOn === selectedTask.id}
                      style={fullActionBtnStyle("#ea580c")}
                    >
                      {actingOn === selectedTask.id
                        ? "..."
                        : t("tasks.actionEscalate", "Escalar")}
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(selectedTask.id)}
                    disabled={actingOn === selectedTask.id}
                    style={fullActionBtnStyle("#737373")}
                  >
                    {actingOn === selectedTask.id
                      ? "..."
                      : t("tasks.actionDismiss", "Descartar")}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
