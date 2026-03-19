/**
 * CustomerQuickAdd — Small form in the TPV order panel to associate a customer.
 *
 * Features:
 * - Search existing customers by phone/name (autocomplete)
 * - Quick-add new customer (name + phone minimum)
 * - Show customer info when linked: name, visit count, preferences
 * - Dietary alerts
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  searchCustomers,
  createCustomer,
  type CustomerRecord,
} from "../../../core/customers/CustomerService";

interface Props {
  restaurantId: string;
  linkedCustomer: CustomerRecord | null;
  onLink: (customer: CustomerRecord) => void;
  onUnlink: () => void;
}

export function CustomerQuickAdd({ restaurantId, linkedCustomer, onLink, onUnlink }: Props) {
  const { t } = useTranslation("customers");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerRecord[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showQuickForm, setShowQuickForm] = useState(false);

  // Quick-add form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creating, setCreating] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchCustomers(restaurantId, query.trim(), 5).then((r) => {
        setResults(r);
        setShowDropdown(true);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [query, restaurantId]);

  const handleSelect = useCallback((customer: CustomerRecord) => {
    onLink(customer);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  }, [onLink]);

  const handleQuickCreate = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    setCreating(true);
    const result = await createCustomer(restaurantId, {
      name: newName.trim(),
      phone: newPhone.trim(),
    });
    setCreating(false);
    if (result.data) {
      onLink(result.data);
      setShowQuickForm(false);
      setNewName("");
      setNewPhone("");
      setQuery("");
    }
  };

  // When already linked, show compact customer info
  if (linkedCustomer) {
    const dietary = linkedCustomer.dietary_preferences ?? [];
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: `hsl(${Math.abs(linkedCustomer.id.charCodeAt(0) * 37 % 360)}, 55%, 45%)` }}
            >
              {linkedCustomer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">{linkedCustomer.name}</p>
              <p className="text-xs text-gray-500">
                {t("quickAdd.visits", { count: linkedCustomer.visit_count })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onUnlink}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            {t("quickAdd.unlink")}
          </button>
        </div>

        {/* Dietary alerts */}
        {dietary.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {dietary.map((pref) => (
              <span
                key={pref}
                className="rounded-full bg-red-900/40 px-2 py-0.5 text-[10px] font-semibold text-red-300"
                title={t("quickAdd.dietaryAlert")}
              >
                {t(`dietary_options.${pref}`, pref)}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {t("quickAdd.title")}
      </label>

      {!showQuickForm ? (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder={t("quickAdd.searchPlaceholder")}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-orange-500 focus:outline-none"
          />

          {/* Autocomplete dropdown */}
          {showDropdown && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-lg">
              {results.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-800"
                  onMouseDown={() => handleSelect(customer)}
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-200">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.phone}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {customer.visit_count} vis.
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Show "add new" link when search returns no results or query is typed */}
          {query.length >= 2 && results.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setShowQuickForm(true);
                setNewName(query);
              }}
              className="mt-1 text-xs text-orange-400 hover:text-orange-300"
            >
              + {t("quickAdd.addNew")}
            </button>
          )}
        </div>
      ) : (
        /* Quick-add inline form */
        <div className="flex flex-col gap-2 rounded-lg border border-gray-700 bg-gray-800/50 p-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("form.namePlaceholder")}
            className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-orange-500 focus:outline-none"
            autoFocus
          />
          <input
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder={t("form.phonePlaceholder")}
            className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-orange-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowQuickForm(false); setNewName(""); setNewPhone(""); }}
              className="flex-1 rounded border border-gray-600 py-1 text-xs text-gray-400 hover:bg-gray-700"
            >
              {t("form.cancel")}
            </button>
            <button
              type="button"
              onClick={handleQuickCreate}
              disabled={creating || !newName.trim() || !newPhone.trim()}
              className="flex-1 rounded bg-orange-600 py-1 text-xs font-semibold text-white disabled:opacity-50 hover:bg-orange-700"
            >
              {creating ? "..." : t("form.save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
