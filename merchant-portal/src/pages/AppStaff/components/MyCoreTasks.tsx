/**
 * MyCoreTasks — Mobile-first card list of personal tasks from gm_tasks (Core).
 * Shows tasks assigned to the current staff member, grouped by priority.
 * Polls every 5s. Actions: Iniciar (assumeTask) / Concluir (resolveTask).
 */

import React, { useCallback, useEffect, useState } from "react";
import type { CoreTask } from "../../../infra/docker-core/types";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import { assumeTask, resolveTask } from "../../../infra/writers/TaskWriter";

export interface MyCoreTasksProps {
  restaurantId: string;
  userId?: string;
  userName?: string;
}

/* ─── Priority config ─── */

const PRIORITY_ORDER: Record<string, number> = {
  CRITICA: 0,
  ALTA: 1,
  MEDIA: 2,
  BAIXA: 3,
};

const PRIORITY_COLOR: Record<string, string> = {
  CRITICA: "#dc2626",
  ALTA: "#f97316",
  MEDIA: "#eab308",
  BAIXA: "#22c55e",
};

const PRIORITY_LABEL: Record<string, string> = {
  CRITICA: "Critica",
  ALTA: "Alta",
  MEDIA: "Media",
  BAIXA: "Baixa",
};

/* ─── Station config ─── */

const STATION_EMOJI: Record<string, string> = {
  KITCHEN: "🍳",
  BAR: "🍹",
  SERVICE: "🍽️",
  GRILL: "🔥",
  PASTRY: "🧁",
  COLD: "❄️",
};

/* ─── Origin badge ─── */

function originLabel(task: CoreTask): string {
  if (task.auto_generated) return "Auto";
  const src = (task.source_event ?? "").toLowerCase();
  if (src.includes("kds")) return "KDS";
  if (src.includes("tpv")) return "TPV";
  return "Manual";
}

/* ─── Humanize title ─── */

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

function humanizeTitle(task: CoreTask): string {
  let title = task.message ?? task.task_type ?? task.type ?? "Tarefa";
  title = title.replace(UUID_RE, "").replace(/\s{2,}/g, " ").trim();
  // Append mesa context if available
  const mesa =
    (task.context as Record<string, unknown> | null)?.table_number ??
    (task.context as Record<string, unknown> | null)?.mesa;
  if (mesa) title += ` · Mesa ${mesa}`;
  return title;
}

/* ─── Time elapsed ─── */

