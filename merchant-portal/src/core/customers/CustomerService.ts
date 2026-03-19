/**
 * CustomerService — Core CRM service for customer management.
 *
 * Backed by gm_customers table in Docker Core (PostgREST).
 * Provides CRUD, search, segmentation, notes, dietary preferences, and merge.
 */

import { getDockerCoreFetchClient } from "../infra/dockerCoreFetchClient";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CustomerSource =
  | "Uber"
  | "Glovo"
  | "JustEat"
  | "OwnDelivery"
  | "GloriaFood"
  | "QR"
  | "TPV"
  | "Web";

export interface CustomerRecord {
  id: string;
  restaurant_id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  dietary_preferences?: string[];
  source: CustomerSource;
  visit_count: number;
  total_spend_cents: number;
  points_balance: number;
  first_visit_at: string | null;
  last_visit_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreateData {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  dietary_preferences?: string[];
  source?: CustomerSource;
}

export interface CustomerUpdateData {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  dietary_preferences?: string[];
}

export interface CustomerStats {
  totalSpentCents: number;
  visitCount: number;
  avgTicketCents: number;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
  pointsBalance: number;
}

export interface CustomerOrderHistoryItem {
  id: string;
  created_at: string;
  total: number;
  status: string;
  items_count: number;
  table_number?: number;
  order_mode?: string;
}

export type CustomerSegment = "new" | "regular" | "vip" | "at_risk" | "lost";

export interface SegmentInfo {
  segment: CustomerSegment;
  count: number;
}

export interface CustomerNote {
  id: string;
  note: string;
  created_at: string;
  created_by?: string;
}

/* ------------------------------------------------------------------ */
/*  Row → Record mapper                                                */
/* ------------------------------------------------------------------ */

function rowToRecord(row: Record<string, any>): CustomerRecord {
  return {
    id: row.id,
    restaurant_id: row.restaurant_id,
    name: row.name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
    dietary_preferences: parseDietaryPreferences(row.dietary_preferences),
    source: (row.source as CustomerSource) ?? "TPV",
    visit_count: row.visit_count ?? 0,
    total_spend_cents: row.total_spend_cents ?? 0,
    points_balance: row.points_balance ?? 0,
    first_visit_at: row.first_visit_at ?? null,
    last_visit_at: row.last_visit_at ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

function parseDietaryPreferences(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // comma-separated fallback
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

/* ------------------------------------------------------------------ */
/*  createCustomer                                                     */
/* ------------------------------------------------------------------ */

export async function createCustomer(
  restaurantId: string,
  data: CustomerCreateData,
): Promise<{ data: CustomerRecord | null; error: string | null }> {
  const core = getDockerCoreFetchClient();
  const now = new Date().toISOString();
  const { data: row, error } = await core
    .from("gm_customers")
    .insert({
      restaurant_id: restaurantId,
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      notes: data.notes ?? null,
      dietary_preferences: data.dietary_preferences ?? [],
      source: data.source ?? "TPV",
      visit_count: 0,
      total_spend_cents: 0,
      points_balance: 0,
      first_visit_at: null,
      last_visit_at: null,
      created_at: now,
      updated_at: now,
    })
    .select("*");

  if (error) return { data: null, error: error.message };
  return { data: row ? rowToRecord(row as Record<string, any>) : null, error: null };
}

/* ------------------------------------------------------------------ */
/*  updateCustomer                                                     */
/* ------------------------------------------------------------------ */

export async function updateCustomer(
  customerId: string,
  data: CustomerUpdateData,
): Promise<{ data: CustomerRecord | null; error: string | null }> {
  const core = getDockerCoreFetchClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) payload.name = data.name;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.email !== undefined) payload.email = data.email || null;
  if (data.notes !== undefined) payload.notes = data.notes || null;
  if (data.dietary_preferences !== undefined)
    payload.dietary_preferences = data.dietary_preferences;

  const { data: row, error } = await core
    .from("gm_customers")
    .update(payload)
    .eq("id", customerId)
    .select("*")
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: row ? rowToRecord(row as Record<string, any>) : null, error: null };
}

/* ------------------------------------------------------------------ */
/*  searchCustomers                                                    */
/* ------------------------------------------------------------------ */

export async function searchCustomers(
  restaurantId: string,
  query: string,
  limit = 10,
): Promise<CustomerRecord[]> {
  const core = getDockerCoreFetchClient();
  const q = query.trim();
  if (!q) return [];

  let builder = core
    .from("gm_customers")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .or(`name.ilike.*${q}*,email.ilike.*${q}*,phone.ilike.*${q}*`)
    .order("name", { ascending: true })
    .limit(limit);

  const { data, error } = await builder;
  if (error || !data) return [];
  return (data as Array<Record<string, any>>).map(rowToRecord);
}

/* ------------------------------------------------------------------ */
/*  getCustomer                                                        */
/* ------------------------------------------------------------------ */

export async function getCustomer(
  customerId: string,
): Promise<CustomerRecord | null> {
  const core = getDockerCoreFetchClient();
  const { data, error } = await core
    .from("gm_customers")
    .select("*")
    .eq("id", customerId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToRecord(data as Record<string, any>);
}

/* ------------------------------------------------------------------ */
/*  getCustomerOrderHistory                                            */
/* ------------------------------------------------------------------ */

export async function getCustomerOrderHistory(
  customerId: string,
  limit = 20,
): Promise<CustomerOrderHistoryItem[]> {
  const core = getDockerCoreFetchClient();
  // Orders linked to the customer via customer_id column on gm_orders
  const { data, error } = await core
    .from("gm_orders")
    .select("id,created_at,total,status,table_number,order_mode")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as Array<Record<string, any>>).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    total: row.total ?? 0,
    status: row.status ?? "unknown",
    items_count: 0, // items count requires join; omit for now
    table_number: row.table_number,
    order_mode: row.order_mode,
  }));
}

