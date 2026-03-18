/**
 * ShiftTaskSummary — Vista compacta de tarefas de turno materializadas.
 *
 * Le da lista unificada StaffContext.tasks (gm_tasks reais),
 * filtra as que tem metadata.templateKey (tarefas de turno).
 * Substitui o antigo RoleTaskChecklist com a mesma API de props.
 */

import React, { useMemo, useState } from "react";
import { useStaff } from "../context/StaffContext";
import type { Task } from "../context/StaffCoreTypes";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ShiftTaskSummaryProps {
  /** Numero maximo de tarefas visiveis (default: todas) */
  maxVisible?: number;
  /** Modo compacto — reduz padding e tamanho */
  compact?: boolean;
  /** Mostrar barra de progresso */
  showProgress?: boolean;
  /** Titulo da seccao (default: "Tarefas do Turno") */
  title?: string;
  /** Filtrar por momento do dia */
  filterMoment?: "opening" | "during_service" | "closing" | "anytime";
}

// ---------------------------------------------------------------------------
// Priority dot colors
// ---------------------------------------------------------------------------

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  urgent: "#f97316",
  attention: "#c9a227",
  background: "#6b7280",
};

const STATUS_COLORS: Record<string, { bg: string; border: string }> = {
  done: { bg: "#4ade80", border: "#22c55e" },
  focused: { bg: "#c9a227", border: "#a38521" },
  pending: { bg: "transparent", border: "#3f3f46" },
};

// ---------------------------------------------------------------------------
// Single task item
// ---------------------------------------------------------------------------

