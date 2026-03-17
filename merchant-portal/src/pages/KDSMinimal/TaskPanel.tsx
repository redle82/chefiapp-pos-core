/**
 * TASK PANEL — Station-scoped sidebar for automatic tasks
 *
 * Compact sidebar component that complements the KDS order queue.
 * Shows station-relevant tasks sorted by priority, with collapse/expand,
 * auto-expand on CRITICA, and flash alerts.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import type { CoreTask } from "../../infra/docker-core/types";
import { readOpenTasks } from "../../infra/readers/TaskReader";
import {
  acknowledgeTask,
  resolveTask,
} from "../../infra/writers/TaskWriter";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PRIORITY_ORDER: Record<string, number> = {
  CRITICA: 0,
  ALTA: 1,
  MEDIA: 2,
  LOW: 3,
  BAIXA: 3,
};

const COLORS = {
  bg: "#141414",
  card: "#1e1e1e",
  cardHover: "#252525",
  text: "#e5e5e5",
  textMuted: "#9ca3af",
  border: "#2a2a2a",
  headerBg: "#1a1a1a",
  critica: "#dc2626",
  alta: "#ea580c",
  media: "#eab308",
  baixa: "#3b82f6",
  grey: "#6b7280",
  ackBtn: "#3b82f6",
  resolveBtn: "#22c55e",
  flash: "#dc262640",
} as const;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TaskPanelProps {
  restaurantId: string;
  station?: "BAR" | "KITCHEN" | "SERVICE";
  onTaskAcknowledged?: (taskId: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getPriorityColor(priority: CoreTask["priority"]): string {
  switch (priority) {
    case "CRITICA":
      return COLORS.critica;
    case "ALTA":
      return COLORS.alta;
    case "MEDIA":
      return COLORS.media;
    case "LOW":
    case "BAIXA":
      return COLORS.baixa;
    default:
      return COLORS.grey;
  }
}

function getPriorityLabel(priority: CoreTask["priority"]): string {
  switch (priority) {
    case "CRITICA":
      return "CRIT";
    case "ALTA":
      return "ALTA";
    case "MEDIA":
      return "MED";
    case "LOW":
    case "BAIXA":
      return "BAIXA";
    default:
      return String(priority ?? "");
  }
}

function sortByPriority(tasks: CoreTask[]): CoreTask[] {
  return [...tasks].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority ?? ""] ?? 99;
    const pb = PRIORITY_ORDER[b.priority ?? ""] ?? 99;
    if (pa !== pb) return pa - pb;
    // Same priority: oldest first
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

function elapsedMinutes(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.max(0, Math.floor(diff / 60_000));
  if (mins < 1) return "<1min";
  return `${mins}min`;
}

function humanizeMessage(msg: string | null | undefined): string {
  if (!msg) return "Tarefa";
  // Capitalize first letter, keep rest
  return msg.charAt(0).toUpperCase() + msg.slice(1);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TaskPanel({
  restaurantId,
  station,
  onTaskAcknowledged,
}: TaskPanelProps) {
  const [tasks, setTasks] = useState<CoreTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(true);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [evidenceInput, setEvidenceInput] = useState<Record<string, string>>(
    {}
  );
  const [headerFlash, setHeaderFlash] = useState(false);
  const prevCriticaIdsRef = useRef<Set<string>>(new Set());
  const { runtime } = useRestaurantRuntime();

  /* ---- Data loading ---- */

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      if (runtime.loading || !runtime.coreReachable) {
        setTasks([]);
        return;
      }
      const openTasks = await readOpenTasks(restaurantId, station);
      const sorted = sortByPriority(openTasks);
      setTasks(sorted);
    } catch (err) {
      console.error("Erro ao carregar tarefas:", err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, station, runtime.loading, runtime.coreReachable]);

  useEffect(() => {
    if (runtime.loading || !runtime.coreReachable) {
      setTasks([]);
      setLoading(false);
      return;
    }
    loadTasks();
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  /* ---- CRITICA auto-expand + flash ---- */

  useEffect(() => {
    const currentCriticaIds = new Set(
      tasks
        .filter((t) => t.priority === "CRITICA")
        .map((t) => t.id)
    );

    // Check for NEW critica tasks (not previously seen)
    let hasNew = false;
    currentCriticaIds.forEach((id) => {
      if (!prevCriticaIdsRef.current.has(id)) {
        hasNew = true;
      }
    });

    if (hasNew) {
      // Auto-expand
      setCollapsed(false);
      // Flash header
      setHeaderFlash(true);
      const timer = setTimeout(() => setHeaderFlash(false), 1500);
      // Update ref after setting flash
      prevCriticaIdsRef.current = currentCriticaIds;
      return () => clearTimeout(timer);
    }

    prevCriticaIdsRef.current = currentCriticaIds;
  }, [tasks]);

  /* ---- Actions ---- */

  const handleAcknowledge = async (taskId: string) => {
    try {
      setAcknowledging(taskId);
      await acknowledgeTask(taskId);
      await loadTasks();
      onTaskAcknowledged?.(taskId);
    } catch (err) {
      console.error("Erro ao reconhecer tarefa:", err);
    } finally {
      setAcknowledging(null);
    }
  };

  const handleResolve = async (taskId: string, task: CoreTask) => {
    try {
      setAcknowledging(taskId);

      const requiredEvidence = task.context?.required_evidence;
      let _evidence: Record<string, unknown> | undefined = undefined;

      if (requiredEvidence === "TEMP_LOG" && evidenceInput[taskId]) {
        const tempValue = parseFloat(evidenceInput[taskId]);
        if (!isNaN(tempValue)) {
          _evidence = { temperature: tempValue };
        }
      } else if (requiredEvidence === "TEXT" && evidenceInput[taskId]) {
        _evidence = { text: evidenceInput[taskId] };
      }

      await resolveTask(taskId);
      setEvidenceInput((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      await loadTasks();
      onTaskAcknowledged?.(taskId);
    } catch (err) {
      console.error("Erro ao resolver tarefa:", err);
    } finally {
      setAcknowledging(null);
    }
  };

  /* ---- Station label ---- */

  const stationLabel = station === "KITCHEN"
    ? "Cozinha"
    : station === "BAR"
      ? "Bar"
      : station === "SERVICE"
        ? "Salao"
        : "Geral";

  /* ---- Render ---- */

  const taskCount = tasks.length;
  const hasCritica = tasks.some((t) => t.priority === "CRITICA");

  // Header bar (always visible)
  const headerBar = (
    <div
      onClick={() => setCollapsed((c) => !c)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        backgroundColor: headerFlash ? COLORS.flash : COLORS.headerBg,
        borderRadius: collapsed ? "6px" : "6px 6px 0 0",
        cursor: "pointer",
        userSelect: "none",
        transition: "background-color 0.3s ease",
        border: hasCritica ? `1px solid ${COLORS.critica}44` : `1px solid ${COLORS.border}`,
        borderBottom: collapsed ? undefined : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: COLORS.text }}>
          Tarefas
        </span>
        <span style={{ fontSize: "11px", color: COLORS.textMuted }}>
          {stationLabel}
        </span>
        {taskCount > 0 && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#fff",
              backgroundColor: hasCritica ? COLORS.critica : COLORS.ackBtn,
              borderRadius: "10px",
              padding: "1px 7px",
              minWidth: "18px",
              textAlign: "center",
            }}
          >
            {taskCount}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: "10px",
          color: COLORS.textMuted,
          transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
          transition: "transform 0.2s ease",
          display: "inline-block",
        }}
      >
        ▼
      </span>
    </div>
  );

  // Loading state (collapsed)
  if (loading && tasks.length === 0) {
    return (
      <div style={{ fontFamily: "inherit" }}>
        {headerBar}
      </div>
    );
  }

  // No tasks
  if (taskCount === 0) {
    return (
      <div style={{ fontFamily: "inherit" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 12px",
            backgroundColor: COLORS.headerBg,
            borderRadius: "6px",
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <span style={{ fontSize: "13px", color: COLORS.textMuted }}>
            Sem tarefas pendentes
          </span>
        </div>
      </div>
    );
  }

  // Collapsed: show only header
  if (collapsed) {
    return <div style={{ fontFamily: "inherit" }}>{headerBar}</div>;
  }

  // Expanded: header + task list
  return (
    <div style={{ fontFamily: "inherit" }}>
      {headerBar}
      <div
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          backgroundColor: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderTop: "none",
          borderRadius: "0 0 6px 6px",
          padding: "4px",
        }}
      >
        {tasks.map((task) => {
          const priorityColor = getPriorityColor(task.priority);
          const isProcessing = acknowledging === task.id;
          const needsTempEvidence =
            task.context?.required_evidence === "TEMP_LOG";
          const needsTextEvidence =
            task.context?.required_evidence === "TEXT";
          const resolveDisabled =
            isProcessing ||
            (needsTempEvidence && !evidenceInput[task.id]);

          return (
            <div
              key={task.id}
              style={{
                display: "flex",
                alignItems: "stretch",
                backgroundColor: COLORS.card,
                borderRadius: "4px",
                marginBottom: "3px",
                overflow: "hidden",
              }}
            >
              {/* Priority color bar */}
              <div
                style={{
                  width: "4px",
                  flexShrink: 0,
                  backgroundColor: priorityColor,
                  borderRadius: "4px 0 0 4px",
                }}
              />

              {/* Content */}
              <div
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  minWidth: 0,
                }}
              >
                {/* Title line */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: COLORS.text,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      flex: 1,
                      minWidth: 0,
                    }}
                    title={task.message ?? undefined}
                  >
                    {humanizeMessage(task.message)}
                  </span>

                  {/* Action buttons */}
                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => handleAcknowledge(task.id)}
                      disabled={isProcessing}
                      title="Reconhecer"
                      style={{
                        width: "26px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: COLORS.ackBtn,
                        color: "#fff",
                        border: "none",
                        borderRadius: "3px",
                        cursor: isProcessing ? "wait" : "pointer",
                        fontSize: "11px",
                        fontWeight: 700,
                        opacity: isProcessing ? 0.5 : 1,
                        padding: 0,
                      }}
                    >
                      {isProcessing ? ".." : "\u2713"}
                    </button>
                    <button
                      onClick={() => handleResolve(task.id, task)}
                      disabled={resolveDisabled}
                      title="Resolver"
                      style={{
                        width: "26px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: COLORS.resolveBtn,
                        color: "#fff",
                        border: "none",
                        borderRadius: "3px",
                        cursor: resolveDisabled ? "not-allowed" : "pointer",
                        fontSize: "10px",
                        fontWeight: 700,
                        opacity: resolveDisabled ? 0.5 : 1,
                        padding: 0,
                      }}
                    >
                      {isProcessing ? ".." : "\u2713\u2713"}
                    </button>
                  </div>
                </div>

                {/* Bottom line: time + priority badge + evidence inputs */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "3px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: COLORS.textMuted,
                    }}
                  >
                    {elapsedMinutes(task.created_at)}
                  </span>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color: priorityColor,
                      padding: "1px 4px",
                      borderRadius: "3px",
                      backgroundColor: `${priorityColor}20`,
                      lineHeight: "14px",
                    }}
                  >
                    {getPriorityLabel(task.priority)}
                  </span>
                  {task.context?.legal_weight === "AUDIT_CRITICAL" && (
                    <span
                      style={{
                        fontSize: "9px",
                        color: COLORS.critica,
                        fontWeight: 700,
                      }}
                    >
                      AUDIT
                    </span>
                  )}

                  {/* Compact evidence inputs */}
                  {needsTempEvidence && (
                    <input
                      type="number"
                      step="0.1"
                      value={evidenceInput[task.id] || ""}
                      onChange={(e) =>
                        setEvidenceInput((prev) => ({
                          ...prev,
                          [task.id]: e.target.value,
                        }))
                      }
                      placeholder="°C"
                      style={{
                        width: "54px",
                        height: "18px",
                        padding: "0 4px",
                        fontSize: "10px",
                        backgroundColor: "#2a2a2a",
                        color: COLORS.text,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "3px",
                        outline: "none",
                      }}
                    />
                  )}
                  {needsTextEvidence && (
                    <input
                      type="text"
                      value={evidenceInput[task.id] || ""}
                      onChange={(e) =>
                        setEvidenceInput((prev) => ({
                          ...prev,
                          [task.id]: e.target.value,
                        }))
                      }
                      placeholder="Obs..."
                      style={{
                        flex: 1,
                        minWidth: "60px",
                        height: "18px",
                        padding: "0 4px",
                        fontSize: "10px",
                        backgroundColor: "#2a2a2a",
                        color: COLORS.text,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "3px",
                        outline: "none",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
