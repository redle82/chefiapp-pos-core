/**
 * CustomerFormModal — Create or edit a customer.
 * Used from both CustomerListPage (create) and CustomerDetailDrawer (edit).
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createCustomer,
  updateCustomer,
} from "@/core/customers/CustomerService";
import { useRestaurantRuntime } from "@/context/RestaurantRuntimeContext";

interface Props {
  customerId?: string;
  initialData?: {
    name: string;
    phone: string;
    email?: string;
    notes?: string;
    dietary_preferences?: string[];
  };
  onClose: () => void;
  onSaved: () => void;
}

export function CustomerFormModal({ customerId, initialData, onClose, onSaved }: Props) {
  const { t } = useTranslation("customers");
  const runtimeContext = useRestaurantRuntime();
  const restaurantId = runtimeContext?.runtime?.restaurant_id ?? "";

  const isEdit = !!customerId;

  const [name, setName] = useState(initialData?.name ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError(t("form.errorNameRequired"));
      return;
    }
    if (!isEdit && !phone.trim()) {
      setError(t("form.errorPhoneRequired"));
      return;
    }

    setSaving(true);
    try {
      if (isEdit && customerId) {
        const result = await updateCustomer(customerId, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
      } else {
        const result = await createCustomer(restaurantId, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-bold text-gray-900">
          {isEdit ? t("form.editTitle") : t("form.createTitle")}
        </h3>

        <div className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t("form.name")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("form.namePlaceholder")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              autoFocus
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t("form.phone")}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("form.phonePlaceholder")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t("form.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("form.emailPlaceholder")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t("form.notes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("form.notesPlaceholder")}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t("form.cancel")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-orange-700"
            >
              {saving ? t("form.saving") : t("form.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
