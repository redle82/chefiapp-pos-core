/**
 * CustomerDetailDrawer — Slide-out panel with full customer profile.
 *
 * Shows contact info, stats, dietary preferences, order history,
 * staff notes, and action buttons (edit, merge, export, delete).
 * Dark theme to match the admin aesthetic.
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getCustomer,
  getCustomerOrderHistory,
  getCustomerStats,
  addCustomerNote,
  setDietaryPreferences,
  deleteCustomer,
  exportCustomerData,
  mergeCustomers,
  searchCustomers,
  type CustomerRecord,
  type CustomerStats,
  type CustomerOrderHistoryItem,
} from "@/core/customers/CustomerService";
import { currencyService } from "@/core/currency/CurrencyService";
import { getFormatLocale } from "@/core/i18n/regionLocaleConfig";
import { CustomerFormModal } from "./CustomerFormModal";

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat(getFormatLocale(), {
    style: "currency",
    currency: currencyService.getDefaultCurrency(),
    minimumFractionDigits: 2,
  }).format(cents / 100);

const formatDate = (d: string | null) => {
  if (!d) return "\u2014";
  try {
    return new Intl.DateTimeFormat(getFormatLocale(), {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(d));
  } catch {
    return "\u2014";
  }
};

const formatDateTime = (d: string) => {
  try {
    return new Intl.DateTimeFormat(getFormatLocale(), {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(d));
  } catch {
    return d;
  }
};

const DIETARY_OPTIONS = [
  "vegan",
  "vegetarian",
  "gluten_free",
  "lactose_free",
  "nut_allergy",
  "shellfish_allergy",
  "halal",
  "kosher",
] as const;

interface Props {
  customerId: string;
  onClose: () => void;
}

export function CustomerDetailDrawer({ customerId, onClose }: Props) {
  const { t } = useTranslation("customers");

  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [orders, setOrders] = useState<CustomerOrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Note form
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Dietary modal
  const [dietaryOpen, setDietaryOpen] = useState(false);
  const [pendingDietary, setPendingDietary] = useState<string[]>([]);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);

  // Merge state
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSearch, setMergeSearch] = useState("");
  const [mergeResults, setMergeResults] = useState<CustomerRecord[]>([]);
  const [merging, setMerging] = useState(false);

  // Delete confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [cust, st, ord] = await Promise.all([
      getCustomer(customerId),
      getCustomerStats(customerId),
      getCustomerOrderHistory(customerId, 20),
    ]);
    setCustomer(cust);
    setStats(st);
    setOrders(ord);
    setLoading(false);
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  // Note submission
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    await addCustomerNote(customerId, newNote.trim());
    setNewNote("");
    setAddingNote(false);
    await load();
  };

  // Dietary preferences toggle
  const toggleDietary = (pref: string) => {
    setPendingDietary((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref],
    );
  };

  const saveDietary = async () => {
    await setDietaryPreferences(customerId, pendingDietary);
    setDietaryOpen(false);
    await load();
  };

  // Open dietary modal
  const openDietaryModal = () => {
    setPendingDietary(customer?.dietary_preferences ?? []);
    setDietaryOpen(true);
  };

  // Merge search
  useEffect(() => {
    if (!mergeOpen || !mergeSearch.trim() || !customer) return;
    const timer = setTimeout(() => {
      searchCustomers(customer.restaurant_id, mergeSearch.trim(), 5).then((results) => {
        setMergeResults(results.filter((r) => r.id !== customerId));
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [mergeSearch, mergeOpen, customer, customerId]);

  const handleMerge = async (duplicateId: string) => {
    setMerging(true);
    const result = await mergeCustomers(customerId, duplicateId);
    setMerging(false);
    if (result.success) {
      setMergeOpen(false);
      await load();
    }
  };

  // Delete
  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteCustomer(customerId);
    setDeleting(false);
    if (result.success) {
      onClose();
    }
  };

  // Export GDPR
  const handleExport = async () => {
    const data = await exportCustomerData(customerId);
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customer-${customerId}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parse notes into entries
  const noteEntries = (customer?.notes ?? "")
    .split("\n")
    .filter(Boolean)
    .reverse();

  if (loading) {
    return (
      <DrawerShell onClose={onClose}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      </DrawerShell>
    );
  }

  if (!customer) {
    return (
      <DrawerShell onClose={onClose}>
        <p className="p-6 text-sm text-gray-400">{t("empty")}</p>
      </DrawerShell>
    );
  }

  return (
    <DrawerShell onClose={onClose}>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ backgroundColor: `hsl(${Math.abs(customer.id.charCodeAt(0) * 37 % 360)}, 55%, 45%)` }}
          >
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-100">{customer.name}</h2>
            {customer.phone && (
              <p className="text-sm text-gray-400">{customer.phone}</p>
            )}
            {customer.email && (
              <p className="text-xs text-gray-500">{customer.email}</p>
            )}
          </div>
        </div>

        {/* Stats grid */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={t("detail.totalVisits")} value={String(stats.visitCount)} />
            <StatCard label={t("detail.totalSpent")} value={formatCurrency(stats.totalSpentCents)} />
            <StatCard label={t("detail.avgTicket")} value={formatCurrency(stats.avgTicketCents)} />
            <StatCard label={t("detail.points")} value={String(stats.pointsBalance)} />
            <StatCard label={t("detail.firstVisit")} value={formatDate(stats.firstVisitAt)} />
            <StatCard label={t("detail.lastVisit")} value={formatDate(stats.lastVisitAt)} />
          </div>
        )}

        {/* Dietary preferences */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300">{t("detail.dietary")}</h3>
            <button
              type="button"
              onClick={openDietaryModal}
              className="text-xs text-orange-400 hover:text-orange-300"
            >
              {t("detail.addDietary")}
            </button>
          </div>
          {(customer.dietary_preferences ?? []).length === 0 ? (
            <p className="text-xs text-gray-500">{t("detail.noDietary")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {customer.dietary_preferences!.map((pref) => (
                <span
                  key={pref}
                  className="rounded-full bg-red-900/30 px-2.5 py-0.5 text-xs font-semibold text-red-300"
                >
                  {t(`dietary_options.${pref}`, pref)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Order history */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-300">{t("detail.orderHistory")}</h3>
          {orders.length === 0 ? (
            <p className="text-xs text-gray-500">{t("detail.noOrders")}</p>
          ) : (
            <div className="max-h-60 divide-y divide-gray-800 overflow-y-auto rounded-lg border border-gray-800">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <p className="text-sm text-gray-300">
                      #{order.id.slice(0, 8)}
                      {order.table_number != null && ` \u00B7 Mesa ${order.table_number}`}
                    </p>
                    <p className="text-xs text-gray-500">{formatDateTime(order.created_at)}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-200">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staff notes */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-300">{t("detail.staffNotes")}</h3>
          {noteEntries.length === 0 && (
            <p className="mb-2 text-xs text-gray-500">{t("detail.noNotes")}</p>
          )}
          {noteEntries.length > 0 && (
            <div className="mb-3 max-h-40 divide-y divide-gray-800 overflow-y-auto rounded-lg border border-gray-800">
              {noteEntries.map((entry, i) => (
                <div key={i} className="px-3 py-2 text-xs text-gray-400">
                  {entry}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={t("detail.addNotePlaceholder")}
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-orange-500 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
            />
            <button
              type="button"
              onClick={handleAddNote}
              disabled={addingNote || !newNote.trim()}
              className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-orange-700"
            >
              {t("detail.addNote")}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-300">{t("detail.actions")}</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800"
            >
              {t("detail.edit")}
            </button>
            <button
              type="button"
              onClick={() => { setMergeOpen(true); setMergeSearch(""); setMergeResults([]); }}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800"
            >
              {t("detail.merge")}
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800"
            >
              {t("detail.exportData")}
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              className="rounded-lg border border-red-800 px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/30"
            >
              {t("detail.delete")}
            </button>
          </div>
        </div>

        {/* Meta */}
        <p className="text-xs text-gray-600">
          ID: {customer.id}
        </p>
      </div>

      {/* Dietary preferences modal */}
      {dietaryOpen && (
        <ModalOverlay onClose={() => setDietaryOpen(false)}>
          <h3 className="mb-4 text-lg font-semibold text-gray-100">{t("detail.dietary")}</h3>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggleDietary(opt)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  pendingDietary.includes(opt)
                    ? "bg-orange-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {t(`dietary_options.${opt}`, opt)}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setDietaryOpen(false)} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400">
              {t("form.cancel")}
            </button>
            <button type="button" onClick={saveDietary} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
              {t("form.save")}
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Merge modal */}
      {mergeOpen && (
        <ModalOverlay onClose={() => setMergeOpen(false)}>
          <h3 className="mb-2 text-lg font-semibold text-gray-100">{t("merge.title")}</h3>
          <p className="mb-4 text-sm text-gray-400">{t("merge.description")}</p>
          <input
            type="text"
            value={mergeSearch}
            onChange={(e) => setMergeSearch(e.target.value)}
            placeholder={t("merge.searchDuplicate")}
            className="mb-4 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500"
          />
          {mergeResults.length > 0 && (
            <div className="max-h-48 divide-y divide-gray-800 overflow-y-auto rounded-lg border border-gray-800">
              {mergeResults.map((dup) => (
                <div key={dup.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <p className="text-sm text-gray-300">{dup.name}</p>
                    <p className="text-xs text-gray-500">{dup.phone} {dup.email && `\u00B7 ${dup.email}`}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMerge(dup.id)}
                    disabled={merging}
                    className="rounded-lg bg-orange-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {t("merge.confirm")}
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={() => setMergeOpen(false)} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400">
              {t("merge.cancel")}
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Delete confirmation */}
      {deleteConfirmOpen && (
        <ModalOverlay onClose={() => setDeleteConfirmOpen(false)}>
          <h3 className="mb-2 text-lg font-semibold text-red-400">{t("delete.title")}</h3>
          <p className="mb-6 text-sm text-gray-400">{t("delete.description")}</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteConfirmOpen(false)} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400">
              {t("delete.cancel")}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {deleting ? "..." : t("delete.confirm")}
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Edit modal */}
      {editOpen && customer && (
        <CustomerFormModal
          customerId={customer.id}
          initialData={{
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            notes: customer.notes,
            dietary_preferences: customer.dietary_preferences,
          }}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); load(); }}
        />
      )}
    </DrawerShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Drawer shell (slide from right, dark backdrop)                     */
/* ------------------------------------------------------------------ */

function DrawerShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* Drawer panel */}
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col overflow-y-auto bg-[#0a0a0a] shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Customer
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-100">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal overlay (dark theme)                                         */
/* ------------------------------------------------------------------ */

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#0a0a0a] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
