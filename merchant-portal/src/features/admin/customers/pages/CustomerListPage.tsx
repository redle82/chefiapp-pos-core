/**
 * CustomerListPage — Admin CRM page at /admin/customers.
 *
 * Features:
 * - Searchable, sortable table
 * - Segment filter (New, Regular, VIP, At-risk, Lost)
 * - Create new customer button
 * - Click row to open detail drawer
 * - KPI bar
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { CustomersKPIBar } from "../components/CustomersKPIBar";
import { CustomerDetailDrawer } from "../components/CustomerDetailDrawer";
import { CustomerFormModal } from "../components/CustomerFormModal";
import { getCustomers, getCustomersKPIs } from "../services/customersService";
import type { Customer, CustomerSegment, CustomersKPIs } from "../types";
import { currencyService } from "@/core/currency/CurrencyService";
import { getFormatLocale } from "@/core/i18n/regionLocaleConfig";
import { getSegments, type SegmentInfo } from "@/core/customers/CustomerService";
import { useRestaurantRuntime } from "@/context/RestaurantRuntimeContext";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat(getFormatLocale(), {
    style: "currency",
    currency: currencyService.getDefaultCurrency(),
    minimumFractionDigits: 2,
  }).format(n);

const formatDate = (d: string) => {
  try {
    return new Intl.DateTimeFormat(getFormatLocale(), {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(new Date(d));
  } catch {
    return "\u2014";
  }
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 55%, 45%)`;
}

const SEGMENT_COLORS: Record<CustomerSegment, string> = {
  new: "bg-blue-100 text-blue-700",
  regular: "bg-green-100 text-green-700",
  vip: "bg-amber-100 text-amber-700",
  at_risk: "bg-orange-100 text-orange-700",
  lost: "bg-red-100 text-red-700",
};

type SortColumn = "name" | "visits" | "totalSpent" | "lastVisit";

export function CustomerListPage() {
  const { t } = useTranslation("customers");
  const runtimeContext = useRestaurantRuntime();
  const restaurantId = runtimeContext?.runtime?.restaurant_id ?? "";

  const [kpis, setKpis] = useState<CustomersKPIs | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | null>(null);
  const [sortBy, setSortBy] = useState<SortColumn>("lastVisit");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [segments, setSegments] = useState<SegmentInfo[]>([]);

  // Drawer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Load KPIs + segments
  useEffect(() => {
    let cancelled = false;
    getCustomersKPIs().then((data) => {
      if (!cancelled) setKpis(data);
    });
    if (restaurantId) {
      getSegments(restaurantId).then((data) => {
        if (!cancelled) setSegments(data);
      });
    }
    return () => { cancelled = true; };
  }, [restaurantId]);

  // Load customers
  const loadCustomers = useCallback(() => {
    setLoading(true);
    getCustomers({ search, page, pageSize, segment: segmentFilter, sortBy, sortDir })
      .then((result) => {
        setCustomers(result.data);
        setTotal(result.total);
      })
      .finally(() => setLoading(false));
  }, [search, page, pageSize, segmentFilter, sortBy, sortDir]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleSort = (col: SortColumn) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
    setPage(1);
  };

  const sortArrow = (col: SortColumn) => {
    if (sortBy !== col) return "";
    return sortDir === "asc" ? " \u25B2" : " \u25BC";
  };

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setDrawerOpen(true);
  };

  const handleCustomerCreated = () => {
    setCreateModalOpen(false);
    loadCustomers();
    // Refresh KPIs
    getCustomersKPIs().then(setKpis);
    if (restaurantId) getSegments(restaurantId).then(setSegments);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedCustomerId(null);
    // Refresh list in case data changed
    loadCustomers();
  };

  return (
    <section className="page-enter admin-content-page flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <AdminPageHeader
          title={t("pageTitle")}
          subtitle={t("pageSubtitle")}
        />
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700"
        >
          + {t("createNew")}
        </button>
      </div>

      <CustomersKPIBar kpis={kpis} loading={loading} />

      {/* Segment filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => { setSegmentFilter(null); setPage(1); }}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            segmentFilter === null
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {t("segments.all")} ({kpis?.customersCount ?? 0})
        </button>
        {(["new", "regular", "vip", "at_risk", "lost"] as CustomerSegment[]).map((seg) => {
          const info = segments.find((s) => s.segment === seg);
          return (
            <button
              key={seg}
              type="button"
              onClick={() => { setSegmentFilter(seg); setPage(1); }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                segmentFilter === seg
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t(`segments.${seg}`)} ({info?.count ?? 0})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Search + page size */}
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t("search")}
              className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              aria-label={t("search")}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            aria-label={t("perPage", { n: pageSize })}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n} / {t("perPage", { n }).replace(`${n} / `, "")}</option>
            ))}
          </select>
        </div>

        {/* Table content */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] table-fixed">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="w-[30%] py-3 pl-4 pr-2">
                  <button type="button" onClick={() => handleSort("name")} className="hover:text-gray-800">
                    {t("columns.name")}{sortArrow("name")}
                  </button>
                </th>
                <th className="w-[15%] py-3 px-2">{t("columns.phone")}</th>
                <th className="w-[10%] py-3 px-2">
                  <button type="button" onClick={() => handleSort("visits")} className="hover:text-gray-800">
                    {t("columns.visits")}{sortArrow("visits")}
                  </button>
                </th>
                <th className="w-[15%] py-3 px-2">
                  <button type="button" onClick={() => handleSort("totalSpent")} className="hover:text-gray-800">
                    {t("columns.totalSpent")}{sortArrow("totalSpent")}
                  </button>
                </th>
                <th className="w-[15%] py-3 px-2">
                  <button type="button" onClick={() => handleSort("lastVisit")} className="hover:text-gray-800">
                    {t("columns.lastVisit")}{sortArrow("lastVisit")}
                  </button>
                </th>
                <th className="w-[15%] py-3 pr-4 pl-2">{t("columns.segment")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                    {t("loading")}
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                    {search ? t("empty") : t("emptyCreate")}
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRowClick(c)}
                    onKeyDown={(e) => e.key === "Enter" && handleRowClick(c)}
                    className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50"
                  >
                    <td className="py-3 pl-4 pr-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: avatarColor(c.id) }}
                        >
                          {getInitials(c.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{c.name}</span>
                          {c.email && <span className="text-xs text-gray-400">{c.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">{c.phone || "\u2014"}</td>
                    <td className="py-3 px-2 text-sm text-gray-900">{c.tabsCount}</td>
                    <td className="py-3 px-2 text-sm text-gray-900">{formatCurrency(c.totalSpent)}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{formatDate(c.lastOrderAt)}</td>
                    <td className="py-3 pr-4 pl-2">
                      {c.segment && (
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${SEGMENT_COLORS[c.segment]}`}>
                          {t(`segments.${c.segment}`)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-5 py-4">
            <div className="text-sm text-gray-600">
              {t("totalCustomers", { count: total })}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
              >
                &lt;
              </button>
              <span className="px-2 text-sm text-gray-700">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer detail drawer */}
      {drawerOpen && selectedCustomerId && (
        <CustomerDetailDrawer
          customerId={selectedCustomerId}
          onClose={handleDrawerClose}
        />
      )}

      {/* Create customer modal */}
      {createModalOpen && (
        <CustomerFormModal
          onClose={() => setCreateModalOpen(false)}
          onSaved={handleCustomerCreated}
        />
      )}
    </section>
  );
}
