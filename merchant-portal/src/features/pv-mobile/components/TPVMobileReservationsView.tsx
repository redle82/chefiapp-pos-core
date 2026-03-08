/**
 * TPVMobileReservationsView — Reservations management for mobile
 *
 * Only visible to owner/manager roles.
 * Shows upcoming reservations with:
 * - Guest name
 * - Date/time
 * - Party size
 * - Status (pending, confirmed, cancelled, seated)
 * - Table assignment
 */

import { useEffect, useState } from "react";
import { useFormatLocale } from "../../../core/i18n/useFormatLocale";
import { dockerCoreClient } from "../../../infra/docker-core/connection";

interface Reservation {
  id: string;
  guest_name: string;
  guest_phone?: string;
  party_size: number;
  reservation_time: string;
  status: "pending" | "confirmed" | "cancelled" | "seated" | "no_show";
  table_number?: number;
  notes?: string;
}

interface TPVMobileReservationsViewProps {
  restaurantId: string;
  onSelectReservation?: (reservationId: string) => void;
}

export function TPVMobileReservationsView({
  restaurantId,
  onSelectReservation,
}: TPVMobileReservationsViewProps) {
  const locale = useFormatLocale();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState<"today" | "tomorrow" | "week">(
    "today",
  );

  useEffect(() => {
    if (!restaurantId) return;

    const fetchReservations = async () => {
      setLoading(true);

      // Calculate date range based on filter
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      let startDate: Date;
      let endDate: Date;

      if (dayFilter === "today") {
        startDate = startOfToday;
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      } else if (dayFilter === "tomorrow") {
        startDate = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      } else {
        // week
        startDate = startOfToday;
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      // Note: Filter by startDate only since lte not available in FilterBuilder.
      // Post-filter by endDate in JavaScript.
      const { data } = await dockerCoreClient
        .from("gm_reservations")
        .select(
          "id, guest_name, guest_phone, party_size, reservation_time, status, table_number, notes",
        )
        .eq("restaurant_id", restaurantId)
        .gte("reservation_time", startDate.toISOString())
        .not("status", "eq", "cancelled")
        .order("reservation_time", { ascending: true });

      if (data && Array.isArray(data)) {
        // Post-filter by endDate
        const filteredData = data.filter((r: Record<string, unknown>) => {
          const resTime = new Date(r.reservation_time as string);
          return resTime <= endDate;
        });
        setReservations(
          filteredData.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            guest_name: (r.guest_name as string) ?? "Sem nome",
            guest_phone: (r.guest_phone as string) ?? undefined,
            party_size: (r.party_size as number) ?? 2,
            reservation_time: r.reservation_time as string,
            status: ((r.status as string) ??
              "pending") as Reservation["status"],
            table_number: (r.table_number as number) ?? undefined,
            notes: (r.notes as string) ?? undefined,
          })),
        );
      }

      setLoading(false);
    };

    fetchReservations();
    const interval = setInterval(fetchReservations, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [restaurantId, dayFilter]);

  const statusLabel = (status: Reservation["status"]) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "confirmed":
        return "Confirmado";
      case "seated":
        return "Sentado";
      case "no_show":
        return "Não Compareceu";
      default:
        return status;
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    if (d.toDateString() === today.toDateString()) return "Hoje";
    if (d.toDateString() === tomorrow.toDateString()) return "Amanhã";
    return d.toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const handleConfirm = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await dockerCoreClient
      .from("gm_reservations")
      .update({ status: "confirmed" })
      .eq("id", id);
    setReservations((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "confirmed" as const } : r,
      ),
    );
  };

  const handleSeat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await dockerCoreClient
      .from("gm_reservations")
      .update({ status: "seated" })
      .eq("id", id);
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "seated" as const } : r)),
    );
  };

  return (
    <div className="tpvm-reservations-view">
      {/* Day filter tabs */}
      <div className="tpvm-reservations-filter">
        {(["today", "tomorrow", "week"] as const).map((f) => (
          <button
            key={f}
            className={`tpvm-reservations-filter__btn ${
              dayFilter === f ? "tpvm-reservations-filter__btn--active" : ""
            }`}
            onClick={() => setDayFilter(f)}
          >
            {f === "today" && "Hoje"}
            {f === "tomorrow" && "Amanhã"}
            {f === "week" && "Semana"}
          </button>
        ))}
      </div>

      {/* Reservations list */}
      {loading ? (
        <div className="tpvm-reservations-loading">A carregar reservas...</div>
      ) : reservations.length === 0 ? (
        <div className="tpvm-reservations-empty">
          <span className="tpvm-reservations-empty__icon">📅</span>
          <span>Nenhuma reserva</span>
        </div>
      ) : (
        <div className="tpvm-reservations-list">
          {reservations.map((res) => (
            <div
              key={res.id}
              className="tpvm-reservation-card"
              onClick={() => onSelectReservation?.(res.id)}
            >
              <div className="tpvm-reservation-card__header">
                <span className="tpvm-reservation-card__time">
                  {formatDate(res.reservation_time)} •{" "}
                  {formatTime(res.reservation_time)}
                </span>
                <span
                  className={`tpvm-reservation-card__status tpvm-reservation-card__status--${res.status}`}
                >
                  {statusLabel(res.status)}
                </span>
              </div>
              <div className="tpvm-reservation-card__body">
                <span className="tpvm-reservation-card__name">
                  {res.guest_name}
                </span>
                <span className="tpvm-reservation-card__party">
                  👥 {res.party_size}{" "}
                  {res.party_size === 1 ? "pessoa" : "pessoas"}
                </span>
              </div>
              {res.table_number && (
                <div className="tpvm-reservation-card__table">
                  Mesa {res.table_number}
                </div>
              )}
              {res.notes && (
                <div className="tpvm-reservation-card__notes">
                  📝 {res.notes}
                </div>
              )}
              <div className="tpvm-reservation-card__actions">
                {res.status === "pending" && (
                  <button
                    className="tpvm-reservation-card__action tpvm-reservation-card__action--confirm"
                    onClick={(e) => handleConfirm(res.id, e)}
                  >
                    ✓ Confirmar
                  </button>
                )}
                {res.status === "confirmed" && (
                  <button
                    className="tpvm-reservation-card__action tpvm-reservation-card__action--seat"
                    onClick={(e) => handleSeat(res.id, e)}
                  >
                    🪑 Sentar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
