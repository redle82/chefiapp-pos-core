/**
 * RestaurantPeopleReader — Leituras de pessoas operacionais (gm_restaurant_people).
 *
 * Usado por Admin Config → Pessoas e AppStaff landing (check-in por pessoa).
 * Fonte: gm_restaurant_people (nome, role staff|manager, staff_code, qr_token).
 */

import { dockerCoreClient } from "../docker-core/connection";

export interface CoreRestaurantPerson {
  id: string;
  restaurant_id: string;
  name: string;
  role: "staff" | "manager";
  staff_code: string;
  qr_token?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Lista pessoas operacionais do restaurante (gm_restaurant_people).
 */
export async function readRestaurantPeople(
  restaurantId: string
): Promise<CoreRestaurantPerson[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_restaurant_people")
    .select("id, restaurant_id, name, role, staff_code, qr_token, created_at, updated_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as CoreRestaurantPerson[];
}
