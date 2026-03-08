/**
 * ReservationBoard — Gap #9 (Competitive)
 *
 * Full CRUD reservation board for the TPV context tab.
 * - Day view with time slots
 * - Create / edit / cancel reservations
 * - Status badges (CONFIRMED, SEATED, COMPLETED, NO_SHOW, CANCELLED)
 * - Party size + customer info + special requests
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

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  CONFIRMED: { bg: "#dbeafe", text: "#1d4ed8", label: "Confirmada" },
  SEATED: { bg: "#dcfce7", text: "#15803d", label: "Sentado" },
  COMPLETED: { bg: "#f3f4f6", text: "#6b7280", label: "Concluída" },
  NO_SHOW: { bg: "#fef3c7", text: "#b45309", label: "Não compareceu" },
  CANCELLED: { bg: "#fee2e2", text: "#dc2626", label: "Cancelada" },
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
  const { t } = useTranslation();
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
          <label style={labelStyle}>Nome do cliente *</label>
          <input
            style={inputStyle}
            placeholder="Nome"
            value={form.customer_name}
            onChange={(e) => set("customer_name", e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Telefone</label>
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
        <label style={labelStyle}>Email</label>
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
          <label style={labelStyle}>Data *</label>
          <input
            style={inputStyle}
            type="date"
            value={form.reservation_date}
            onChange={(e) => set("reservation_date", e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Hora *</label>
          <input
            style={inputStyle}
            type="time"
            value={form.reservation_time}
            onChange={(e) => set("reservation_time", e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Pessoas *</label>
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
        <label style={labelStyle}>Duração (min)</label>
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
        <label style={labelStyle}>Pedidos especiais</label>
        <textarea
          style={{
            ...inputStyle,
            minHeight: 48,
            resize: "vertical",
          }}
          placeholder="Alergias, preferências..."
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
          Cancelar
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
// Main Board
// ---------------------------------------------------------------------------

export default function ReservationBoard({
  restaurantId,
}: ReservationBoardProps) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  /** True when gm_reservations table does not exist in Core (42P01). */
  const [tableUnavailable, setTableUnavailable] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch reservations for selected date
  const fetchReservations = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
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
    } catch (err) {
      console.error("[ReservationBoard] fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, selectedDate]);

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
          <button
            onClick={() => goDay(-1)}
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
              {formatDateLabel(selectedDate)}
            </div>
            <div style={{ fontSize: 12, color: colors.text.secondary }}>
              {stats.active} reservas · {stats.totalGuests} pessoas
            </div>
          </div>
          <button
            onClick={() => goDay(1)}
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
            Hoje
          </button>
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
          + Nova Reserva
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
            {editingId ? "Editar Reserva" : "Nova Reserva"}
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

      {/* ── List ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: spacing[4] }}>
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: colors.text.secondary,
            }}
          >
            Carregando reservas...
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
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              Reservas indisponíveis
            </div>
            <div style={{ fontSize: 13 }}>
              A tabela <code>gm_reservations</code> não existe no Core. Aplicar
              migrations em <code>docker-core/schema/migrations</code> (ex.{" "}
              <code>20260209_reservations_tables.sql</code>).
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
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              Sem reservas para este dia
            </div>
            <div style={{ fontSize: 13 }}>
              Clique em &quot;+ Nova Reserva&quot; para adicionar.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                      {r.customer_phone && <span>📱 {r.customer_phone}</span>}
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
                    {statusInfo.label}
                  </span>

                  {/* Actions */}
                  {isActive && (
                    <div style={{ display: "flex", gap: 4 }}>
                      {r.status === "CONFIRMED" && (
                        <button
                          title="Marcar como sentado"
                          onClick={() => handleStatusChange(r.id, "SEATED")}
                          style={actionBtnStyle("#10b981")}
                        >
                          🪑
                        </button>
                      )}
                      {r.status === "SEATED" && (
                        <button
                          title="Concluir"
                          onClick={() => handleStatusChange(r.id, "COMPLETED")}
                          style={actionBtnStyle("#6366f1")}
                        >
                          ✓
                        </button>
                      )}
                      <button
                        title="Não compareceu"
                        onClick={() => handleStatusChange(r.id, "NO_SHOW")}
                        style={actionBtnStyle("#f59e0b")}
                      >
                        ✗
                      </button>
                      <button
                        title={t("common:cancel")}
                        onClick={() => handleStatusChange(r.id, "CANCELLED")}
                        style={actionBtnStyle("#ef4444")}
                      >
                        🗑
                      </button>
                      <button
                        title="Editar"
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
    </div>
  );
}
