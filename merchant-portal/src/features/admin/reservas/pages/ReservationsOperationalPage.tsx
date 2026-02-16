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
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";

export function ReservationsOperationalPage() {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime.restaurant_id ?? "";

  if (!restaurantId) {
    return (
      <section style={{ padding: 24 }}>
        <AdminPageHeader
          title="Gestor de reservas"
          subtitle="Lista do dia, status, check-in e cancelamento."
        />
        <div
          style={{
            padding: 32,
            textAlign: "center",
            backgroundColor: "var(--card-bg-on-dark, var(--surface-elevated))",
            borderRadius: 12,
            border: "1px solid var(--surface-border)",
            color: "var(--text-secondary)",
          }}
        >
          Seleccione un restaurante para ver y gestionar las reservas.
        </div>
      </section>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", minHeight: 400 }}>
      <AdminPageHeader
        title="Gestor de reservas"
        subtitle="Lista del día, estado, check-in, cancelación y creación manual."
      />
      <ReservationBoard restaurantId={restaurantId} />
    </section>
  );
}
