import { useCallback, useEffect, useState } from "react";
import {
  createOrUpdateDiscount,
  getDiscounts,
  toggleDiscountActive,
} from "../services/promotionsService";
import type { Discount, NewDiscountInput } from "../types";
import { DiscountModal } from "./DiscountModal";
import { DiscountsTable } from "./DiscountsTable";

interface DiscountsSectionProps {
  locationId: string;
}

export function DiscountsSection({ locationId }: DiscountsSectionProps) {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getDiscounts(locationId);
      setDiscounts(list);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (discount: Discount) => {
    setEditing(discount);
    setModalOpen(true);
  };

  const handleSave = async (input: NewDiscountInput) => {
    const saved = await createOrUpdateDiscount(locationId, input);
    setDiscounts((current) => {
      const idx = current.findIndex((d) => d.id === saved.id);
      if (idx >= 0) {
        const copy = [...current];
        copy[idx] = saved;
        return copy;
      }
      return [...current, saved];
    });
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    await toggleDiscountActive(locationId, id, active);
    setDiscounts((current) =>
      current.map((d) => (d.id === id ? { ...d, active } : d))
    );
  };

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Descuentos
          </h2>
          <p className="mt-1 text-xs text-gray-600">
            Defina descontos manuais que podem ser aplicados no TPV pelos
            operadores.
          </p>
        </div>
        <button
          type="button"
          onClick={handleNew}
          className="inline-flex items-center rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        >
          <span className="mr-1 text-base leading-none">+</span> Novo desconto
        </button>
      </header>

      <DiscountsTable
        discounts={discounts}
        loading={loading}
        onToggleActive={handleToggleActive}
        onEdit={handleEdit}
      />

      <DiscountModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </section>
  );
}

