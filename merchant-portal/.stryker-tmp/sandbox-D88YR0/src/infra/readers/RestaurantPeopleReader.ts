/**
 * RestaurantPeopleReader — Leituras de pessoas do restaurante (restaurant_users).
 */

import { dockerCoreClient } from "../docker-core/connection";

export interface CoreRestaurantPerson {
  id: string;
  user_id: string;
  restaurant_id: string;
  role: "owner" | "manager" | "waiter" | "kitchen" | "cleaning" | "staff";
  active: boolean;
  invited_by?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/**
 * Lista pessoas (membros) do restaurante (restaurant_users, deleted_at IS NULL).
 */
export async function readRestaurantPeople(
  restaurantId: string
): Promise<CoreRestaurantPerson[]> {
  const { data, error } = await dockerCoreClient
    .from("restaurant_users")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as CoreRestaurantPerson[];
}
