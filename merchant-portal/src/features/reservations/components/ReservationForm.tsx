/**
 * ReservationForm -- Modal/drawer for creating and editing reservations.
 *
 * Features:
 *  - Customer name, phone, email, date, time, party size, special requests
 *  - Table preference field
 *  - Duration auto-estimate based on party size
 *  - Repeat reservation option (weekly, monthly)
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { colors } from "../../../ui/design-system/tokens/colors";
import type { ReservationFormData, ReservationRow } from "./reservationTypes";
import { estimateDuration } from "./reservationUtils";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface ReservationFormProps {
  /** Null for create, ReservationRow for edit. */
  editing: ReservationRow | null;
  /** Pre-fill date/time (for slot-click creation). */
  prefillDate?: string;
  prefillTime?: string;
  onSave: (data: ReservationFormData, repeat?: "none" | "weekly" | "monthly") => void;
  onCancel: () => void;
  saving: boolean;
}

/* ------------------------------------------------------------------ */
/*  Default form                                                       */
/* ------------------------------------------------------------------ */

function defaultForm(date?: string, time?: string): ReservationFormData {
  const today = new Date().toISOString().slice(0, 10);
  return {
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    party_size: 2,
    reservation_date: date || today,
    reservation_time: time || "19:00",
    duration_minutes: 90,
    special_requests: "",
    table_preference: "",
  };
}

function fromRow(row: ReservationRow): ReservationFormData {
  return {
    customer_name: row.customer_name,
    customer_phone: row.customer_phone || "",
    customer_email: row.customer_email || "",
    party_size: row.party_size,
    reservation_date: row.reservation_date,
    reservation_time: row.reservation_time,
    duration_minutes: row.duration_minutes || 90,
    special_requests: row.special_requests || "",
    table_preference: row.table_id || "",
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ReservationForm({
  editing,
  prefillDate,
  prefillTime,
  onSave,
  onCancel,
  saving,
}: ReservationFormProps) {
  const { t } = useTranslation("reservations");
  const [form, setForm] = useState<ReservationFormData>(() =>
    editing ? fromRow(editing) : defaultForm(prefillDate, prefillTime),
  );
  const [repeat, setRepeat] = useState<"none" | "weekly" | "monthly">("none");

  // Auto-adjust duration when party size changes (only for new reservations)
  useEffect(() => {
    if (!editing) {
      setForm((prev) => ({
        ...prev,
        duration_minutes: estimateDuration(prev.party_size),
      }));
    }
  }, [form.party_size, editing]);

  const set = <K extends keyof ReservationFormData>(
    key: K,
    value: ReservationFormData[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const canSave = form.customer_name.trim().length > 0 && !saving;

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
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
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
          backgroundColor: colors.surface.layer1,
          borderRadius: 12,
          padding: 24,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          border: `1px solid ${colors.border.subtle}`,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: colors.text.primary,
            marginBottom: 16,
          }}
        >
          {editing ? t("editReservation") : t("newReservation")}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Name + Phone */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>{t("customerName")} *</label>
              <input
                style={inputStyle}
                placeholder={t("namePlaceholder")}
                value={form.customer_name}
                onChange={(e) => set("customer_name", e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t("phone")}</label>
              <input
                style={inputStyle}
                placeholder="+351 9..."
                value={form.customer_phone}
                onChange={(e) => set("customer_phone", e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>{t("email")}</label>
            <input
              style={inputStyle}
              placeholder="email@example.com"
              type="email"
              value={form.customer_email}
              onChange={(e) => set("customer_email", e.target.value)}
            />
          </div>

          {/* Date + Time + Party Size */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t("date")} *</label>
              <input
                style={inputStyle}
                type="date"
                value={form.reservation_date}
                onChange={(e) => set("reservation_date", e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t("time")} *</label>
              <input
                style={inputStyle}
                type="time"
                value={form.reservation_time}
                onChange={(e) => set("reservation_time", e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t("partySize")} *</label>
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

          {/* Duration + Table preference */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t("duration")}</label>
              <select
                style={inputStyle}
                value={form.duration_minutes}
                onChange={(e) =>
                  set("duration_minutes", Number(e.target.value))
                }
              >
                {[60, 90, 120, 150, 180].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t("tablePreference")}</label>
              <input
                style={inputStyle}
                placeholder={t("tablePreferencePlaceholder")}
                value={form.table_preference}
                onChange={(e) => set("table_preference", e.target.value)}
              />
            </div>
          </div>

          {/* Special requests */}
          <div>
            <label style={labelStyle}>{t("specialRequests")}</label>
            <textarea
              style={{
                ...inputStyle,
                minHeight: 56,
                resize: "vertical",
              }}
              placeholder={t("specialRequestsPlaceholder")}
              value={form.special_requests}
              onChange={(e) => set("special_requests", e.target.value)}
            />
          </div>

          {/* Repeat (only for creation) */}
          {!editing && (
            <div>
              <label style={labelStyle}>{t("repeat")}</label>
              <select
                style={inputStyle}
                value={repeat}
                onChange={(e) =>
                  setRepeat(e.target.value as "none" | "weekly" | "monthly")
                }
              >
                <option value="none">{t("repeatNone")}</option>
                <option value="weekly">{t("repeatWeekly")}</option>
                <option value="monthly">{t("repeatMonthly")}</option>
              </select>
            </div>
          )}

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              marginTop: 8,
            }}
          >
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
              {t("cancel")}
            </button>
            <button
              onClick={() => onSave(form, repeat)}
              disabled={!canSave}
              style={{
                padding: "8px 20px",
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                borderRadius: 8,
                cursor: canSave ? "pointer" : "not-allowed",
                backgroundColor: canSave ? colors.action.base : "#4b5563",
                color: "#fff",
                opacity: canSave ? 1 : 0.5,
              }}
            >
              {saving ? t("saving") : editing ? t("save") : t("create")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
