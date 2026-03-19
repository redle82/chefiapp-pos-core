/**
 * Pagina operacional de reservas -- /admin/reservations
 *
 * Delegates to the feature-level ReservationsPage which includes:
 * Calendar, List, and Waitlist tabs.
 */

import { ReservationsPage } from "../../../reservations/ReservationsPage";

export function ReservationsOperationalPage() {
  return <ReservationsPage />;
}
