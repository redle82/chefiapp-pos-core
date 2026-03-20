/**
 * Quick Order Service — Simplified ordering for waiter tablets.
 */
import { getDockerCoreFetchClient } from "../infra/dockerCoreFetchClient";

export interface QuickOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  priceCents: number;
  modifiers?: { name: string; priceDeltaCents: number }[];
}

export async function getTableOrder(
  tableId: string,
  restaurantId: string
): Promise<{ orderId: string; items: QuickOrderItem[]; totalCents: number } | null> {
  try {
    const db = await getDockerCoreFetchClient();
    const { data } = await db
      .from("gm_orders")
      .select("id, items, total_cents")
      .eq("table_id", tableId)
      .eq("restaurant_id", restaurantId)
      .in("status", ["OPEN", "PENDING", "IN_PROGRESS"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;
    return {
      orderId: data.id,
      items: (data.items || []) as QuickOrderItem[],
      totalCents: data.total_cents || 0,
    };
  } catch {
    return null;
  }
}

export async function addItemToTable(
  tableId: string,
  restaurantId: string,
  operatorId: string,
  items: QuickOrderItem[]
): Promise<{ success: boolean; orderId?: string }> {
  try {
    const db = await getDockerCoreFetchClient();

    // Check for existing order
    const existing = await getTableOrder(tableId, restaurantId);

    if (existing) {
      // Add to existing order
      const updatedItems = [...existing.items, ...items];
      const addedTotal = items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
      await db
        .from("gm_orders")
        .update({
          items: updatedItems,
          total_cents: existing.totalCents + addedTotal,
        })
        .eq("id", existing.orderId);
      return { success: true, orderId: existing.orderId };
    }

    // Create new order
    const totalCents = items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
    const { data } = await db
      .from("gm_orders")
      .insert({
        restaurant_id: restaurantId,
        table_id: tableId,
        operator_id: operatorId,
        origin: "WAITER",
        status: "PENDING",
        items,
        total_cents: totalCents,
      })
      .select("id")
      .single();

    return { success: !!data, orderId: data?.id };
  } catch {
    return { success: false };
  }
}

export async function requestBill(
  tableId: string,
  restaurantId: string
): Promise<boolean> {
  try {
    const db = await getDockerCoreFetchClient();
    await db
      .from("gm_tables")
      .update({ status: "bill_requested" })
      .eq("id", tableId)
      .eq("restaurant_id", restaurantId);
    return true;
  } catch {
    return false;
  }
}

export async function submitTableOrder(
  tableId: string,
  restaurantId: string
): Promise<boolean> {
  const order = await getTableOrder(tableId, restaurantId);
  if (!order) return false;

  try {
    const db = await getDockerCoreFetchClient();
    await db
      .from("gm_orders")
      .update({ status: "IN_PROGRESS" })
      .eq("id", order.orderId);
    return true;
  } catch {
    return false;
  }
}