function ShiftTaskItem({
  task,
  compact,
  onComplete,
}: {
  task: Task;
  compact?: boolean;
  onComplete: (id: string) => void;
}) {
  const isDone = task.status === "done";
  const isFocused = task.status === "focused";
  const checkColor = STATUS_COLORS[task.status] ?? STATUS_COLORS.pending;
  const priorityColor = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.attention;
  const icon = task.metadata?.templateIcon;
  const mandatory = task.metadata?.templateMandatory;
  const evidence = task.metadata?.requiredEvidence;
  const estimatedMinutes = task.metadata?.estimatedMinutes;

  return (
    <button
      type="button"
      onClick={() => !isDone && onComplete(task.id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 10 : 12,
        width: "100%",
        padding: compact ? "10px 12px" : "12px 16px",
        borderRadius: 12,
        border: "1px solid #27272a",
        backgroundColor: isDone
          ? "rgba(74, 222, 128, 0.05)"
          : isFocused
            ? "rgba(201, 162, 39, 0.05)"
            : "#18181b",
        cursor: isDone ? "default" : "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
        transition: "background-color 0.15s, opacity 0.15s",
        opacity: isDone ? 0.6 : 1,
      }}
    >
      {/* Checkbox */}
      <div
        style={{
          width: compact ? 20 : 24,
          height: compact ? 20 : 24,
          borderRadius: 6,
          border: `2px solid ${checkColor.border}`,
          backgroundColor: checkColor.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.15s",
        }}
      >
        {isDone && (
          <svg
            width={compact ? 12 : 14}
            height={compact ? 12 : 14}
            viewBox="0 0 14 14"
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7l3 3 5-6" />
          </svg>
        )}
      </div>

      {/* Icon */}
      {icon && (
        <span style={{ fontSize: compact ? 16 : 20, flexShrink: 0 }}>
          {icon}
        </span>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              color: isDone ? "#737373" : "#fafafa",
              fontSize: compact ? 13 : 14,
              fontWeight: 600,
              textDecoration: isDone ? "line-through" : "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {task.title}
          </span>

          {/* Priority dot */}
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: priorityColor,
              flexShrink: 0,
            }}
          />

          {/* Mandatory badge */}
          {mandatory && !isDone && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#ef4444",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                padding: "1px 5px",
                borderRadius: 3,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              LEI
            </span>
          )}
        </div>

        {!compact && task.description && (
          <span
            style={{
              color: "#737373",
              fontSize: 12,
              display: "block",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {task.description}
          </span>
        )}
      </div>

      {/* Evidence indicator */}
      {evidence && !isDone && (
        <span
          style={{
            fontSize: 10,
            color: "#737373",
            flexShrink: 0,
          }}
        >
          {evidence === "TEMP_LOG" ? "\u{1F321}\u{FE0F}" : evidence === "PHOTO" ? "\u{1F4F7}" : "\u{1F4DD}"}
        </span>
      )}

      {/* Time estimate */}
      {!compact && estimatedMinutes != null && estimatedMinutes > 0 && (
        <span
          style={{
            color: "#525252",
            fontSize: 11,
            flexShrink: 0,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {estimatedMinutes}m
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const ShiftTaskSummary: React.FC<ShiftTaskSummaryProps> = ({
  maxVisible,
  compact = false,
  showProgress = true,
  title = "Tarefas do Turno",
  filterMoment,
}) => {
  const { tasks, completeTask } = useStaff();
  const [expanded, setExpanded] = useState(false);

  // Filter shift tasks (those with templateKey in metadata)
  const shiftTasks = useMemo(() => {
    let filtered = tasks.filter((t) => t.metadata?.templateKey);

    // Filter by moment if specified
    if (filterMoment) {
      filtered = filtered.filter((t) => {
        const cat = t.metadata?.templateCategory;
        if (filterMoment === "opening") return cat === "opening" || cat === "haccp" || cat === "cleaning" || cat === "operational" || cat === "maintenance";
        if (filterMoment === "closing") return cat === "closing";
        return true;
      });
    }

    // Sort: pending first, then focused, then done
    return [...filtered].sort((a, b) => {
      const statusOrder = { pending: 0, focused: 1, done: 2 };
      return (statusOrder[a.status] ?? 0) - (statusOrder[b.status] ?? 0);
    });
  }, [tasks, filterMoment]);

  const total = shiftTasks.length;
  const done = shiftTasks.filter((t) => t.status === "done").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  if (total === 0) return null;

  // Limit visible items
  const hasMore = maxVisible != null && shiftTasks.length > maxVisible;
  const visibleItems = expanded
    ? shiftTasks
    : maxVisible != null
      ? shiftTasks.slice(0, maxVisible)
      : shiftTasks;

  return (
    <div
      style={{
        marginBottom: compact ? 16 : 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: compact ? 10 : 14,
        }}
      >
        <span
          style={{
            color: "#fafafa",
            fontSize: compact ? 14 : 16,
            fontWeight: 700,
          }}
        >
          {title}
        </span>
        <span
          style={{
            color: "#737373",
            fontSize: 12,
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {done}/{total}
        </span>
      </div>

      {/* Progress bar */}
      {showProgress && (
        <div
          style={{
            width: "100%",
            height: compact ? 4 : 6,
            borderRadius: 3,
            backgroundColor: "#27272a",
            marginBottom: compact ? 10 : 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              borderRadius: 3,
              backgroundColor:
                progress === 100
                  ? "#4ade80"
                  : progress > 50
                    ? "#c9a227"
                    : "#f97316",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}

      {/* Task list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: compact ? 6 : 8,
        }}
      >
        {visibleItems.map((task) => (
          <ShiftTaskItem
            key={task.id}
            task={task}
            compact={compact}
            onComplete={completeTask}
          />
        ))}
      </div>

      {/* Show more / less */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            display: "block",
            width: "100%",
            padding: "8px",
            marginTop: 8,
            border: "none",
            backgroundColor: "transparent",
            color: "#c9a227",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "center",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {expanded
            ? "Mostrar menos"
            : `Ver mais ${shiftTasks.length - (maxVisible ?? 0)} tarefas`}
        </button>
      )}
    </div>
  );
};
