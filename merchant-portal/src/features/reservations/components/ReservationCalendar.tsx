/**
 * ReservationCalendar -- Weekly calendar view for reservations.
 *
 * Features:
 *  - 7-day grid with time slots from configurable opening to closing hours
 *  - Reservation blocks with color coding by status
 *  - Click time slot to create new reservation
 *  - Click reservation to view/edit details
 *  - Today indicator with current-time line
 *  - Week navigation (prev/next week, go to today)
 *  - Compact sidebar with upcoming reservations list
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFormatLocale } from "../../../core/i18n/regionLocaleConfig";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import { colors } from "../../../ui/design-system/tokens/colors";
import { spacing } from "../../../ui/design-system/tokens/spacing";
import type { ReservationRow } from "./reservationTypes";
import { STATUS_COLORS, formatDate, getWeekStart, getWeekDays } from "./reservationUtils";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const HOURS_START = 10;
const HOURS_END = 24;
const HOUR_HEIGHT = 60;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatWeekdayShort(d: Date): string {
  return d.toLocaleDateString(getFormatLocale(), { weekday: "short" });
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString(getFormatLocale(), {
    day: "numeric",
    month: "short",
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface ReservationCalendarProps {
  restaurantId: string;
  onCreateAtSlot?: (date: string, time: string) => void;
  onSelectReservation?: (reservation: ReservationRow) => void;
}

export function ReservationCalendar({
  restaurantId,
  onCreateAtSlot,
  onSelectReservation,
}: ReservationCalendarProps) {
  const { t } = useTranslation("reservations");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate]);
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const hours = useMemo(
    () => Array.from({ length: HOURS_END - HOURS_START }, (_, i) => HOURS_START + i),
    [],
  );

  const todayStr = formatDate(new Date());

  // Current time indicator
  const [nowMinutes, setNowMinutes] = useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const n = new Date();
      setNowMinutes(n.getHours() * 60 + n.getMinutes());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  // Fetch reservations for the week
  const fetchReservations = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
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

      if (!error && data) {
        setReservations(data as ReservationRow[]);
      }
    } catch (err) {
      console.error("[ReservationCalendar] fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, weekStart]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Group reservations by date
  const byDate = useMemo(() => {
    const map: Record<string, ReservationRow[]> = {};
    for (const r of reservations) {
      if (!map[r.reservation_date]) map[r.reservation_date] = [];
      map[r.reservation_date].push(r);
    }
    return map;
  }, [reservations]);

  // Upcoming reservations (today + future, sorted)
  const upcoming = useMemo(() => {
    return reservations
      .filter(
        (r) =>
          r.reservation_date >= todayStr &&
          r.status !== "CANCELLED" &&
          r.status !== "COMPLETED",
      )
      .sort((a, b) => {
        if (a.reservation_date !== b.reservation_date)
          return a.reservation_date.localeCompare(b.reservation_date);
        return a.reservation_time.localeCompare(b.reservation_time);
      })
      .slice(0, 10);
  }, [reservations, todayStr]);

  // Week navigation
  const goWeek = (delta: number) =>
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta * 7);
      return d;
    });

  const weekEndDate = new Date(weekStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const handleSlotClick = (day: Date, hour: number) => {
    if (onCreateAtSlot) {
      onCreateAtSlot(
        formatDate(day),
        `${String(hour).padStart(2, "0")}:00`,
      );
    }
  };

  // Stats
  const stats = useMemo(() => {
    const confirmed = reservations.filter(
      (r) => r.status === "CONFIRMED" || r.status === "SEATED",
    );
    const pending = reservations.filter((r) => r.status === "PENDING");
    const totalCovers = [...confirmed, ...pending].reduce(
      (s, r) => s + r.party_size,
      0,
    );
    return {
      total: reservations.length,
      confirmed: confirmed.length,
      pending: pending.length,
      covers: totalCovers,
    };
  }, [reservations]);

  return (
    <div style={{ display: "flex", gap: 16, height: "100%", minHeight: 500 }}>
      {/* Main calendar */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: colors.surface.layer1,
          borderRadius: 12,
          border: `1px solid ${colors.border.subtle}`,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: spacing[4],
            borderBottom: `1px solid ${colors.border.subtle}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => goWeek(-1)}
              style={navBtnStyle}
              aria-label={t("previousWeek")}
            >
              &#9664;
            </button>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: colors.text.primary,
              }}
            >
              {formatShortDate(weekStart)} - {formatShortDate(weekEndDate)}
            </div>
            <button
              onClick={() => goWeek(1)}
              style={navBtnStyle}
              aria-label={t("nextWeek")}
            >
              &#9654;
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              style={{
                ...navBtnStyle,
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {t("today")}
            </button>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: 16,
              fontSize: 12,
              color: colors.text.secondary,
            }}
          >
            <span>
              {t("statsTotal", { count: stats.total })}
            </span>
            <span style={{ color: "#4ade80" }}>
              {t("statsConfirmed", { count: stats.confirmed })}
            </span>
            {stats.pending > 0 && (
              <span style={{ color: "#fbbf24" }}>
                {t("statsPending", { count: stats.pending })}
              </span>
            )}
            <span>
              {t("statsCovers", { count: stats.covers })}
            </span>
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 48,
                color: colors.text.secondary,
              }}
            >
              {t("loading")}
            </div>
          ) : (
            <div style={{ display: "flex", minWidth: 800 }}>
              {/* Time gutter */}
              <div
                style={{
                  width: 52,
                  flexShrink: 0,
                  borderRight: `1px solid ${colors.border.subtle}`,
                }}
              >
                <div
                  style={{
                    height: 48,
                    borderBottom: `1px solid ${colors.border.subtle}`,
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
                      color: colors.text.tertiary,
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
                        borderBottom: `1px solid ${colors.border.subtle}`,
                        backgroundColor: isToday
                          ? "rgba(59,130,246,0.1)"
                          : "transparent",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: isToday ? "#60a5fa" : colors.text.tertiary,
                          textTransform: "uppercase",
                        }}
                      >
                        {formatWeekdayShort(day)}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: isToday ? 700 : 500,
                          color: isToday ? "#60a5fa" : colors.text.primary,
                        }}
                      >
                        {day.getDate()}
                      </div>
                    </div>

                    {/* Time slots */}
                    <div style={{ position: "relative" }}>
                      {hours.map((h) => (
                        <div
                          key={h}
                          onClick={() => handleSlotClick(day, h)}
                          style={{
                            height: HOUR_HEIGHT,
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                            cursor: "pointer",
                          }}
                          title={t("clickToCreate")}
                        />
                      ))}

                      {/* Current time indicator */}
                      {isToday && nowMinutes >= HOURS_START * 60 && nowMinutes < HOURS_END * 60 && (
                        <div
                          style={{
                            position: "absolute",
                            top:
                              ((nowMinutes - HOURS_START * 60) / 60) *
                              HOUR_HEIGHT,
                            left: 0,
                            right: 0,
                            height: 2,
                            backgroundColor: "#ef4444",
                            zIndex: 3,
                            pointerEvents: "none",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              left: -4,
                              top: -4,
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              backgroundColor: "#ef4444",
                            }}
                          />
                        </div>
                      )}

                      {/* Reservation blocks */}
                      {dayReservations.map((r) => {
                        const [hh, mm] = r.reservation_time
                          .split(":")
                          .map(Number);
                        const startMinutes =
                          (hh - HOURS_START) * 60 + (mm || 0);
                        const topPx = (startMinutes / 60) * HOUR_HEIGHT;
                        const duration = r.duration_minutes || 90;
                        const heightPx = (duration / 60) * HOUR_HEIGHT;

                        if (hh < HOURS_START || hh >= HOURS_END) return null;

                        const statusKey = r.status || "CONFIRMED";
                        const statusInfo =
                          STATUS_COLORS[statusKey] || STATUS_COLORS.CONFIRMED;

                        return (
                          <div
                            key={r.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectReservation?.(r);
                            }}
                            style={{
                              position: "absolute",
                              top: topPx,
                              left: 2,
                              right: 2,
                              height: Math.max(heightPx - 2, 24),
                              backgroundColor: statusInfo.bg,
                              border: `1px solid ${statusInfo.text}33`,
                              borderRadius: 6,
                              padding: "3px 6px",
                              cursor: "pointer",
                              overflow: "hidden",
                              zIndex: 2,
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
                              {r.reservation_time.slice(0, 5)} &middot;{" "}
                              {r.party_size}p
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - upcoming */}
      <div
        style={{
          width: 240,
          flexShrink: 0,
          backgroundColor: colors.surface.layer1,
          borderRadius: 12,
          border: `1px solid ${colors.border.subtle}`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            fontSize: 13,
            fontWeight: 700,
            color: colors.text.primary,
            borderBottom: `1px solid ${colors.border.subtle}`,
          }}
        >
          {t("upcoming")}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
          {upcoming.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                fontSize: 13,
                color: colors.text.tertiary,
              }}
            >
              {t("noUpcoming")}
            </div>
          ) : (
            upcoming.map((r) => {
              const statusInfo =
                STATUS_COLORS[r.status] || STATUS_COLORS.CONFIRMED;
              return (
                <div
                  key={r.id}
                  onClick={() => onSelectReservation?.(r)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    marginBottom: 4,
                    backgroundColor: "rgba(255,255,255,0.02)",
                    borderLeft: `3px solid ${statusInfo.text}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: colors.text.primary,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.customer_name}
                  </div>
                  <div style={{ fontSize: 11, color: colors.text.tertiary }}>
                    {r.reservation_date === todayStr
                      ? t("today")
                      : r.reservation_date}{" "}
                    &middot; {r.reservation_time.slice(0, 5)} &middot;{" "}
                    {r.party_size}p
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  padding: "6px 10px",
  border: `1px solid rgba(255,255,255,0.12)`,
  borderRadius: 6,
  backgroundColor: "transparent",
  cursor: "pointer",
  fontSize: 14,
  color: "#e5e5e5",
};
