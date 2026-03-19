/**
 * ReservationBoard — Gap #9 (Competitive)
 *
 * Full CRUD reservation board for the TPV context tab.
 * - Day view with time slots
 * - Week view with 7-day timeline grid
 * - Create / edit / cancel reservations
 * - Status badges (CONFIRMED, SEATED, COMPLETED, NO_SHOW, CANCELLED)
 * - Party size + customer info + special requests
 * - Confirmation dialogs for destructive actions (cancel, no-show)
 * - Integrated with Docker Core (PostgREST) via gm_reservations table
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFormatLocale } from "../../../core/i18n/regionLocaleConfig";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import { colors } from "../../../ui/design-system/tokens/colors";
import { spacing } from "../../../ui/design-system/tokens/spacing";

interface ReservationBoardProps {
  restaurantId: string;
}

type ReservationStatus =
  | "CONFIRMED"
  | "CANCELLED"
  | "NO_SHOW"
  | "COMPLETED"
  | "SEATED";

interface ReservationRow {
  id: string;
  restaurant_id: string;
  table_id?: string | null;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  duration_minutes: number;
  status: ReservationStatus;
  special_requests?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  CONFIRMED: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
  SEATED: { bg: "rgba(34,197,94,0.15)", text: "#4ade80" },
  COMPLETED: { bg: "rgba(107,114,128,0.15)", text: "#9ca3af" },
  NO_SHOW: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24" },
  CANCELLED: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
};

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString(getFormatLocale(), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString(getFormatLocale(), {
    day: "numeric",
    month: "short",
  });
}

function formatWeekdayShort(d: Date): string {
  return d.toLocaleDateString(getFormatLocale(), { weekday: "short" });
}

/** Get the Monday of the week containing the given date. */
function getWeekStart(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Get array of 7 dates starting from the given date. */
function getWeekDays(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

// ---------------------------------------------------------------------------
// Confirmation Dialog
// ---------------------------------------------------------------------------

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <div
      data-testid="confirm-dialog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          backgroundColor: "#1e1e1e",
          borderRadius: 12,
          padding: 24,
          minWidth: 320,
          maxWidth: 420,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#fafafa",
            marginBottom: 8,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 14,
            color: "#9ca3af",
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          {message}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            data-testid="confirm-dialog-cancel"
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              cursor: "pointer",
              backgroundColor: "transparent",
              color: "#9ca3af",
            }}
          >
            {cancelLabel}
          </button>
          <button
            data-testid="confirm-dialog-confirm"
            onClick={onConfirm}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              backgroundColor: destructive ? "#ef4444" : colors.action.base,
              color: "#fff",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create / Edit Form
// ---------------------------------------------------------------------------

interface ReservationFormData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  duration_minutes: number;
  special_requests: string;
}

const emptyForm = (date: string): ReservationFormData => ({
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  party_size: 2,
  reservation_date: date,
  reservation_time: "19:00",
  duration_minutes: 90,
  special_requests: "",
});

function ReservationForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: ReservationFormData;
  onSave: (data: ReservationFormData) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const { t } = useTranslation("tpv");
  const [form, setForm] = useState<ReservationFormData>(initial);

  const set = <K extends keyof ReservationFormData>(
    key: K,
    value: ReservationFormData[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    fontSize: 14,
    borderRadius: 8,
    border: `1px solid ${colors.border.subtle}`,
    backgroundColor: colors.surface.layer2,
    color: colors.text.primary,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: colors.text.secondary,
    marginBottom: 4,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Row: Name + Phone */}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 2 }}>
          <label style={labelStyle}>{t("reservations.customerName")}</label>
          <input
            style={inputStyle}
            placeholder={t("reservations.namePlaceholder")}
            value={form.customer_name}
            onChange={(e) => set("customer_name", e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>{t("reservations.phone")}</label>
          <input
            style={inputStyle}
            placeholder="+351 9..."
            value={form.customer_phone}
            onChange={(e) => set("customer_phone", e.target.value)}
          />
        </div>
      </div>

      {/* Row: Email */}
      <div>
        <label style={labelStyle}>{t("reservations.email")}</label>
        <input
          style={inputStyle}
          placeholder="email@exemplo.com"
          type="email"
          value={form.customer_email}
          onChange={(e) => set("customer_email", e.target.value)}
        />
      </div>

      {/* Row: Date + Time + Party size */}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>{t("reservations.date")}</label>
          <input
            style={inputStyle}
            type="date"
            value={form.reservation_date}
            onChange={(e) => set("reservation_date", e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>{t("reservations.time")}</label>
          <input
            style={inputStyle}
            type="time"
            value={form.reservation_time}
            onChange={(e) => set("reservation_time", e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>{t("reservations.partySize")}</label>
          <input
            style={inputStyle}
            type="number"
            min={1}
            max={30}
            value={form.party_size}
            onChange={(e) => set("party_size", Number(e.target.value))}
          />
        </div>
      </div>

      {/* Row: Duration */}
      <div style={{ maxWidth: 160 }}>
        <label style={labelStyle}>{t("reservations.duration")}</label>
        <select
          style={inputStyle}
          value={form.duration_minutes}
          onChange={(e) => set("duration_minutes", Number(e.target.value))}
        >
          {[60, 90, 120, 150, 180].map((m) => (
            <option key={m} value={m}>
              {m} min
            </option>
          ))}
        </select>
      </div>

      {/* Special requests */}
      <div>
        <label style={labelStyle}>{t("reservations.specialRequests")}</label>
        <textarea
          style={{
            ...inputStyle,
            minHeight: 48,
            resize: "vertical",
          }}
          placeholder={t("reservations.specialRequestsPlaceholder")}
          value={form.special_requests}
          onChange={(e) => set("special_requests", e.target.value)}
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: 8,
            cursor: "pointer",
            backgroundColor: "transparent",
            color: colors.text.secondary,
          }}
        >
          {t("common:cancel")}
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.customer_name.trim()}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            borderRadius: 8,
            cursor: saving ? "wait" : "pointer",
            backgroundColor: saving ? "#9ca3af" : colors.action.base,
            color: "#fff",
            opacity: !form.customer_name.trim() ? 0.5 : 1,
          }}
        >
          {saving ? t("common:saving") : t("common:save")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action button helper
// ---------------------------------------------------------------------------

function actionBtnStyle(color: string): React.CSSProperties {
  return {
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    backgroundColor: `${color}20`,
    fontSize: 14,
  };
}

// ---------------------------------------------------------------------------
// Week Timeline View
// ---------------------------------------------------------------------------

const WEEK_HOURS_START = 11;
const WEEK_HOURS_END = 23;
const HOUR_HEIGHT = 56;

function WeekTimelineView({
  weekStart,
  reservations,
  onClickReservation,
}: {
  weekStart: Date;
  reservations: ReservationRow[];
  onClickReservation: (r: ReservationRow) => void;
}) {
  const { t } = useTranslation("tpv");
  const days = getWeekDays(weekStart);
  const hours = Array.from(
    { length: WEEK_HOURS_END - WEEK_HOURS_START },
    (_, i) => WEEK_HOURS_START + i,
  );

  const todayStr = formatDate(new Date());

  // Group reservations by date string
  const byDate = useMemo(() => {
    const map: Record<string, ReservationRow[]> = {};
    for (const r of reservations) {
      if (!map[r.reservation_date]) map[r.reservation_date] = [];
      map[r.reservation_date].push(r);
    }
    return map;
  }, [reservations]);

  return (
    <div
      data-testid="week-view"
      style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}
    >
      <div style={{ display: "flex", minWidth: 800 }}>
        {/* Time column */}
        <div
          style={{
            width: 52,
            flexShrink: 0,
            borderRight: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Header spacer */}
          <div
            style={{
              height: 48,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          />
          {hours.map((h) => (
            <div
              key={h}
              style={{
                height: HOUR_HEIGHT,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                paddingRight: 8,
                paddingTop: 2,
                fontSize: 11,
                color: "#737373",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day) => {
          const dateStr = formatDate(day);
          const isToday = dateStr === todayStr;
          const dayReservations = byDate[dateStr] || [];

          return (
            <div
              key={dateStr}
              data-testid={`week-day-${dateStr}`}
              style={{
                flex: 1,
                minWidth: 100,
                borderRight: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Day header */}
              <div
                style={{
                  height: 48,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: isToday
                    ? "rgba(59,130,246,0.1)"
                    : "transparent",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: isToday ? "#60a5fa" : "#737373",
                    textTransform: "uppercase",
                  }}
                >
                  {formatWeekdayShort(day)}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? "#60a5fa" : "#e5e5e5",
                  }}
                >
                  {day.getDate()}
                </div>
              </div>

              {/* Time slots grid */}
              <div style={{ position: "relative" }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{
                      height: HOUR_HEIGHT,
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  />
                ))}

                {/* Reservation blocks */}
                {dayReservations.map((r) => {
                  const [hh, mm] = r.reservation_time.split(":").map(Number);
                  const startMinutes =
                    (hh - WEEK_HOURS_START) * 60 + (mm || 0);
                  const topPx = (startMinutes / 60) * HOUR_HEIGHT;
                  const heightPx =
                    (r.duration_minutes / 60) * HOUR_HEIGHT;

                  // Only show if within visible range
                  if (hh < WEEK_HOURS_START || hh >= WEEK_HOURS_END)
                    return null;

                  const statusInfo =
                    STATUS_COLORS[r.status] || STATUS_COLORS.CONFIRMED;

                  return (
                    <div
                      key={r.id}
                      onClick={() => onClickReservation(r)}
                      style={{
                        position: "absolute",
                        top: topPx,
                        left: 2,
                        right: 2,
                        height: Math.max(heightPx - 2, 20),
                        backgroundColor: statusInfo.bg,
                        border: `1px solid ${statusInfo.text}33`,
                        borderRadius: 6,
                        padding: "3px 6px",
                        cursor: "pointer",
                        overflow: "hidden",
                        zIndex: 1,
                      }}
                      title={`${r.customer_name} - ${r.party_size}p - ${r.reservation_time.slice(0, 5)}`}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: statusInfo.text,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {r.customer_name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: statusInfo.text,
                          opacity: 0.8,
                        }}
                      >
                        {r.reservation_time.slice(0, 5)} ·{" "}
                        {t("reservations.guests", {
                          count: r.party_size,
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {reservations.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "#9ca3af",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
            {t("reservations.noReservationsWeek")}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Board
// ---------------------------------------------------------------------------

export default function ReservationBoard({
  restaurantId,
}: ReservationBoardProps) {
  const { t } = useTranslation("tpv");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  /** True when gm_reservations table does not exist in Core (42P01). */
  const [tableUnavailable, setTableUnavailable] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "week">("day");

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    status: "CANCELLED" | "NO_SHOW";
    name: string;
  } | null>(null);

  // Week state
  const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate]);

  // Fetch reservations for selected date (day) or week range
  const fetchReservations = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      if (viewMode === "day") {
        const dateStr = formatDate(selectedDate);
        const { data, error } = await dockerCoreClient
          .from("gm_reservations")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .eq("reservation_date", dateStr)
          .order("reservation_time", { ascending: true });

        if (error) {
          const msg = (error.message ?? "").toLowerCase();
          const isTableMissing =
            error.code === "42P01" ||
            /relation.*does not exist|does not exist.*relation/.test(msg);
          if (isTableMissing) {
            setTableUnavailable(true);
            setReservations([]);
          } else {
            setTableUnavailable(false);
            console.error("[ReservationBoard] fetch error:", error);
          }
        } else {
          setTableUnavailable(false);
          setReservations((data as ReservationRow[]) || []);
        }
      } else {
        // Week view: fetch range
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const startStr = formatDate(weekStart);
        const endStr = formatDate(weekEnd);

        const { data, error } = await dockerCoreClient
          .from("gm_reservations")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .gte("reservation_date", startStr)
          .lte("reservation_date", endStr)
          .order("reservation_time", { ascending: true });

        if (error) {
          const msg = (error.message ?? "").toLowerCase();
          const isTableMissing =
            error.code === "42P01" ||
            /relation.*does not exist|does not exist.*relation/.test(msg);
          if (isTableMissing) {
            setTableUnavailable(true);
            setReservations([]);
          } else {
            setTableUnavailable(false);
            console.error("[ReservationBoard] fetch error:", error);
          }
        } else {
          setTableUnavailable(false);
          setReservations((data as ReservationRow[]) || []);
        }
      }
    } catch (err) {
      console.error("[ReservationBoard] fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, selectedDate, viewMode, weekStart]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Navigate days
  const goDay = (delta: number) =>
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });

  // Navigate weeks
  const goWeek = (delta: number) =>
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta * 7);
      return d;
    });

  // Create reservation
  const handleCreate = async (formData: ReservationFormData) => {
    setSaving(true);
    try {
      const payload = {
        restaurant_id: restaurantId,
        customer_name: formData.customer_name.trim(),
        customer_phone: formData.customer_phone.trim() || null,
        customer_email: formData.customer_email.trim() || null,
        party_size: formData.party_size,
        reservation_date: formData.reservation_date,
        reservation_time: formData.reservation_time,
        duration_minutes: formData.duration_minutes,
        special_requests: formData.special_requests.trim() || null,
        status: "CONFIRMED",
        confirmed_at: new Date().toISOString(),
      };

      const { error } = await dockerCoreClient
        .from("gm_reservations")
        .insert(payload);

      if (error) throw error;
      setShowForm(false);
      await fetchReservations();
    } catch (err) {
      console.error("[ReservationBoard] create error:", err);
    } finally {
      setSaving(false);
    }
  };

  // Request confirmation for destructive actions
  const requestDestructiveAction = (
    id: string,
    status: "CANCELLED" | "NO_SHOW",
    name: string,
  ) => {
    setConfirmAction({ id, status, name });
  };

  // Confirm destructive action
  const confirmDestructiveAction = async () => {
    if (!confirmAction) return;
    await handleStatusChange(confirmAction.id, confirmAction.status);
    setConfirmAction(null);
  };

  // Update status
  const handleStatusChange = async (
    id: string,
    newStatus: ReservationStatus,
  ) => {
    // Optimistic
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
    );

    try {
      const patch: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (newStatus === "CANCELLED")
        patch.cancelled_at = new Date().toISOString();
      if (newStatus === "COMPLETED")
        patch.completed_at = new Date().toISOString();

      const { error } = await dockerCoreClient
        .from("gm_reservations")
        .update(patch)
        .eq("id", id);

      if (error) throw error;
    } catch (err) {
      console.error("[ReservationBoard] status update error:", err);
      await fetchReservations();
    }
  };

  // Update (edit) reservation
  const handleUpdate = async (formData: ReservationFormData) => {
    if (!editingId) return;
    setSaving(true);
    try {
      const patch = {
        customer_name: formData.customer_name.trim(),
        customer_phone: formData.customer_phone.trim() || null,
        customer_email: formData.customer_email.trim() || null,
        party_size: formData.party_size,
        reservation_date: formData.reservation_date,
        reservation_time: formData.reservation_time,
        duration_minutes: formData.duration_minutes,
        special_requests: formData.special_requests.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await dockerCoreClient
        .from("gm_reservations")
        .update(patch)
        .eq("id", editingId);

      if (error) throw error;
      setEditingId(null);
      setShowForm(false);
      await fetchReservations();
    } catch (err) {
      console.error("[ReservationBoard] update error:", err);
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const active = reservations.filter(
      (r) => r.status === "CONFIRMED" || r.status === "SEATED",
    );
    const totalGuests = active.reduce((s, r) => s + r.party_size, 0);
    return {
      total: reservations.length,
      active: active.length,
      totalGuests,
      noShow: reservations.filter((r) => r.status === "NO_SHOW").length,
    };
  }, [reservations]);

  // Editing form data
  const editingReservation = editingId
    ? reservations.find((r) => r.id === editingId)
    : null;

  const formInitial: ReservationFormData = editingReservation
    ? {
        customer_name: editingReservation.customer_name,
        customer_phone: editingReservation.customer_phone || "",
        customer_email: editingReservation.customer_email || "",
        party_size: editingReservation.party_size,
        reservation_date: editingReservation.reservation_date,
        reservation_time: editingReservation.reservation_time,
        duration_minutes: editingReservation.duration_minutes,
        special_requests: editingReservation.special_requests || "",
      }
    : emptyForm(formatDate(selectedDate));

  // Week range label
  const weekEndDate = new Date(weekStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekRangeLabel = t("reservations.weekRange", {
    start: formatShortDate(weekStart),
    end: formatShortDate(weekEndDate),
  });

  // View mode toggle style
  const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    backgroundColor: active ? "rgba(59,130,246,0.15)" : "transparent",
    color: active ? "#60a5fa" : "#9ca3af",
    transition: "all 0.15s ease",
  });

  // Handle click on a week block -> open edit
  const handleWeekBlockClick = (r: ReservationRow) => {
    setEditingId(r.id);
    setShowForm(true);
  };

  // ── Render ──────────────────────────────────────────────

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.surface.layer1,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: spacing[4],
          borderBottom: `1px solid ${colors.border.subtle}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Navigation */}
          <button
            onClick={() => (viewMode === "day" ? goDay(-1) : goWeek(-1))}
            aria-label={
              viewMode === "week"
                ? t("reservations.previousWeek")
                : undefined
            }
            style={{
              padding: "6px 10px",
              border: `1px solid ${colors.border.subtle}`,
              borderRadius: 6,
              backgroundColor: "transparent",
              cursor: "pointer",
              fontSize: 16,
              color: colors.text.primary,
            }}
          >
            ◀
          </button>
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: colors.text.primary,
                textTransform: "capitalize",
              }}
            >
              {viewMode === "day" ? formatDateLabel(selectedDate) : weekRangeLabel}
            </div>
            <div style={{ fontSize: 12, color: colors.text.secondary }}>
              {t("reservations.statsLine", {
                active: stats.active,
                guests: stats.totalGuests,
              })}
            </div>
          </div>
          <button
            onClick={() => (viewMode === "day" ? goDay(1) : goWeek(1))}
            aria-label={
              viewMode === "week" ? t("reservations.nextWeek") : undefined
            }
            style={{
              padding: "6px 10px",
              border: `1px solid ${colors.border.subtle}`,
              borderRadius: 6,
              backgroundColor: "transparent",
              cursor: "pointer",
              fontSize: 16,
              color: colors.text.primary,
            }}
          >
            ▶
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              border: `1px solid ${colors.border.subtle}`,
              borderRadius: 6,
              backgroundColor: "transparent",
              cursor: "pointer",
              color: colors.text.secondary,
            }}
          >
            {t("reservations.today")}
          </button>

          {/* View mode toggle */}
          <div
            style={{
              display: "flex",
              backgroundColor: "rgba(255,255,255,0.04)",
              borderRadius: 8,
              padding: 2,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <button
              data-testid="view-day"
              onClick={() => setViewMode("day")}
              style={toggleBtnStyle(viewMode === "day")}
            >
              {t("reservations.viewDay")}
            </button>
            <button
              data-testid="view-week"
              onClick={() => setViewMode("week")}
              style={toggleBtnStyle(viewMode === "week")}
            >
              {t("reservations.viewWeek")}
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            if (tableUnavailable) return;
            setEditingId(null);
            setShowForm((p) => !p);
          }}
          disabled={tableUnavailable}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            borderRadius: 8,
            cursor: tableUnavailable ? "not-allowed" : "pointer",
            backgroundColor: tableUnavailable
              ? colors.border.subtle
              : colors.action.base,
            color: "#fff",
          }}
        >
          {t("reservations.newReservation")}
        </button>
      </div>

      {/* ── Create / Edit Form ── */}
      {showForm && (
        <div
          style={{
            padding: spacing[4],
            borderBottom: `1px solid ${colors.border.subtle}`,
            backgroundColor: colors.surface.layer2,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: colors.text.primary,
              marginBottom: 12,
            }}
          >
            {editingId
              ? t("reservations.editReservation")
              : t("reservations.newReservation")}
          </div>
          <ReservationForm
            initial={formInitial}
            onSave={editingId ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
            }}
            saving={saving}
          />
        </div>
      )}

      {/* ── Content ── */}
      {viewMode === "week" ? (
        loading ? (
          <div
            style={{
              flex: 1,
              textAlign: "center",
              padding: 40,
              color: colors.text.secondary,
            }}
          >
            {t("reservations.loading")}
          </div>
        ) : tableUnavailable ? (
          <div
            style={{
              flex: 1,
              textAlign: "center",
              padding: 60,
              color: colors.text.secondary,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              {t("reservations.unavailable")}
            </div>
            <div style={{ fontSize: 13 }}>
              {t("reservations.unavailableHint")}
            </div>
          </div>
        ) : (
          <WeekTimelineView
            weekStart={weekStart}
            reservations={reservations}
            onClickReservation={handleWeekBlockClick}
          />
        )
      ) : (
        /* Day view (original list) */
        <div
          data-testid="day-view"
          style={{ flex: 1, overflowY: "auto", padding: spacing[4] }}
        >
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: colors.text.secondary,
              }}
            >
              {t("reservations.loading")}
            </div>
          ) : tableUnavailable ? (
            <div
              style={{
                textAlign: "center",
                padding: 60,
                color: colors.text.secondary,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
              <div
                style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}
              >
                {t("reservations.unavailable")}
              </div>
              <div style={{ fontSize: 13 }}>
                {t("reservations.unavailableHint")}
              </div>
            </div>
          ) : reservations.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 60,
                color: colors.text.secondary,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
              <div
                style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}
              >
                {t("reservations.noReservations")}
              </div>
              <div style={{ fontSize: 13 }}>
                {t("reservations.noReservationsHint")}
              </div>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              {reservations.map((r) => {
                const statusInfo =
                  STATUS_COLORS[r.status] || STATUS_COLORS.CONFIRMED;
                const isActive =
                  r.status === "CONFIRMED" || r.status === "SEATED";

                return (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      borderRadius: 10,
                      border: `1px solid ${colors.border.subtle}`,
                      backgroundColor: isActive
                        ? colors.surface.layer1
                        : colors.surface.layer2,
                      opacity: isActive ? 1 : 0.7,
                    }}
                  >
                    {/* Time */}
                    <div
                      style={{
                        minWidth: 50,
                        fontSize: 15,
                        fontWeight: 700,
                        color: colors.text.primary,
                      }}
                    >
                      {r.reservation_time.slice(0, 5)}
                    </div>

                    {/* Customer info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: colors.text.primary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.customer_name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: colors.text.secondary,
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        <span>👤 {r.party_size}</span>
                        <span>⏱ {r.duration_minutes}min</span>
                        {r.customer_phone && (
                          <span>📱 {r.customer_phone}</span>
                        )}
                      </div>
                      {r.special_requests && (
                        <div
                          style={{
                            fontSize: 11,
                            color: colors.text.secondary,
                            fontStyle: "italic",
                            marginTop: 2,
                          }}
                        >
                          ✏️ {r.special_requests}
                        </div>
                      )}
                    </div>

                    {/* Status badge */}
                    <span
                      data-testid={`status-badge-${r.status}`}
                      style={{
                        padding: "4px 10px",
                        fontSize: 11,
                        fontWeight: 600,
                        borderRadius: 20,
                        backgroundColor: statusInfo.bg,
                        color: statusInfo.text,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t(`reservations.status.${r.status}`)}
                    </span>

                    {/* Actions */}
                    {isActive && (
                      <div style={{ display: "flex", gap: 4 }}>
                        {r.status === "CONFIRMED" && (
                          <button
                            title={t("reservations.actionSeat")}
                            onClick={() =>
                              handleStatusChange(r.id, "SEATED")
                            }
                            style={actionBtnStyle("#10b981")}
                          >
                            🪑
                          </button>
                        )}
                        {r.status === "SEATED" && (
                          <button
                            title={t("reservations.actionComplete")}
                            onClick={() =>
                              handleStatusChange(r.id, "COMPLETED")
                            }
                            style={actionBtnStyle("#6366f1")}
                          >
                            ✓
                          </button>
                        )}
                        <button
                          data-testid={`action-noshow-${r.id}`}
                          title={t("reservations.actionNoShow")}
                          onClick={() =>
                            requestDestructiveAction(
                              r.id,
                              "NO_SHOW",
                              r.customer_name,
                            )
                          }
                          style={actionBtnStyle("#f59e0b")}
                        >
                          ✗
                        </button>
                        <button
                          data-testid={`action-cancel-${r.id}`}
                          title={t("common:cancel")}
                          onClick={() =>
                            requestDestructiveAction(
                              r.id,
                              "CANCELLED",
                              r.customer_name,
                            )
                          }
                          style={actionBtnStyle("#ef4444")}
                        >
                          🗑
                        </button>
                        <button
                          title={t("reservations.actionEdit")}
                          onClick={() => {
                            setEditingId(r.id);
                            setShowForm(true);
                          }}
                          style={actionBtnStyle("#3b82f6")}
                        >
                          ✎
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Confirmation Dialog ── */}
      {confirmAction && (
        <ConfirmDialog
          title={
            confirmAction.status === "CANCELLED"
              ? t("reservations.confirmCancelTitle")
              : t("reservations.confirmNoShowTitle")
          }
          message={
            confirmAction.status === "CANCELLED"
              ? t("reservations.confirmCancelMessage", {
                  name: confirmAction.name,
                })
              : t("reservations.confirmNoShowMessage", {
                  name: confirmAction.name,
                })
          }
          confirmLabel={t("reservations.confirm")}
          cancelLabel={t("reservations.cancel")}
          onConfirm={confirmDestructiveAction}
          onCancel={() => setConfirmAction(null)}
          destructive
        />
      )}
    </div>
  );
}
