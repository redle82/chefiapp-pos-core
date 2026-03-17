/**
 * TPVTasksPage — Painel de tarefas embebido no TPV HUB.
 *
 * Mostra tarefas operacionais do turno actual:
 * - Tarefas automáticas (atraso, temperatura, checklist)
 * - Filtro por estação (Serviço / Cozinha / Bar)
 * - Criação rápida de tarefas manuais
 * - Integração com TaskWriter do Core Docker
 *
 * Reutiliza TaskPanel do KDSMinimal e adicionalmente
 * mostra tarefas para SERVICE station (salão/caixa).
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { dockerCoreClient } from "../../infra/docker-core/connection";
import type { CoreTask } from "../../infra/docker-core/types";
import { readOpenTasks } from "../../infra/readers/TaskReader";
import { acknowledgeTask, resolveTask } from "../../infra/writers/TaskWriter";
import { useTPVRestaurantId } from "./hooks/useTPVRestaurantId";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StationFilter = "ALL" | "SERVICE" | "KITCHEN" | "BAR";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const FILTER_BTN = (active: boolean): React.CSSProperties => ({
  padding: "6px 16px",
  borderRadius: 8,
  border: "none",
  fontSize: 13,
  fontWeight: active ? 700 : 500,
  cursor: "pointer",
  backgroundColor: active
    ? "var(--color-primary, #c9a227)"
    : "var(--surface-elevated, #262626)",
  color: active ? "#000" : "var(--text-secondary, #a3a3a3)",
  transition: "all 0.15s ease",
});

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  CRITICA: { bg: "rgba(220,38,38,0.15)", text: "#dc2626" },
  ALTA: { bg: "rgba(234,88,12,0.15)", text: "#ea580c" },
  MEDIA: { bg: "rgba(234,179,8,0.15)", text: "#eab308" },
  BAIXA: { bg: "rgba(34,197,94,0.15)", text: "#22c55e" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TPVTasksPage() {
  const { t } = useTranslation("tpv");
  const restaurantId = useTPVRestaurantId();
  const { runtime } = useRestaurantRuntime();

  const [tasks, setTasks] = useState<CoreTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationFilter, setStationFilter] = useState<StationFilter>("ALL");
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<string>("MEDIA");

  // ---- Load tasks ----
  const loadTasks = useCallback(async () => {
    if (runtime.loading || !runtime.coreReachable) {
      setTasks([]);
      setLoading(false);
      return;
    }
    try {
      const stationArg =
        stationFilter === "ALL"
          ? undefined
          : (stationFilter as "SERVICE" | "KITCHEN" | "BAR");
      const openTasks = await readOpenTasks(restaurantId, stationArg);
      setTasks(openTasks);
    } catch (err) {
      console.error("[TPV Tasks] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, stationFilter, runtime.loading, runtime.coreReachable]);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  // ---- Actions ----
  const handleAcknowledge = useCallback(
    async (taskId: string) => {
      try {
        setActingOn(taskId);
        await acknowledgeTask(taskId);
        await loadTasks();
      } catch (err) {
        console.error("[TPV Tasks] Acknowledge error:", err);
      } finally {
        setActingOn(null);
      }
    },
    [loadTasks],
  );

  const handleResolve = useCallback(
    async (taskId: string) => {
      try {
        setActingOn(taskId);
        await resolveTask(taskId);
        await loadTasks();
      } catch (err) {
        console.error("[TPV Tasks] Resolve error:", err);
      } finally {
        setActingOn(null);
      }
    },
    [loadTasks],
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
        station: stationFilter === "ALL" ? "SERVICE" : stationFilter,
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
  }, [restaurantId, newTaskTitle, newTaskPriority, stationFilter, loadTasks]);

  // ---- Filter tasks ----
  const filteredTasks = tasks.filter((t) => {
    if (stationFilter === "ALL") return true;
    return (t.station ?? "SERVICE").toUpperCase() === stationFilter;
  });

  // ---- Stats ----
  const criticalCount = tasks.filter((t) => t.priority === "CRITICA").length;
  const openCount = tasks.filter((t) => t.status === "OPEN").length;

  // ---- Time ago helper ----
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("tasks.now");
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  // ---- Render ----
  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-tertiary, #737373)",
          fontSize: 14,
        }}
      >
        {t("tasks.loading")}
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 16,
        overflow: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary, #fafafa)",
            }}
          >
            {t("tasks.title")}
          </h2>
          <span
            style={{
              padding: "2px 10px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: "var(--surface-elevated, #262626)",
              color: "var(--text-secondary, #a3a3a3)",
            }}
          >
            {t("tasks.openCount", { count: openCount })}
          </span>
          {criticalCount > 0 && (
            <span
              style={{
                padding: "2px 10px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: "rgba(220,38,38,0.15)",
                color: "#dc2626",
              }}
            >
              {t("tasks.criticalCount", { count: criticalCount })}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {(["ALL", "SERVICE", "KITCHEN", "BAR"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStationFilter(f)}
              style={FILTER_BTN(stationFilter === f)}
            >
              {f === "ALL"
                ? t("tasks.filterAll")
                : f === "SERVICE"
                ? t("tasks.filterService")
                : f === "KITCHEN"
                ? t("tasks.filterKitchen")
                : t("tasks.filterBar")}
            </button>
          ))}
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
                : "var(--color-primary, #c9a227)",
              color: showCreateForm ? "#dc2626" : "#000",
            }}
          >
            {showCreateForm ? t("common:cancel") : t("tasks.newTask")}
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: 12,
            backgroundColor: "var(--surface-elevated, #1a1a1a)",
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder={t("tasks.taskPlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--surface-border, rgba(255,255,255,0.08))",
              backgroundColor: "var(--surface-base, #0d0d0d)",
              color: "var(--text-primary, #fafafa)",
              fontSize: 14,
              outline: "none",
            }}
          />
          <select
            title={t("tasks.priorityLabel")}
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--surface-border, rgba(255,255,255,0.08))",
              backgroundColor: "var(--surface-base, #0d0d0d)",
              color: "var(--text-primary, #fafafa)",
              fontSize: 13,
              outline: "none",
            }}
          >
            <option value="BAIXA">{t("tasks.priority.BAIXA")}</option>
            <option value="MEDIA">{t("tasks.priority.MEDIA")}</option>
            <option value="ALTA">{t("tasks.priority.ALTA")}</option>
            <option value="CRITICA">{t("tasks.priority.CRITICA")}</option>
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
              backgroundColor: newTaskTitle.trim()
                ? "var(--color-primary, #c9a227)"
                : "var(--surface-elevated, #262626)",
              color: newTaskTitle.trim()
                ? "#000"
                : "var(--text-tertiary, #737373)",
            }}
          >
            {actingOn === "creating" ? "…" : t("common:create")}
          </button>
        </div>
      )}

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "var(--text-tertiary, #737373)",
          }}
        >
          <span style={{ fontSize: 40 }}>🎯</span>
          <span style={{ fontSize: 14 }}>
            {stationFilter === "ALL"
              ? t("tasks.noTasks")
              : t("tasks.noTasksForStation", {
                  station:
                    stationFilter === "SERVICE"
                      ? t("tasks.filterService")
                      : stationFilter === "KITCHEN"
                      ? t("tasks.filterKitchen")
                      : t("tasks.filterBar"),
                })}
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredTasks.map((task) => {
            const prio =
              PRIORITY_COLORS[task.priority ?? "MEDIA"] ??
              PRIORITY_COLORS.MEDIA;
            return (
              <div
                key={task.id}
                style={{
                  backgroundColor: "var(--surface-elevated, #1a1a1a)",
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  borderLeft: `4px solid ${prio.text}`,
                }}
              >
                {/* Priority badge */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 6,
                    backgroundColor: prio.bg,
                    color: prio.text,
                    whiteSpace: "nowrap",
                  }}
                >
                  {task.priority}
                </span>

                {/* Title + details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary, #fafafa)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {task.message ?? "—"}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-tertiary, #737373)",
                      display: "flex",
                      gap: 8,
                      marginTop: 2,
                    }}
                  >
                    {task.station && (
                      <span>
                        {task.station === "KITCHEN"
                          ? t("tasks.filterKitchen")
                          : task.station === "BAR"
                          ? t("tasks.filterBar")
                          : t("tasks.filterService")}
                      </span>
                    )}
                    {task.source_event && (
                      <span>
                        {task.source_event === "MANUAL" ? t("tasks.sourceManual") : t("tasks.sourceAuto")}
                      </span>
                    )}
                    <span>{timeAgo(task.created_at)}</span>
                  </div>
                </div>

                {/* Status badge */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 6,
                    backgroundColor: "var(--surface-base, #0d0d0d)",
                    color: "var(--text-secondary, #a3a3a3)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t(`tasks.status.${task.status}`)}
                </span>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  {task.status === "OPEN" && (
                    <button
                      onClick={() => handleAcknowledge(task.id)}
                      disabled={actingOn === task.id}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 6,
                        border: "none",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        backgroundColor: "rgba(59,130,246,0.15)",
                        color: "#3b82f6",
                      }}
                      title={t("tasks.actionAcknowledgeTitle")}
                    >
                      {actingOn === task.id ? "…" : t("tasks.actionAcknowledge")}
                    </button>
                  )}
                  {(task.status === "OPEN" ||
                    task.status === "ACKNOWLEDGED" ||
                    task.status === "IN_PROGRESS") && (
                    <button
                      onClick={() => handleResolve(task.id)}
                      disabled={actingOn === task.id}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 6,
                        border: "none",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        backgroundColor: "rgba(34,197,94,0.15)",
                        color: "#22c55e",
                      }}
                      title={t("tasks.actionResolveTitle")}
                    >
                      {actingOn === task.id ? "…" : t("tasks.actionResolve")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
