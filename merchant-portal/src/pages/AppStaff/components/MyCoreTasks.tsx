/**
 * MyCoreTasks — Mobile-first personal execution view for tasks from gm_tasks (Core).
 * Shows tasks assigned to the current staff member, grouped by priority.
 * Polls every 5s. State-aware actions: Assumir / Concluir / Bloquear / Desbloquear.
 * Evidence collection on complete (TEMP_LOG, TEXT, PHOTO).
 * Time urgency visuals, group headers with overdue counts, pull-to-refresh.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CoreTask } from "../../../infra/docker-core/types";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import {
  assumeTask,
  resolveTaskWithEvidence,
  blockTask,
  unblockTask,
} from "../../../infra/writers/TaskWriter";

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

const PRIORITY_EMOJI: Record<string, string> = {
  CRITICA: "\ud83d\udd34",
  ALTA: "\ud83d\udfe0",
  MEDIA: "\ud83d\udfe1",
  BAIXA: "\ud83d\udfe2",
};

/* ─── SLA thresholds (minutes) per priority ─── */

const SLA_THRESHOLDS: Record<string, [number, number]> = {
  CRITICA: [5, 10],
  ALTA: [10, 20],
  MEDIA: [20, 40],
  BAIXA: [40, 80],
};

/* ─── Station config ─── */

const STATION_EMOJI: Record<string, string> = {
  KITCHEN: "\ud83c\udf73",
  BAR: "\ud83c\udf79",
  SERVICE: "\ud83c\udf7d\ufe0f",
  GRILL: "\ud83d\udd25",
  PASTRY: "\ud83e\uddc1",
  COLD: "\u2744\ufe0f",
};

/* ─── Evidence types ─── */

type EvidenceType = "TEMP_LOG" | "TEXT" | "PHOTO";

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
  const ctx = (task.context ?? {}) as Record<string, unknown>;
  const mesa = ctx.table_number ?? ctx.mesa;
  const delaySeconds = ctx.delay_seconds;
  const taskType = task.task_type ?? task.type ?? "";

  // Build richer titles based on task_type + context
  if (taskType.toLowerCase().includes("delay") && mesa && typeof delaySeconds === "number") {
    const delayMins = Math.round(delaySeconds / 60);
    return `Mesa ${mesa} espera ha ${delayMins} min`;
  }

  let title = task.message ?? taskType ?? "Tarefa";
  title = title.replace(UUID_RE, "").replace(/\s{2,}/g, " ").trim();

  if (mesa) title += ` \u00b7 Mesa ${mesa}`;
  return title;
}

/* ─── Time elapsed ─── */

function timeElapsedMinutes(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
}

