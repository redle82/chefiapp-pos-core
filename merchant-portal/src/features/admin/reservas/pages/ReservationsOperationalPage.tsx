/**
 * Página operacional de reservas — /admin/reservations
 *
 * Área de execução: lista do dia, status, check-in, cancelamento, criação manual.
 * Não confundir com /admin/config/reservas (configuração: disponibilidade, turnos, política).
 *
 * Contrato: Gestor de reservas no menu principal → esta página (runtime).
 * Configuração de reservas → Configuración > Reservas (setup).
 */

import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import ReservationBoard from "../../../../pages/TPV/reservations/ReservationBoard";

export function ReservationsOperationalPage() {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime.restaurant_id ?? "";

  if (!restaurantId) {
    return (
      <section style={{ padding: 24 }}>
        <header style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px 0", color: "#111827" }}>
            Gestor de reservas
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
            Lista do dia, status, check-in e cancelamento.
          </p>
        </header>
        <div
          style={{
            padding: 32,
            textAlign: "center",
            backgroundColor: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            color: "#6b7280",
          }}
        >
          Seleccione un restaurante para ver y gestionar las reservas.
        </div>
      </section>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", minHeight: 400 }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px 0", color: "#111827" }}>
          Gestor de reservas
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
          Lista del día, estado, check-in, cancelación y creación manual.
        </p>
      </header>
      <ReservationBoard restaurantId={restaurantId} />
    </section>
  );
}
