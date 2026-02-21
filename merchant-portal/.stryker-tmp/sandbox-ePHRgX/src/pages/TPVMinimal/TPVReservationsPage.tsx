/**
 * TPVReservationsPage — Painel de reservas embebido no TPV HUB.
 *
 * Reutiliza ReservationBoard (816 linhas) do full TPV — CRUD completo de reservas
 * com slots de hora, badges de status, formulário de criação/edição.
 *
 * Integrado com Docker Core (PostgREST) via gm_reservations.
 */
// @ts-nocheck


import ReservationBoard from "../TPV/reservations/ReservationBoard";
import { useTPVRestaurantId } from "./hooks/useTPVRestaurantId";

export function TPVReservationsPage() {
  const restaurantId = useTPVRestaurantId();

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        padding: 16,
      }}
    >
      <ReservationBoard restaurantId={restaurantId} />
    </div>
  );
}
