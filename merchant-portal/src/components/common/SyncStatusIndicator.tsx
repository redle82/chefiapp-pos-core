/**
 * SyncStatusIndicator — Visual pill that shows the current sync state.
 *
 * States:
 *   synced   → green dot, "Sincronizado"
 *   syncing  → amber spinning dot, "A sincronizar..."
 *   offline  → red dot, "Offline"
 *   pending  → amber dot, "X pendentes"
 *   error    → red dot, "Erro de sync"
 *
 * Click expands a small popover with last sync time, pending count,
 * and a manual "Sync Now" button.
 */

import { useEffect, useRef, useState } from "react";
import { type SyncStatus, useSyncStatus } from "../../hooks/useSyncStatus";

/* ── Status visual config ─────────────────────────────────────── */

interface StatusConfig {
  dot: string;
  label: (count: number) => string;
  spin?: boolean;
}

const STATUS_MAP: Record<SyncStatus, StatusConfig> = {
  synced: {
    dot: "#4ade80",
    label: () => "Sincronizado",
  },
  syncing: {
    dot: "#f59e0b",
    label: () => "A sincronizar\u2026",
    spin: true,
  },
  offline: {
    dot: "#f87171",
    label: () => "Offline",
  },
  pending: {
    dot: "#f59e0b",
    label: (n) => `${n} pendente${n !== 1 ? "s" : ""}`,
  },
  error: {
    dot: "#f87171",
    label: () => "Erro de sync",
  },
};

/* ── Keyframes (injected once) ────────────────────────────────── */

const SPIN_ID = "sync-indicator-spin";

function ensureKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(SPIN_ID)) return;
  const style = document.createElement("style");
  style.id = SPIN_ID;
  style.textContent = `@keyframes sync-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`;
  document.head.appendChild(style);
}

/* ── Helpers ──────────────────────────────────────────────────── */

function formatTime(date: Date | null): string {
  if (!date) return "\u2014";
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

/* ── Component ────────────────────────────────────────────────── */

interface SyncStatusIndicatorProps {
  /** Compact mode hides the label text (dot only). Default: false. */
  compact?: boolean;
}

export function SyncStatusIndicator({ compact = false }: SyncStatusIndicatorProps) {
  const { status, pendingCount, lastSyncAt, syncNow } = useSyncStatus();
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureKeyframes();
  }, []);

  // Close popover on outside click
  useEffect(() => {
    if (!expanded) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [expanded]);

  const cfg = STATUS_MAP[status];
  const label = cfg.label(pendingCount);

  return (
    <div ref={containerRef} style={{ position: "relative", flexShrink: 0 }}>
      {/* Pill button */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        aria-label={`Sync status: ${label}`}
        title={label}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: compact ? "4px" : "4px 10px 4px 8px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.08)",
          backgroundColor: "rgba(255,255,255,0.04)",
          color: "#d4d4d4",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          lineHeight: 1,
          transition: "border-color 0.15s, background-color 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        {/* Dot */}
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            backgroundColor: cfg.dot,
            flexShrink: 0,
            display: "inline-block",
            ...(cfg.spin
              ? {
                  animation: "sync-spin 1s linear infinite",
                  borderRadius: 999,
                  border: "2px solid transparent",
                  borderTopColor: cfg.dot,
                  backgroundColor: "transparent",
                  width: 10,
                  height: 10,
                }
              : {}),
          }}
        />
        {!compact && <span>{label}</span>}
      </button>

      {/* Expanded popover */}
      {expanded && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 200,
            backgroundColor: "#1f1f1f",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: 14,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {/* Status row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: cfg.dot,
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#e5e5e5", fontSize: 13, fontWeight: 600 }}>
              {label}
            </span>
          </div>

          {/* Details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: 12,
              color: "#a3a3a3",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Pendentes</span>
              <span style={{ color: "#e5e5e5", fontWeight: 500 }}>
                {pendingCount}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Ultimo sync</span>
              <span style={{ color: "#e5e5e5", fontWeight: 500 }}>
                {formatTime(lastSyncAt)}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          />

          {/* Sync Now button */}
          <button
            type="button"
            onClick={() => {
              syncNow();
              setExpanded(false);
            }}
            disabled={status === "offline"}
            style={{
              width: "100%",
              padding: "8px 0",
              borderRadius: 8,
              border: "none",
              backgroundColor:
                status === "offline"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(249,115,22,0.15)",
              color: status === "offline" ? "#525252" : "#f97316",
              fontSize: 13,
              fontWeight: 600,
              cursor: status === "offline" ? "not-allowed" : "pointer",
              transition: "background-color 0.15s",
            }}
          >
            Sincronizar agora
          </button>
        </div>
      )}
    </div>
  );
}