function formatElapsed(mins: number): string {
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}min`;
  return `${Math.floor(hrs / 24)}d`;
}

/* ─── SLA helpers ─── */

function isOverdue(task: CoreTask): boolean {
  const mins = timeElapsedMinutes(task.created_at);
  const priority = (task.priority ?? "MEDIA").toUpperCase();
  const [, red] = SLA_THRESHOLDS[priority] ?? [20, 40];
  return mins >= red;
}

function slaColor(task: CoreTask): string {
  const mins = timeElapsedMinutes(task.created_at);
  const priority = (task.priority ?? "MEDIA").toUpperCase();
  const [yellow, red] = SLA_THRESHOLDS[priority] ?? [20, 40];
  if (mins >= red) return "#dc2626";
  if (mins >= yellow) return "#eab308";
  return "#22c55e";
}

/* ─── Is waiting helper ─── */

function getWaitingReason(task: CoreTask): string | null {
  if (task.status === "WAITING") return "aguardando";
  const ctx = (task.context ?? {}) as Record<string, unknown>;
  if (ctx.waiting_on) return String(ctx.waiting_on);
  return null;
}

/* ─── Get required evidence ─── */

function getRequiredEvidence(task: CoreTask): EvidenceType | null {
  const ctx = (task.context ?? {}) as Record<string, unknown>;
  const ev = ctx.required_evidence;
  if (ev === "TEMP_LOG" || ev === "TEXT" || ev === "PHOTO") return ev;
  return null;
}

/* ─── CSS keyframes injection (once) ─── */

const KEYFRAMES_ID = "mycoretasks-keyframes";

function ensureKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement("style");
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes mct-pulse-red {
      0%, 100% { border-left-color: #dc2626; }
      50% { border-left-color: #fca5a5; }
    }
    @keyframes mct-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
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
  card: (overdue: boolean) => ({
    display: "flex",
    flexDirection: "row" as const,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
    overflow: "hidden" as const,
    borderLeft: overdue ? "4px solid #dc2626" : "none",
    animation: overdue ? "mct-pulse-red 2s ease-in-out infinite" : "none",
  }),
  priorityBar: (color: string, overdue: boolean) => ({
    width: overdue ? 0 : 4,
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
  titleRow: {
    display: "flex",
    alignItems: "center" as const,
    gap: 6,
  },
  stationEmojiLarge: {
    fontSize: 20,
    lineHeight: 1,
    flexShrink: 0 as const,
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
  timeBadge: (overdue: boolean) => ({
    fontSize: 11,
    fontWeight: 600 as const,
    padding: "2px 6px",
    borderRadius: 4,
    background: overdue ? "#fef2f2" : "#f3f4f6",
    color: overdue ? "#dc2626" : "#6b7280",
    whiteSpace: "nowrap" as const,
  }),
  waitingBadge: {
    fontSize: 11,
    fontWeight: 600 as const,
    padding: "2px 6px",
    borderRadius: 4,
    background: "#fefce8",
    color: "#a16207",
    whiteSpace: "nowrap" as const,
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
    flexWrap: "wrap" as const,
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
  btnOutline: (borderColor: string, fg: string) => ({
    minHeight: 44,
    padding: "0 16px",
    border: `2px solid ${borderColor}`,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600 as const,
    background: "transparent",
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
    display: "flex" as const,
    gap: 6,
    alignItems: "center" as const,
  },
  groupOverdue: {
    fontSize: 11,
    fontWeight: 600 as const,
    color: "#dc2626",
  },
  evidenceOverlay: {
    marginTop: 4,
    padding: "8px 10px",
    background: "#f9fafb",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  evidenceLabel: {
    fontSize: 12,
    fontWeight: 600 as const,
    color: "#374151",
  },
  evidenceInput: {
    fontSize: 14,
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  refreshLink: {
    display: "flex",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 6,
    padding: "8px 0",
    fontSize: 13,
    fontWeight: 600 as const,
    color: "#2563eb",
    cursor: "pointer" as const,
    background: "none",
    border: "none",
    touchAction: "manipulation" as const,
  },
  spinnerInline: {
    display: "inline-block",
    width: 14,
    height: 14,
    border: "2px solid #93c5fd",
    borderTop: "2px solid #2563eb",
    borderRadius: "50%",
    animation: "mct-spin 0.6s linear infinite",
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
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  // Evidence state: taskId -> { active, value }
  const [evidence, setEvidence] = useState<
    Record<string, { type: EvidenceType; value: string }>
  >({});

  // Track previous task IDs for detecting new critical tasks
  const prevTaskIdsRef = useRef<Set<string>>(new Set());

  // Inject keyframes on mount
  useEffect(() => {
    ensureKeyframes();
  }, []);

  const fetchTasks = useCallback(async () => {
    let q = dockerCoreClient
      .from("gm_tasks")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .not("status", "in", '("RESOLVED","DISMISSED")')
      .order("created_at", { ascending: false });

    // Filter by user if available — also include OPEN unassigned tasks
    if (userId || userName) {
      const orParts: string[] = [];
      if (userId) orParts.push(`assigned_to.eq.${userId}`);
      if (userName) orParts.push(`assigned_name.eq.${userName}`);
      // Include OPEN tasks that are not assigned to anyone
      orParts.push("assigned_to.is.null,assigned_name.is.null");
      q = q.or(orParts.join(","));
    }

    const { data } = await q;
    const fetched = (data ?? []) as CoreTask[];

    // Detect new critical tasks for haptic feedback
    const newIds = new Set(fetched.map((t) => t.id));
    const prevIds = prevTaskIdsRef.current;
    for (const t of fetched) {
      if (
        !prevIds.has(t.id) &&
        (t.priority ?? "").toUpperCase() === "CRITICA" &&
        prevIds.size > 0
      ) {
        navigator.vibrate?.(200);
        break;
      }
    }
    prevTaskIdsRef.current = newIds;

    setTasks(fetched);
    setLoading(false);
  }, [restaurantId, userId, userName]);

  // Initial load + poll every 5s
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  // Force re-render every 30s so elapsed times stay fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  /* ── Actions ── */

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

  const handleResolve = async (taskId: string, evidenceData?: Record<string, unknown>) => {
    navigator.vibrate?.([50, 50, 50]);
    setBusy((b) => ({ ...b, [taskId]: true }));
    try {
      await resolveTaskWithEvidence(taskId, evidenceData);
      // Clear any evidence state
      setEvidence((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      await fetchTasks();
    } catch {
      // silent
    } finally {
      setBusy((b) => ({ ...b, [taskId]: false }));
    }
  };

  const handleBlock = async (taskId: string) => {
    navigator.vibrate?.(100);
    setBusy((b) => ({ ...b, [taskId]: true }));
    try {
      await blockTask(taskId, "bloqueado pelo operador");
      await fetchTasks();
    } catch {
      // silent
    } finally {
      setBusy((b) => ({ ...b, [taskId]: false }));
    }
  };

  const handleUnblock = async (taskId: string) => {
    navigator.vibrate?.(50);
    setBusy((b) => ({ ...b, [taskId]: true }));
    try {
      await unblockTask(taskId);
      await fetchTasks();
    } catch {
      // silent
    } finally {
      setBusy((b) => ({ ...b, [taskId]: false }));
    }
  };

  const handleCompleteClick = (task: CoreTask) => {
    const reqEvidence = getRequiredEvidence(task);
    if (!reqEvidence) {
      handleResolve(task.id);
      return;
    }
    // If evidence form is already open, try to submit
    const current = evidence[task.id];
    if (current) {
      // For PHOTO, allow without value (placeholder)
      if (reqEvidence !== "PHOTO" && !current.value.trim()) return;
      // Build evidence object based on type
      const evidenceData: Record<string, unknown> = {};
      if (current.type === "TEMP_LOG") evidenceData.temperature = parseFloat(current.value);
      else if (current.type === "TEXT") evidenceData.text = current.value;
      else if (current.type === "PHOTO") evidenceData.photo = current.value;
      handleResolve(task.id, evidenceData);
      return;
    }
    // Open evidence form
    setEvidence((prev) => ({
      ...prev,
      [task.id]: { type: reqEvidence, value: "" },
    }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setTimeout(() => setRefreshing(false), 400);
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
            {"\u2705"}
          </span>
          <span style={S.emptyText}>Sem tarefas pendentes</span>
          <span style={S.emptySubtext}>
            Nenhuma tarefa atribuida de momento.
          </span>
        </div>
        <button
          type="button"
          style={S.refreshLink}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing && <span style={S.spinnerInline} />}
          Atualizar
        </button>
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

      {sortedGroups.map(([priority, groupTasks]) => {
        const overdueCount = groupTasks.filter(isOverdue).length;
        const emoji = PRIORITY_EMOJI[priority] ?? "\u26aa";

        return (
          <React.Fragment key={priority}>
            <p style={S.groupLabel}>
              <span>
                {emoji} {PRIORITY_LABEL[priority] ?? priority} ({groupTasks.length})
              </span>
              {overdueCount > 0 && (
                <span style={S.groupOverdue}>
                  {"\u2014"} {overdueCount} em atraso
                </span>
              )}
            </p>
            {groupTasks.map((task) => {
              const pColor = PRIORITY_COLOR[priority] ?? "#9ca3af";
              const station = (task.station ?? "").toUpperCase();
              const stationEmoji = STATION_EMOJI[station] ?? "";
              const taskOverdue = isOverdue(task);
              const waitingReason = getWaitingReason(task);
              const elapsedMins = timeElapsedMinutes(task.created_at);
              const elapsedStr = formatElapsed(elapsedMins);
              const status = (task.status ?? "").toUpperCase();
              const isOpen = status === "OPEN";
              const isInProgress =
                status === "IN_PROGRESS" || status === "ACKNOWLEDGED";
              const evidenceState = evidence[task.id] ?? null;

              return (
                <div key={task.id} style={S.card(taskOverdue)}>
                  <div style={S.priorityBar(pColor, taskOverdue)} />
                  <div style={S.cardBody}>
                    {/* Title row with prominent station emoji */}
                    <div style={S.titleRow}>
                      {stationEmoji && (
                        <span style={S.stationEmojiLarge}>{stationEmoji}</span>
                      )}
                      <p style={S.title}>{humanizeTitle(task)}</p>
                    </div>

                    <div style={S.metaRow}>
                      {/* Station label badge */}
                      {station && (
                        <span style={S.badge("#f3f4f6", "#374151")}>
                          {station}
                        </span>
                      )}
                      {/* Origin badge */}
                      <span style={S.badge("#eff6ff", "#1d4ed8")}>
                        {originLabel(task)}
                      </span>
                      {/* Status badge */}
                      <span
                        style={S.badge(
                          isOpen ? "#eff6ff" : "#ecfdf5",
                          isOpen ? "#1d4ed8" : "#059669",
                        )}
                      >
                        {isOpen ? "Aberta" : isInProgress ? "Em progresso" : status}
                      </span>
                      {/* Time badge */}
                      <span style={S.timeBadge(taskOverdue)}>
                        <span style={S.slaIndicator(slaColor(task))} />
                        {"\u23f1"} ha {elapsedStr}
                      </span>
                      {/* Waiting badge */}
                      {waitingReason && (
                        <span style={S.waitingBadge}>
                          Aguardando: {waitingReason}
                        </span>
                      )}
                    </div>

                    {/* Evidence form (if open) */}
                    {evidenceState && (
                      <div style={S.evidenceOverlay}>
                        {evidenceState.type === "TEMP_LOG" && (
                          <>
                            <span style={S.evidenceLabel}>
                              {"\ud83c\udf21\ufe0f"} Temperatura ({"\u00b0"}C)
                            </span>
                            <input
                              type="number"
                              style={S.evidenceInput}
                              placeholder="Ex: 4.5"
                              value={evidenceState.value}
                              onChange={(e) =>
                                setEvidence((prev) => ({
                                  ...prev,
                                  [task.id]: {
                                    ...prev[task.id],
                                    value: e.target.value,
                                  },
                                }))
                              }
                              autoFocus
                            />
                          </>
                        )}
                        {evidenceState.type === "TEXT" && (
                          <>
                            <span style={S.evidenceLabel}>
                              {"\ud83d\udcdd"} Observacao
                            </span>
                            <input
                              type="text"
                              style={S.evidenceInput}
                              placeholder="Descreva..."
                              value={evidenceState.value}
                              onChange={(e) =>
                                setEvidence((prev) => ({
                                  ...prev,
                                  [task.id]: {
                                    ...prev[task.id],
                                    value: e.target.value,
                                  },
                                }))
                              }
                              autoFocus
                            />
                          </>
                        )}
                        {evidenceState.type === "PHOTO" && (
                          <>
                            <span style={S.evidenceLabel}>
                              {"\ud83d\udcf8"} Foto necessaria
                            </span>
                            <button
                              type="button"
                              style={S.btnOutline("#d1d5db", "#374151")}
                              onClick={() =>
                                setEvidence((prev) => ({
                                  ...prev,
                                  [task.id]: {
                                    ...prev[task.id],
                                    value: "photo_placeholder",
                                  },
                                }))
                              }
                            >
                              {"\ud83d\udcf8"} Adicionar foto
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Actions — state-aware */}
                    <div style={S.actions}>
                      {/* OPEN: show Assumir prominently */}
                      {isOpen && (
                        <button
                          type="button"
                          style={S.btn("#2563eb", "#fff")}
                          disabled={busy[task.id]}
                          onClick={() => handleAssume(task.id)}
                        >
                          Assumir
                        </button>
                      )}

                      {/* IN_PROGRESS / ACKNOWLEDGED: Concluir + Bloquear */}
                      {isInProgress && !waitingReason && (
                        <>
                          <button
                            type="button"
                            style={S.btn("#16a34a", "#fff")}
                            disabled={busy[task.id]}
                            onClick={() => handleCompleteClick(task)}
                          >
                            {evidenceState ? "Confirmar" : "Concluir"}
                          </button>
                          <button
                            type="button"
                            style={S.btnOutline("#eab308", "#a16207")}
                            disabled={busy[task.id]}
                            onClick={() => handleBlock(task.id)}
                          >
                            Bloquear
                          </button>
                        </>
                      )}

                      {/* Waiting/blocked: show Desbloquear */}
                      {isInProgress && waitingReason && (
                        <>
                          <button
                            type="button"
                            style={S.btn("#2563eb", "#fff")}
                            disabled={busy[task.id]}
                            onClick={() => handleUnblock(task.id)}
                          >
                            Desbloquear
                          </button>
                          <button
                            type="button"
                            style={S.btn("#16a34a", "#fff")}
                            disabled={busy[task.id]}
                            onClick={() => handleCompleteClick(task)}
                          >
                            Concluir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        );
      })}

      {/* Pull-to-refresh feel */}
      <button
        type="button"
        style={S.refreshLink}
        onClick={handleRefresh}
        disabled={refreshing}
      >
        {refreshing && <span style={S.spinnerInline} />}
        Atualizar
      </button>
    </div>
  );
};
