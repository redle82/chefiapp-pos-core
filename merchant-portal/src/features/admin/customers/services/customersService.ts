import { getDockerCoreFetchClient } from "../../../../core/infra/dockerCoreFetchClient";
import type {
  Customer,
  CustomersKPIs,
  GetCustomersParams,
  GetCustomersResult,
} from "../types";

/** Map a gm_customers row to the admin Customer shape */
function rowToCustomer(row: Record<string, any>): Customer {
  const totalSpent = (row.total_spend_cents ?? 0) / 100;
  const visits = row.visit_count ?? 0;
  return {
    id: row.id,
    name: row.name ?? "—",
    email: row.email ?? undefined,
    source: "TPV" as Customer["source"], // default; future: derive from orders
    totalSpent,
    averageSpent: visits > 0 ? totalSpent / visits : 0,
    tabsCount: visits,
    lastOrderAt:
      row.last_visit_at || row.created_at || new Date().toISOString(),
    locationName: "—", // future: join with gm_restaurants
    rating: undefined,
  };
}

export async function getCustomersKPIs(): Promise<CustomersKPIs> {
  const core = getDockerCoreFetchClient();

  // Fetch all customers (up to 1000) for aggregate KPIs
  const { data, error } = await core
    .from("gm_customers")
    .select("total_spend_cents,visit_count,points_balance")
    .limit(1000);

  if (error || !data) {
    return {
      customersCount: 0,
      customersAverageTabs: 0,
      customersAverageAmount: 0,
      customersAverageAmountPerTab: 0,
      customersAverageRating: null,
    };
  }

  const rows = data as Array<Record<string, any>>;
  const total = rows.length;
  if (total === 0) {
    return {
      customersCount: 0,
      customersAverageTabs: 0,
      customersAverageAmount: 0,
      customersAverageAmountPerTab: 0,
      customersAverageRating: null,
    };
  }

  const totalTabs = rows.reduce((s, c) => s + (c.visit_count ?? 0), 0);
  const totalSpentCents = rows.reduce(
    (s, c) => s + (c.total_spend_cents ?? 0),
    0,
  );
  const totalSpent = totalSpentCents / 100;

  return {
    customersCount: total,
    customersAverageTabs: totalTabs / total,
    customersAverageAmount: totalSpent / total,
    customersAverageAmountPerTab: totalTabs > 0 ? totalSpent / totalTabs : 0,
    customersAverageRating: null, // future: derive from reviews
  };
}

export async function getCustomers(
  params: GetCustomersParams = {},
): Promise<GetCustomersResult> {
  const { search = "", page = 1, pageSize = 10 } = params;
  const core = getDockerCoreFetchClient();

  // Build query
  let query = core
    .from("gm_customers")
    .select("*")
    .order("created_at", { ascending: false });

  // PostgREST ilike filter for search
  if (search.trim()) {
    const q = search.trim();
    query = query.or(`name.ilike.*${q}*,email.ilike.*${q}*,phone.ilike.*${q}*`);
  }

  // Pagination via range header
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  query = query.range(start, end);

  const { data, error } = await query;

  if (error || !data) {
    return { data: [], total: 0 };
  }

  const rows = (data as Array<Record<string, any>>).map(rowToCustomer);

  // For total count we need a separate lightweight query
  let total = rows.length;
  try {
    let countQuery = core.from("gm_customers").select("id");
    if (search.trim()) {
      const q = search.trim();
      countQuery = countQuery.or(
        `name.ilike.*${q}*,email.ilike.*${q}*,phone.ilike.*${q}*`,
      );
    }
    const { data: countData } = await countQuery;
    if (countData && Array.isArray(countData)) {
      total = countData.length;
    }
  } catch {
    // fallback: use rows length
  }

  return { data: rows, total };
}
