/**
 * ShiftClockWidget — Compact clock in/out widget for the TPV sidebar area.
 *
 * Shows:
 * - Current shift status (active / on break / not clocked in)
 * - Running timer with shift duration
 * - Clock in/out button
 * - Break start/end button
 * - Shift start time
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ShiftClockService,
  type BreakType,
  type ShiftLog,
} from "../../../core/shifts/ShiftService";
import { useOperator } from "../context/OperatorContext";
import { useTPVRestaurantId } from "../hooks/useTPVRestaurantId";

/* ── Helpers ────────────────────────────────────────────────────── */

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function minutesSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
}

/* ── Component ──────────────────────────────────────────────────── */

export function ShiftClockWidget() {
  const { t } = useTranslation("shift");
  const { operator } = useOperator();
  const restaurantId = useTPVRestaurantId();

  const [shift, setShift] = useState<ShiftLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load active shift on mount and operator change
  const loadShift = useCallback(async () => {
    if (!operator || !restaurantId) return;
    try {
      const active = await ShiftClockService.getActiveShift(
        operator.id,
        restaurantId,
      );
      setShift(active);
      if (active) {
        setElapsed(minutesSince(active.clock_in));
      }
    } catch {
      // silently ignore
    }
  }, [operator, restaurantId]);

  useEffect(() => {
    loadShift();
  }, [loadShift]);

  // Running timer: update every 30 seconds when shift is active
  useEffect(() => {
    if (shift && (shift.status === "active" || shift.status === "on_break")) {
      setElapsed(minutesSince(shift.clock_in));
      intervalRef.current = setInterval(() => {
        setElapsed(minutesSince(shift.clock_in));
      }, 30_000);
    } else {
      setElapsed(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [shift]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleClockIn = async () => {
    if (!operator || !restaurantId || loading) return;
    setLoading(true);
    try {
      const result = await ShiftClockService.clockIn(
        operator.id,
        operator.name,
        restaurantId,
        "manual",
      );
      if (result.success) {
        await loadShift();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!operator || !shift || loading) return;
    setLoading(true);
    try {
      await ShiftClockService.clockOut(operator.id, shift.id);
      setShift(null);
      setElapsed(0);
    } finally {
      setLoading(false);
    }
  };

  const handleBreakToggle = async (breakType: BreakType = "short") => {
    if (!shift || loading) return;
    setLoading(true);
    try {
      if (shift.status === "on_break") {
        await ShiftClockService.endBreak(shift.id);
      } else {
        await ShiftClockService.startBreak(shift.id, breakType);
      }
      await loadShift();
    } finally {
      setLoading(false);
    }
  };

  if (!operator) return null;

  const isActive = shift?.status === "active";
  const isOnBreak = shift?.status === "on_break";
  const isClockedIn = isActive || isOnBreak;

  const breakMinutes = shift
    ? ShiftClockService.calculateHours(shift).breakMinutes
    : 0;

  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: isClockedIn ? "rgba(16, 185, 129, 0.08)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${isClockedIn ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.06)"}`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Status indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: isOnBreak
              ? "#f59e0b"
              : isActive
                ? "#10b981"
                : "#6b7280",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: isOnBreak
              ? "#f59e0b"
              : isActive
                ? "#10b981"
                : "#a1a1aa",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {isOnBreak
            ? t("clock.onBreak", "On Break")
            : isActive
              ? t("clock.active", "Active")
              : t("clock.notClockedIn", "Not Clocked In")}
        </span>
      </div>

      {/* Timer + details (when clocked in) */}
      {isClockedIn && shift && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#fafafa",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.2,
            }}
          >
            {formatDuration(elapsed)}
          </div>
          <div style={{ fontSize: 11, color: "#737373" }}>
            {t("clock.since", "Since")} {formatTime(shift.clock_in)}
            {breakMinutes > 0 && (
              <span>
                {" "}
                · {t("clock.breakTime", "Break")}: {breakMinutes}m
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 6 }}>
        {isClockedIn ? (
          <>
            {/* Break toggle */}
            <button
              type="button"
              onClick={() => handleBreakToggle("short")}
              disabled={loading}
              style={{
                flex: 1,
                padding: "6px 0",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: isOnBreak ? "rgba(245, 158, 11, 0.15)" : "transparent",
                color: isOnBreak ? "#f59e0b" : "#a1a1aa",
                fontSize: 11,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {isOnBreak
                ? t("clock.endBreak", "End Break")
                : t("clock.startBreak", "Break")}
            </button>
            {/* Clock out */}
            <button
              type="button"
              onClick={handleClockOut}
              disabled={loading}
              style={{
                flex: 1,
                padding: "6px 0",
                borderRadius: 8,
                border: "none",
                background: "#dc2626",
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {t("clock.clockOut", "Clock Out")}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleClockIn}
            disabled={loading}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 8,
              border: "none",
              background: "#10b981",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading
              ? t("clock.loading", "...")
              : t("clock.clockIn", "Clock In")}
          </button>
        )}
      </div>
    </div>
  );
}
