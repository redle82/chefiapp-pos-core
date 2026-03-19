/**
 * ReservationsPage -- Enhanced reservation management with tabs.
 *
 * Tabs: Calendar | List | Waitlist
 * Stats bar: today's reservations, confirmed, pending, total covers
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { dockerCoreClient } from "../../infra/docker-core/connection";
import { AdminPageHeader } from "../../features/admin/dashboard/components/AdminPageHeader";
import { colors } from "../../ui/design-system/tokens/colors";
import { ReservationCalendar } from "./components/ReservationCalendar";
import { ReservationForm } from "./components/ReservationForm";
import { ReservationListView } from "./components/ReservationListView";
import { WaitlistManager } from "./components/WaitlistManager";
import type { ReservationFormData, ReservationRow } from "./components/reservationTypes";
import { formatDate, estimateDuration } from "./components/reservationUtils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TabId = "calendar" | "list" | "waitlist";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ReservationsPage() {
  const { t } = useTranslation("reservations");
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime.restaurant_id ?? "";

  const [activeTab, setActiveTab] = useState<TabId>("calendar");
  const [showForm, setShowForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [prefillDate, setPrefillDate] = useState<string | undefined>();
  const [prefillTime, setPrefillTime] = useState<string | undefined>();

  // Today stats
  const [todayStats, setTodayStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    covers: 0,
  });

  const fetchTodayStats = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const todayStr = formatDate(new Date());
      const { data } = await dockerCoreClient
        .from("gm_reservations")
        .select("status,party_size")
        .eq("restaurant_id", restaurantId)
        .eq("reservation_date", todayStr);

      if (data) {
        const confirmed = data.filter(
          (r: { status: string }) =>
            r.status === "CONFIRMED" || r.status === "SEATED",
        );
        const pending = data.filter(
          (r: { status: string }) => r.status === "PENDING",
        );
        const allActive = [...confirmed, ...pending];
        setTodayStats({
          total: data.length,
          confirmed: confirmed.length,
          pending: pending.length,
          covers: allActive.reduce(
            (sum: number, r: { party_size: number }) => sum + r.party_size,
            0,
          ),
        });
      }
    } catch {
      // Silent
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchTodayStats();
  }, [fetchTodayStats]);

  // Handlers
  const handleCreateAtSlot = (date: string, time: string) => {
    setPrefillDate(date);
    setPrefillTime(time);
    setEditingReservation(null);
    setShowForm(true);
  };

  const handleSelectReservation = (reservation: ReservationRow) => {
    setEditingReservation(reservation);
    setPrefillDate(undefined);
    setPrefillTime(undefined);
    setShowForm(true);
  };

  const handleSave = async (
    data: ReservationFormData,
    repeat?: "none" | "weekly" | "monthly",
  ) => {
    setSaving(true);
    try {
      const basePayload = {
        restaurant_id: restaurantId,
        customer_name: data.customer_name.trim(),
        customer_phone: data.customer_phone.trim() || null,
        customer_email: data.customer_email.trim() || null,
        party_size: data.party_size,
        reservation_date: data.reservation_date,
        reservation_time: data.reservation_time,
        duration_minutes: data.duration_minutes,
        special_requests: data.special_requests.trim() || null,
        table_id: data.table_preference.trim() || null,
      };

      if (editingReservation) {
        // Update
        await dockerCoreClient
          .from("gm_reservations")
          .update({
            ...basePayload,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingReservation.id);
      } else {
        // Create
        const createPayload = {
          ...basePayload,
          status: "CONFIRMED",
          source: "internal",
          confirmed_at: new Date().toISOString(),
        };

        await dockerCoreClient
          .from("gm_reservations")
          .insert(createPayload);

        // Handle repeat reservations
        if (repeat && repeat !== "none") {
          const repeatCount = repeat === "weekly" ? 4 : 3;
          const intervalDays = repeat === "weekly" ? 7 : 30;

          for (let i = 1; i <= repeatCount; i++) {
            const nextDate = new Date(data.reservation_date);
            nextDate.setDate(nextDate.getDate() + intervalDays * i);
            await dockerCoreClient
              .from("gm_reservations")
              .insert({
                ...createPayload,
                reservation_date: formatDate(nextDate),
              });
          }
        }
      }

      setShowForm(false);
      setEditingReservation(null);
      await fetchTodayStats();
    } catch (err) {
      console.error("[ReservationsPage] save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingReservation(null);
    setPrefillDate(undefined);
    setPrefillTime(undefined);
  };

  if (!restaurantId) {
    return (
      <section style={{ padding: 24 }}>
        <AdminPageHeader
          title={t("pageTitle")}
          subtitle={t("pageSubtitle")}
        />
        <div
          style={{
            padding: 32,
            textAlign: "center",
            backgroundColor: colors.surface.layer1,
            borderRadius: 12,
            border: `1px solid ${colors.border.subtle}`,
            color: colors.text.secondary,
          }}
        >
          {t("selectRestaurant")}
        </div>
      </section>
    );
  }

  const tabs: { id: TabId; labelKey: string }[] = [
    { id: "calendar", labelKey: "tabCalendar" },
    { id: "list", labelKey: "tabList" },
    { id: "waitlist", labelKey: "tabWaitlist" },
  ];

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: 400,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <AdminPageHeader
          title={t("pageTitle")}
          subtitle={t("pageSubtitle")}
        />
        <button
          onClick={() => {
            setEditingReservation(null);
            setPrefillDate(undefined);
            setPrefillTime(undefined);
            setShowForm(true);
          }}
          style={{
            padding: "8px 18px",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            backgroundColor: colors.action.base,
            color: "#fff",
            marginTop: 8,
          }}
        >
          {t("newReservation")}
        </button>
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {[
          {
            label: t("statsTodayReservations"),
            value: todayStats.total,
            color: colors.text.primary,
          },
          {
            label: t("statsConfirmedLabel"),
            value: todayStats.confirmed,
            color: "#4ade80",
          },
          {
            label: t("statsPendingLabel"),
            value: todayStats.pending,
            color: "#fbbf24",
          },
          {
            label: t("statsCoversLabel"),
            value: todayStats.covers,
            color: "#60a5fa",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: colors.surface.layer1,
              border: `1px solid ${colors.border.subtle}`,
              borderRadius: 10,
              padding: "10px 20px",
              minWidth: 120,
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: stat.color,
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: colors.text.secondary }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          backgroundColor: "rgba(255,255,255,0.04)",
          borderRadius: 8,
          padding: 4,
          width: "fit-content",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "7px 18px",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              backgroundColor:
                activeTab === tab.id
                  ? "rgba(59,130,246,0.15)"
                  : "transparent",
              color:
                activeTab === tab.id ? "#60a5fa" : colors.text.secondary,
              transition: "all 0.15s ease",
            }}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1 }}>
        {activeTab === "calendar" && (
          <ReservationCalendar
            restaurantId={restaurantId}
            onCreateAtSlot={handleCreateAtSlot}
            onSelectReservation={handleSelectReservation}
          />
        )}
        {activeTab === "list" && (
          <ReservationListView
            restaurantId={restaurantId}
            onSelectReservation={handleSelectReservation}
          />
        )}
        {activeTab === "waitlist" && (
          <WaitlistManager restaurantId={restaurantId} />
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <ReservationForm
          editing={editingReservation}
          prefillDate={prefillDate}
          prefillTime={prefillTime}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      )}
    </section>
  );
}
