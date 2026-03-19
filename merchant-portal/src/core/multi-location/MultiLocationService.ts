/**
 * Multi-Location Service — Manage multiple restaurant locations under one organization.
 */
import { getDockerCoreFetchClient } from "../infra/dockerCoreFetchClient";

export interface Location {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  status: "open" | "closed";
  organization_id?: string;
  created_at: string;
}

export interface LocationComparison {
  locationId: string;
  locationName: string;
  revenue: number;
  orders: number;
  avgTicket: number;
  trend: number;
}

export interface ConsolidatedReport {
  totalRevenue: number;
  totalOrders: number;
  avgTicket: number;
  locations: LocationComparison[];
}

export async function getLocations(organizationId: string): Promise<Location[]> {
  try {
    const db = await getDockerCoreFetchClient();
    const { data } = await db
      .from("gm_restaurants")
      .select("id, name, address, phone, created_at")
      .eq("organization_id", organizationId)
      .order("name");
    return (data || []).map((r: Record<string, unknown>) => ({
      ...r,
      status: "open" as const,
    })) as Location[];
  } catch {
    return [];
  }
}

export function switchLocation(restaurantId: string): void {
  localStorage.setItem("chefiapp_active_restaurant", restaurantId);
  window.location.reload();
}

export function getActiveLocationId(): string | null {
  return localStorage.getItem("chefiapp_active_restaurant");
}

export async function getConsolidatedReport(
  organizationId: string,
  _dateFrom?: string,
  _dateTo?: string
): Promise<ConsolidatedReport> {
  const locations = await getLocations(organizationId);
  // Placeholder — actual aggregation requires querying orders per location
  const locationData: LocationComparison[] = locations.map((loc) => ({
    locationId: loc.id,
    locationName: loc.name,
    revenue: 0,
    orders: 0,
    avgTicket: 0,
    trend: 0,
  }));

  const totalRevenue = locationData.reduce((s, l) => s + l.revenue, 0);
  const totalOrders = locationData.reduce((s, l) => s + l.orders, 0);

  return {
    totalRevenue,
    totalOrders,
    avgTicket: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    locations: locationData,
  };
}

export async function transferStock(
  fromLocationId: string,
  toLocationId: string,
  items: { ingredientId: string; quantity: number }[]
): Promise<boolean> {
  try {
    const db = await getDockerCoreFetchClient();
    for (const item of items) {
      // Deduct from source
      await db.from("gm_stock_ledger").insert({
        restaurant_id: fromLocationId,
        ingredient_id: item.ingredientId,
        movement_type: "transfer_out",
        quantity: -item.quantity,
        notes: `Transfer to ${toLocationId}`,
      });
      // Add to destination
      await db.from("gm_stock_ledger").insert({
        restaurant_id: toLocationId,
        ingredient_id: item.ingredientId,
        movement_type: "transfer_in",
        quantity: item.quantity,
        notes: `Transfer from ${fromLocationId}`,
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function copyMenu(
  fromLocationId: string,
  toLocationId: string
): Promise<boolean> {
  try {
    const db = await getDockerCoreFetchClient();
    const { data: products } = await db
      .from("gm_products")
      .select("*")
      .eq("restaurant_id", fromLocationId);

    if (!products?.length) return false;

    for (const product of products) {
      const { id: _id, restaurant_id: _rid, created_at: _ca, ...productData } = product;
      await db.from("gm_products").insert({
        ...productData,
        restaurant_id: toLocationId,
      });
    }
    return true;
  } catch {
    return false;
  }
}