/* ------------------------------------------------------------------ */
/*  getCustomerStats                                                   */
/* ------------------------------------------------------------------ */

export async function getCustomerStats(
  customerId: string,
): Promise<CustomerStats | null> {
  const customer = await getCustomer(customerId);
  if (!customer) return null;

  const visits = customer.visit_count || 0;
  return {
    totalSpentCents: customer.total_spend_cents,
    visitCount: visits,
    avgTicketCents: visits > 0 ? Math.round(customer.total_spend_cents / visits) : 0,
    firstVisitAt: customer.first_visit_at,
    lastVisitAt: customer.last_visit_at,
    pointsBalance: customer.points_balance,
  };
}

/* ------------------------------------------------------------------ */
/*  getTopCustomers                                                    */
/* ------------------------------------------------------------------ */

export async function getTopCustomers(
  restaurantId: string,
  limit = 10,
): Promise<CustomerRecord[]> {
  const core = getDockerCoreFetchClient();
  const { data, error } = await core
    .from("gm_customers")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("total_spend_cents", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as Array<Record<string, any>>).map(rowToRecord);
}

/* ------------------------------------------------------------------ */
/*  addCustomerNote                                                    */
/* ------------------------------------------------------------------ */

export async function addCustomerNote(
  customerId: string,
  note: string,
): Promise<{ success: boolean; error?: string }> {
  // Append note to existing notes with timestamp
  const customer = await getCustomer(customerId);
  if (!customer) return { success: false, error: "Customer not found" };

  const timestamp = new Date().toISOString();
  const newEntry = `[${timestamp}] ${note}`;
  const existing = customer.notes ?? "";
  const updated = existing ? `${existing}\n${newEntry}` : newEntry;

  const core = getDockerCoreFetchClient();
  const { error } = await core
    .from("gm_customers")
    .update({ notes: updated, updated_at: timestamp })
    .eq("id", customerId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/* ------------------------------------------------------------------ */
/*  setDietaryPreferences                                              */
/* ------------------------------------------------------------------ */

export async function setDietaryPreferences(
  customerId: string,
  preferences: string[],
): Promise<{ success: boolean; error?: string }> {
  const core = getDockerCoreFetchClient();
  const { error } = await core
    .from("gm_customers")
    .update({
      dietary_preferences: preferences,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/* ------------------------------------------------------------------ */
/*  mergeCustomers                                                     */
/* ------------------------------------------------------------------ */

export async function mergeCustomers(
  primaryId: string,
  duplicateId: string,
): Promise<{ success: boolean; error?: string }> {
  const [primary, duplicate] = await Promise.all([
    getCustomer(primaryId),
    getCustomer(duplicateId),
  ]);

  if (!primary || !duplicate) {
    return { success: false, error: "One or both customers not found" };
  }

  const core = getDockerCoreFetchClient();

  // Merge data: keep primary's name/phone, fill gaps from duplicate
  const mergedData: Record<string, unknown> = {
    email: primary.email || duplicate.email || null,
    notes: [primary.notes, duplicate.notes].filter(Boolean).join("\n") || null,
    dietary_preferences: [
      ...new Set([
        ...(primary.dietary_preferences ?? []),
        ...(duplicate.dietary_preferences ?? []),
      ]),
    ],
    visit_count: primary.visit_count + duplicate.visit_count,
    total_spend_cents: primary.total_spend_cents + duplicate.total_spend_cents,
    points_balance: primary.points_balance + duplicate.points_balance,
    first_visit_at:
      primary.first_visit_at && duplicate.first_visit_at
        ? primary.first_visit_at < duplicate.first_visit_at
          ? primary.first_visit_at
          : duplicate.first_visit_at
        : primary.first_visit_at || duplicate.first_visit_at,
    last_visit_at:
      primary.last_visit_at && duplicate.last_visit_at
        ? primary.last_visit_at > duplicate.last_visit_at
          ? primary.last_visit_at
          : duplicate.last_visit_at
        : primary.last_visit_at || duplicate.last_visit_at,
    updated_at: new Date().toISOString(),
  };

  // Update primary with merged data
  const { error: updateError } = await core
    .from("gm_customers")
    .update(mergedData)
    .eq("id", primaryId);

  if (updateError) return { success: false, error: updateError.message };

  // Re-assign duplicate's orders to primary (fire-and-forget — may fail if column doesn't exist)
  await core
    .from("gm_orders")
    .update({ customer_id: primaryId })
    .eq("customer_id", duplicateId);

  // Delete duplicate
  const { error: deleteError } = await core
    .from("gm_customers")
    .delete()
    .eq("id", duplicateId);

  if (deleteError) return { success: false, error: deleteError.message };
  return { success: true };
}

/* ------------------------------------------------------------------ */
/*  Customer Segments                                                  */
/* ------------------------------------------------------------------ */

function classifySegment(customer: CustomerRecord): CustomerSegment {
  const visits = customer.visit_count ?? 0;
  const totalSpent = customer.total_spend_cents ?? 0;
  const lastVisit = customer.last_visit_at;

  // Check recency first
  if (lastVisit) {
    const daysSinceLastVisit = Math.floor(
      (Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceLastVisit >= 90) return "lost";
    if (daysSinceLastVisit >= 30) return "at_risk";
  }

  // VIP: 10+ visits OR 50000+ cents (500 EUR/BRL) spent
  if (visits >= 10 || totalSpent >= 50000) return "vip";
  // Regular: 2-9 visits
  if (visits >= 2) return "regular";
  // New: 0-1 visit
  return "new";
}

export async function getSegments(
  restaurantId: string,
): Promise<SegmentInfo[]> {
  const core = getDockerCoreFetchClient();
  const { data, error } = await core
    .from("gm_customers")
    .select("visit_count,total_spend_cents,last_visit_at")
    .eq("restaurant_id", restaurantId)
    .limit(5000);

  if (error || !data) {
    return [
      { segment: "new", count: 0 },
      { segment: "regular", count: 0 },
      { segment: "vip", count: 0 },
      { segment: "at_risk", count: 0 },
      { segment: "lost", count: 0 },
    ];
  }

  const counts: Record<CustomerSegment, number> = {
    new: 0,
    regular: 0,
    vip: 0,
    at_risk: 0,
    lost: 0,
  };

  for (const row of data as Array<Record<string, any>>) {
    const segment = classifySegment(row as CustomerRecord);
    counts[segment]++;
  }

  return [
    { segment: "new", count: counts.new },
    { segment: "regular", count: counts.regular },
    { segment: "vip", count: counts.vip },
    { segment: "at_risk", count: counts.at_risk },
    { segment: "lost", count: counts.lost },
  ];
}

export async function getCustomersBySegment(
  restaurantId: string,
  segment: CustomerSegment,
  limit = 50,
): Promise<CustomerRecord[]> {
  const core = getDockerCoreFetchClient();
  const { data, error } = await core
    .from("gm_customers")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .limit(5000);

  if (error || !data) return [];

  const all = (data as Array<Record<string, any>>).map(rowToRecord);
  return all
    .filter((c) => classifySegment(c) === segment)
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/*  deleteCustomer (GDPR)                                              */
/* ------------------------------------------------------------------ */

export async function deleteCustomer(
  customerId: string,
): Promise<{ success: boolean; error?: string }> {
  const core = getDockerCoreFetchClient();
  const { error } = await core
    .from("gm_customers")
    .delete()
    .eq("id", customerId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/* ------------------------------------------------------------------ */
/*  exportCustomerData (GDPR)                                          */
/* ------------------------------------------------------------------ */

export async function exportCustomerData(
  customerId: string,
): Promise<Record<string, unknown> | null> {
  const customer = await getCustomer(customerId);
  if (!customer) return null;

  const orders = await getCustomerOrderHistory(customerId, 1000);
  const stats = await getCustomerStats(customerId);

  return {
    customer,
    orders,
    stats,
    exportedAt: new Date().toISOString(),
  };
}
