/**
 * WaitlistManager -- Walk-in waitlist management.
 *
 * Features:
 *  - Add walk-in customer (name, party size, phone)
 *  - Estimated wait time
 *  - Seat button to assign table and remove from waitlist
 *  - Queue position display
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import { colors } from "../../../ui/design-system/tokens/colors";
import type { WaitlistEntry } from "./reservationTypes";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface WaitlistManagerProps {
  restaurantId: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const AVG_TURNOVER_MINUTES = 45;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function WaitlistManager({ restaurantId }: WaitlistManagerProps) {
  const { t } = useTranslation("reservations");
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPartySize, setNewPartySize] = useState(2);
  const [saving, setSaving] = useState(false);

  // Fetch waitlist
  const fetchWaitlist = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const { data, error } = await dockerCoreClient
        .from("gm_waitlist")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("status", "waiting")
        .gte("added_at", `${todayStr}T00:00:00`)
        .order("position", { ascending: true });

      if (!error && data) {
        setEntries(data as WaitlistEntry[]);
      } else {
        // Table might not exist yet; use empty state
        setEntries([]);
      }
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchWaitlist();
  }, [fetchWaitlist]);

  // Estimated wait time for next person in line
  const estimateWait = useMemo(() => {
    return (position: number) => position * AVG_TURNOVER_MINUTES;
  }, []);

  // Add to waitlist
  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const nextPosition = entries.length + 1;
      const payload = {
        restaurant_id: restaurantId,
        customer_name: newName.trim(),
        customer_phone: newPhone.trim() || null,
        party_size: newPartySize,
        estimated_wait_minutes: estimateWait(nextPosition),
        position: nextPosition,
        status: "waiting",
        added_at: new Date().toISOString(),
      };

      const { error } = await dockerCoreClient
        .from("gm_waitlist")
        .insert(payload);

      if (error) {
        // Fallback: add locally
        const localEntry: WaitlistEntry = {
          id: `wl_${Date.now()}`,
          ...payload,
          customer_phone: payload.customer_phone || "",
        };
        setEntries((prev) => [...prev, localEntry]);
      } else {
        await fetchWaitlist();
      }

      setNewName("");
      setNewPhone("");
      setNewPartySize(2);
      setShowAddForm(false);
    } catch {
      // Silently handle
    } finally {
      setSaving(false);
    }
  };

  // Seat customer (remove from waitlist)
  const handleSeat = async (entry: WaitlistEntry) => {
    // Optimistic update
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));

    try {
      await dockerCoreClient
        .from("gm_waitlist")
        .update({
          status: "seated",
          seated_at: new Date().toISOString(),
        })
        .eq("id", entry.id);
    } catch {
      // Revert
      await fetchWaitlist();
    }
  };

  // Remove from waitlist
  const handleRemove = async (entry: WaitlistEntry) => {
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    try {
      await dockerCoreClient
        .from("gm_waitlist")
        .update({ status: "left" })
        .eq("id", entry.id);
    } catch {
      await fetchWaitlist();
    }
  };

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
        backgroundColor: colors.surface.layer1,
        borderRadius: 12,
        border: `1px solid ${colors.border.subtle}`,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${colors.border.subtle}`,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.text.primary }}>
            {t("waitlist")}
          </div>
          <div style={{ fontSize: 12, color: colors.text.secondary }}>
            {t("waitlistCount", { count: entries.length })}
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: "6px 14px",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            backgroundColor: colors.action.base,
            color: "#fff",
          }}
        >
          {t("addToWaitlist")}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div
          style={{
            padding: 16,
            borderBottom: `1px solid ${colors.border.subtle}`,
            backgroundColor: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>{t("customerName")} *</label>
              <input
                style={inputStyle}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("namePlaceholder")}
                autoFocus
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t("partySize")}</label>
              <input
                style={inputStyle}
                type="number"
                min={1}
                max={20}
                value={newPartySize}
                onChange={(e) => setNewPartySize(Number(e.target.value))}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>{t("phone")}</label>
            <input
              style={inputStyle}
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+351 9..."
            />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                padding: "6px 14px",
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
              onClick={handleAdd}
              disabled={!newName.trim() || saving}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                borderRadius: 8,
                cursor: newName.trim() && !saving ? "pointer" : "not-allowed",
                backgroundColor: colors.action.base,
                color: "#fff",
                opacity: newName.trim() ? 1 : 0.5,
              }}
            >
              {saving ? t("saving") : t("add")}
            </button>
          </div>
        </div>
      )}

      {/* Waitlist entries */}
      <div style={{ padding: 8 }}>
        {loading ? (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              color: colors.text.secondary,
            }}
          >
            {t("loading")}
          </div>
        ) : entries.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: colors.text.tertiary,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>&#128101;</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              {t("waitlistEmpty")}
            </div>
            <div style={{ fontSize: 12 }}>{t("waitlistEmptyHint")}</div>
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div
              key={entry.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 8,
                backgroundColor:
                  idx === 0
                    ? "rgba(34,197,94,0.08)"
                    : "rgba(255,255,255,0.02)",
                marginBottom: 4,
              }}
            >
              {/* Position badge */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor:
                    idx === 0
                      ? "rgba(34,197,94,0.2)"
                      : "rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: idx === 0 ? "#4ade80" : colors.text.secondary,
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: colors.text.primary,
                  }}
                >
                  {entry.customer_name}
                </div>
                <div style={{ fontSize: 12, color: colors.text.tertiary }}>
                  {entry.party_size}p &middot; ~{estimateWait(idx + 1)} min
                  {entry.customer_phone
                    ? ` \u00B7 ${entry.customer_phone}`
                    : ""}
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={() => handleSeat(entry)}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  backgroundColor: "rgba(34,197,94,0.15)",
                  color: "#4ade80",
                }}
              >
                {t("seat")}
              </button>
              <button
                onClick={() => handleRemove(entry)}
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  backgroundColor: "rgba(239,68,68,0.1)",
                  color: "#f87171",
                }}
              >
                &#10005;
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
