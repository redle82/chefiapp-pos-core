/**
 * ReservationsDashboardPage - Dashboard de Reservas
 *
 * Mostra reservas do dia, no-shows e configurações
 */

import { useEffect, useState } from "react";
import { NoShowStatsCard } from "../../components/Reservations/NoShowStatsCard";
import { ReservationsList } from "../../components/Reservations/ReservationsList";
import { useRestaurantId } from "../../core/hooks/useRestaurantId";
import {
  reservationEngine,
  type NoShowStats,
  type Reservation,
} from "../../core/reservations/ReservationEngine";
import { GlobalLoadingView } from "../../ui/design-system/components";

export function ReservationsDashboardPage() {
  const { restaurantId, loading: loadingRestaurantId } = useRestaurantId();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [noShowStats, setNoShowStats] = useState<NoShowStats | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!restaurantId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [reservationsData, statsData] = await Promise.all([
          reservationEngine.listForDate(restaurantId, selectedDate),
          reservationEngine.calculateNoShowStats(restaurantId),
        ]);

        setReservations(reservationsData);
        setNoShowStats(statsData);
      } catch (error) {
        console.error("Error loading reservations data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [restaurantId, selectedDate]);

  if (loading || loadingRestaurantId || !restaurantId) {
    return (
      <GlobalLoadingView
        message="Carregando reservas..."
        layout="portal"
        variant="fullscreen"
      />
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 600 }}>Reservas</h1>
        <input
          type="date"
          value={selectedDate.toISOString().split("T")[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          style={{
            padding: "8px",
            border: "1px solid #e0e0e0",
            borderRadius: "4px",
          }}
        />
      </div>

      {/* Estatísticas de No-Show */}
      {noShowStats && <NoShowStatsCard stats={noShowStats} />}

      {/* Lista de Reservas */}
      <div style={{ marginTop: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
          Reservas para {selectedDate.toLocaleDateString()}
        </h2>
        <ReservationsList reservations={reservations} />
      </div>
    </div>
  );
}