function timeElapsed(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}min`;
  return `${Math.floor(hrs / 24)}d`;
}

/* ─── SLA color ─── */

function slaColor(task: CoreTask): string {
  const mins = (Date.now() - new Date(task.created_at).getTime()) / 60000;
  const priority = (task.priority ?? "MEDIA").toUpperCase();
  // SLA thresholds (minutes) per priority
  const thresholds: Record<string, [number, number]> = {
    CRITICA: [5, 10],
    ALTA: [10, 20],
    MEDIA: [20, 40],
    BAIXA: [40, 80],
  };
  const [yellow, red] = thresholds[priority] ?? [20, 40];
  if (mins >= red) return "#dc2626";
  if (mins >= yellow) return "#eab308";
  return "#22c55e";
}

/* ─── Styles (inline CSS-in-JS, light theme, mobile-first) ─── */

const S = {
  wrapper: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  header: {
    fontSize: 11,
    fontWeight: 700 as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    color: "#6b7280",
    margin: 0,
    padding: "0 2px",
  },
  card: {
    display: "flex",
    flexDirection: "row" as const,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
    overflow: "hidden" as const,
  },
  priorityBar: (color: string) => ({
    width: 4,
    flexShrink: 0 as const,
    background: color,
    borderRadius: "12px 0 0 12px",
  }),
  cardBody: {
    flex: 1,
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: 600 as const,
    color: "#111827",
    margin: 0,
    lineHeight: 1.3,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 6,
    alignItems: "center" as const,
  },
  badge: (bg: string, fg: string) => ({
    fontSize: 11,
    fontWeight: 600 as const,
    padding: "2px 6px",
    borderRadius: 4,
    background: bg,
    color: fg,
    whiteSpace: "nowrap" as const,
  }),
  timeMeta: {
    fontSize: 12,
    color: "#6b7280",
  },
  slaIndicator: (color: string) => ({
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
    marginRight: 4,
    verticalAlign: "middle" as const,
  }),
  actions: {
    display: "flex",
    gap: 8,
    marginTop: 4,
  },
  btn: (bg: string, fg: string) => ({
    minHeight: 44,
    padding: "0 16px",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600 as const,
    background: bg,
    color: fg,
    cursor: "pointer" as const,
    flex: 1,
    touchAction: "manipulation" as const,
  }),
  empty: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center" as const,
    gap: 6,
    padding: "20px 12px",
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: 600 as const,
    color: "#22c55e",
  },
  emptySubtext: {
    fontSize: 12,
    color: "#9ca3af",
  },
  skeleton: {
    background: "#f3f4f6",
    borderRadius: 12,
    height: 80,
    animation: "pulse 1.5s ease-in-out infinite",
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: 700 as const,
    color: "#374151",
    margin: "6px 0 2px 2px",
  },
} as const;

/* ─── Component ─── */

export const MyCoreTasks: React.FC<MyCoreTasksProps> = ({
  restaurantId,
  userId,
  userName,
}) => {
  const [tasks, setTasks] = useState<CoreTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const fetchTasks = useCallback(async () => {
    let q = dockerCoreClient
      .from("gm_tasks")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .not("status", "in", '("RESOLVED","DISMISSED")')
      .order("created_at", { ascending: false });

    // Filter by user if available
    if (userId || userName) {
      // Use OR filter: assigned_to = userId OR assigned_name = userName
      const orParts: string[] = [];
      if (userId) orParts.push(`assigned_to.eq.${userId}`);
      if (userName) orParts.push(`assigned_name.eq.${userName}`);
      q = q.or(orParts.join(","));
    }

    const { data } = await q;
    setTasks((data ?? []) as CoreTask[]);
    setLoading(false);
  }, [restaurantId, userId, userName]);

  // Initial load + poll every 5s
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleAssume = async (taskId: string) => {
    navigator.vibrate?.(50);
    setBusy((b) => ({ ...b, [taskId]: true }));
    try {
      await assumeTask(taskId, userName ?? null);
      await fetchTasks();
    } catch {
      // silent — task list will refresh anyway
    } finally {
      setBusy((b) => ({ ...b, [taskId]: false }));
    }
  };

  const handleResolve = async (taskId: string) => {
    navigator.vibrate?.(50);
    setBusy((b) => ({ ...b, [taskId]: true }));
    try {
      await resolveTask(taskId);
      await fetchTasks();
    } catch {
      // silent
    } finally {
      setBusy((b) => ({ ...b, [taskId]: false }));
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div style={S.wrapper}>
        <p style={S.header}>Minhas Tarefas Core</p>
        <div style={S.skeleton} />
        <div style={{ ...S.skeleton, height: 60 }} />
      </div>
    );
  }

  /* ── Empty state ── */
  if (tasks.length === 0) {
    return (
      <div style={S.wrapper}>
        <p style={S.header}>Minhas Tarefas Core</p>
        <div style={S.empty}>
          <span style={S.emptyIcon} aria-hidden>
            ✅
          </span>
          <span style={S.emptyText}>Sem tarefas pendentes</span>
          <span style={S.emptySubtext}>
            Nenhuma tarefa atribuida de momento.
          </span>
        </div>
      </div>
    );
  }

  /* ── Group by priority ── */
  const grouped = tasks.reduce<Record<string, CoreTask[]>>((acc, t) => {
    const p = (t.priority ?? "MEDIA").toUpperCase();
    if (!acc[p]) acc[p] = [];
    acc[p].push(t);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(
    ([a], [b]) => (PRIORITY_ORDER[a] ?? 9) - (PRIORITY_ORDER[b] ?? 9),
  );

  return (
    <div style={S.wrapper}>
      <p style={S.header}>Minhas Tarefas Core</p>

      {sortedGroups.map(([priority, groupTasks]) => (
        <React.Fragment key={priority}>
          <p style={S.groupLabel}>
            {PRIORITY_LABEL[priority] ?? priority} ({groupTasks.length})
          </p>
          {groupTasks.map((task) => {
            const pColor = PRIORITY_COLOR[priority] ?? "#9ca3af";
            const station = (task.station ?? "").toUpperCase();
            const stationEmoji = STATION_EMOJI[station] ?? "📋";

            return (
              <div key={task.id} style={S.card}>
                <div style={S.priorityBar(pColor)} />
                <div style={S.cardBody}>
                  <p style={S.title}>{humanizeTitle(task)}</p>

                  <div style={S.metaRow}>
                    {/* Station badge */}
                    {station && (
                      <span style={S.badge("#f3f4f6", "#374151")}>
                        {stationEmoji} {station}
                      </span>
                    )}
                    {/* Origin badge */}
                    <span style={S.badge("#eff6ff", "#1d4ed8")}>
                      {originLabel(task)}
                    </span>
                    {/* SLA + time */}
                    <span style={S.timeMeta}>
                      <span style={S.slaIndicator(slaColor(task))} />
                      {timeElapsed(task.created_at)}
                    </span>
                  </div>

                  <div style={S.actions}>
                    {task.status === "OPEN" ||
                    task.status === "ACKNOWLEDGED" ? (
                      <button
                        type="button"
                        style={S.btn("#2563eb", "#fff")}
                        disabled={busy[task.id]}
                        onClick={() => handleAssume(task.id)}
                      >
                        Iniciar
                      </button>
                    ) : null}
                    <button
                      type="button"
                      style={S.btn("#16a34a", "#fff")}
                      disabled={busy[task.id]}
                      onClick={() => handleResolve(task.id)}
                    >
                      Concluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};
