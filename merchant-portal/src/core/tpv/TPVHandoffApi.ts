import { invokeRpc } from "../infra/coreRpc";

export type TPVHandoffStatus =
  | "pending"
  | "awaiting_payment"
  | "closed"
  | "cancelled";

export type TPVHandoffRecord = {
  id: string;
  restaurant_id: string;
  table_id?: string | null;
  table_number?: number | null;
  waiter_id?: string | null;
  waiter_name?: string | null;
  total_estimated_cents?: number | null;
  status: TPVHandoffStatus;
  notes?: string | null;
  requested_at: string;
  consumed_at?: string | null;
  updated_at: string;
};

export type CreateTPVHandoffInput = {
  restaurantId: string;
  tableId?: string | null;
  tableNumber?: number | null;
  waiterId?: string | null;
  waiterName?: string | null;
  totalEstimatedCents?: number | null;
  notes?: string | null;
};

export async function createTPVHandoff(input: CreateTPVHandoffInput): Promise<{
  data: { id: string; status: TPVHandoffStatus } | null;
  error: { message: string } | null;
}> {
  const { data, error } = await invokeRpc<{
    id: string;
    status: TPVHandoffStatus;
  }>("create_tpv_handoff", {
    p_restaurant_id: input.restaurantId,
    p_table_id: input.tableId ?? null,
    p_table_number: input.tableNumber ?? null,
    p_waiter_id: input.waiterId ?? null,
    p_waiter_name: input.waiterName ?? null,
    p_total_estimated_cents: input.totalEstimatedCents ?? null,
    p_notes: input.notes ?? null,
  });

  return { data: data ?? null, error };
}

export async function listTPVHandoffs(
  restaurantId: string,
  status?: TPVHandoffStatus,
): Promise<{ data: TPVHandoffRecord[]; error: { message: string } | null }> {
  const { data, error } = await invokeRpc<TPVHandoffRecord[]>(
    "list_tpv_handoffs",
    {
      p_restaurant_id: restaurantId,
      p_status: status ?? null,
    },
  );

  return { data: data ?? [], error };
}

export async function markTPVHandoffStatus(input: {
  handoffId: string;
  status: TPVHandoffStatus;
  notes?: string | null;
}): Promise<{
  data: { ok: boolean } | null;
  error: { message: string } | null;
}> {
  const { data, error } = await invokeRpc<{ ok: boolean }>(
    "mark_tpv_handoff_status",
    {
      p_handoff_id: input.handoffId,
      p_status: input.status,
      p_notes: input.notes ?? null,
    },
  );

  return { data: data ?? null, error };
}
