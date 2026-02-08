/**
 * RESTAURANT PEOPLE READER
 *
 * Lê pessoas operacionais do restaurante (gm_restaurant_people).
 * FASE 3 Passo 1: nome, função (staff/gerente), código/QR para App Staff.
 * API_ERROR_CONTRACT: em resposta não-JSON/backend indisponível devolve [].
 */

import { dockerCoreClient } from "../docker-core/connection";
import { isBackendUnavailable } from "../menuPilotFallback";

export interface CoreRestaurantPerson {
  id: string;
  restaurant_id: string;
  name: string;
  role: "staff" | "manager";
  staff_code: string;
  qr_token: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Lista pessoas do restaurante.
 */
export async function readRestaurantPeople(
  restaurantId: string
): Promise<CoreRestaurantPerson[]> {
  try {
    const { data, error } = await dockerCoreClient
      .from("gm_restaurant_people")
      .select("id, restaurant_id, name, role, staff_code, qr_token, created_at, updated_at")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`readRestaurantPeople: ${error.message}`);
    return (data ?? []) as CoreRestaurantPerson[];
  } catch (err) {
    if (isBackendUnavailable(err)) return [];
    throw err;
  }
}
