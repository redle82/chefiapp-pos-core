import { getDockerCoreFetchClient } from "../../../../core/infra/dockerCoreFetchClient";
import type {
  Customer,
  CustomerSegment,
  CustomersKPIs,
  GetCustomersParams,
  GetCustomersResult,
} from "../types";

/* ------------------------------------------------------------------ */
/*  Segment classification                                             */
/* ------------------------------------------------------------------ */

function classifySegment(row: Record<string, any>): CustomerSegment {
  const visits = row.visit_count ?? 0;
  const totalSpent = row.total_spend_cents ?? 0;
  const lastVisit = row.last_visit_at;

  if (lastVisit) {
    const daysSinceLastVisit = Math.floor(
      (Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceLastVisit >= 90) return "lost";
    if (daysSinceLastVisit >= 30) return "at_risk";
  }

  if (visits >= 10 || totalSpent >= 50000) return "vip";
  if (visits >= 2) return "regular";
  return "new";
}

/* ------------------------------------------------------------------ */
/*  Row → Customer mapper                                              */
/* ------------------------------------------------------------------ */

function rowToCustomer(row: Record<string, any>): Customer {
  const totalSpent = (row.total_spend_cents ?? 0) / 100;
  const visits = row.visit_count ?? 0;
  let dietary: string[] = [];
  if (Array.isArray(row.dietary_preferences)) {
    dietary = row.dietary_preferences;
  } else if (typeof row.dietary_preferences === "string" && row.dietary_preferences) {
    try {
      const parsed = JSON.parse(row.dietary_preferences);
      if (Array.isArray(parsed)) dietary = parsed;
    } catch {
      dietary = row.dietary_preferences.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  }

  return {
    id: row.id,
    name: row.name ?? "\u2014",
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    source: "TPV" as Customer["source"],
    totalSpent,
    averageSpent: visits > 0 ? totalSpent / visits : 0,
    tabsCount: visits,
    lastOrderAt:
      row.last_visit_at || row.created_at || new Date().toISOString(),
    locationName: "\u2014",
    rating: undefined,
    segment: classifySegment(row),
    dietaryPreferences: dietary,
  };
}

/* ------------------------------------------------------------------ */
/*  KPIs                                                               */
/* ------------------------------------------------------------------ */

export async function getCustomersKPIs(): Promise<CustomersKPIs> {
  const core = getDockerCoreFetchClient();
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
    customersAverageRating: null,
  };
}

/* ------------------------------------------------------------------ */
/*  getCustomers (list with search, pagination, segment filter, sort)   */
/* ------------------------------------------------------------------ */

export async function getCustomers(
  params: GetCustomersParams = {},
): Promise<GetCustomersResult> {
  const {
    search = "",
    page = 1,
    pageSize = 10,
    segment = null,
    sortBy = "created_at",
    sortDir = "desc",
  } = params;
  const core = getDockerCoreFetchClient();

  // Map UI sort column to DB column
  const dbColumn = (() => {
    switch (sortBy) {
      case "name": return "name";
      case "phone": return "phone";
      case "visits": return "visit_count";
      case "totalSpent": return "total_spend_cents";
      case "lastVisit": return "last_visit_at";
      default: return "created_at";
    }
  })();

  let query = core
    .from("gm_customers")
    .select("*")
    .order(dbColumn, { ascending: sortDir === "asc" });

  if (search.trim()) {
    const q = search.trim();
    query = query.or(`name.ilike.*${q}*,email.ilike.*${q}*,phone.ilike.*${q}*`);
  }

  // When filtering by segment, we fetch all rows and filter client-side
  // (segments are computed, not stored in DB)
  if (segment) {
    const { data: allData, error: allErr } = await query.limit(5000);
    if (allErr || !allData) return { data: [], total: 0 };

    const allRows = (allData as Array<Record<string, any>>)
      .map(rowToCustomer)
      .filter((c) => c.segment === segment);

    const start = (page - 1) * pageSize;
    return {
      data: allRows.slice(start, start + pageSize),
      total: allRows.length,
    };
  }

  // Standard pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  query = query.range(start, end);

  const { data, error } = await query;
  if (error || !data) return { data: [], total: 0 };

  const rows = (data as Array<Record<string, any>>).map(rowToCustomer);

  // Count total
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
    // fallback
  }

  return { data: rows, total };
}
