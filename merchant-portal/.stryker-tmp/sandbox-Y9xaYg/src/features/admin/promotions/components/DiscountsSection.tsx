import { useState } from "react";
import {
  createOrUpdateDiscount,
  toggleDiscountActive,
} from "../services/promotionsService";
import type { Discount, NewDiscountInput } from "../types";
import { DiscountModal } from "./DiscountModal";
import { DiscountsTable } from "./DiscountsTable";

interface DiscountsSectionProps {
  locationId: string;
  discounts: Discount[];
  loadingDiscounts: boolean;
  onDiscountsUpdated: () => void;
}

export function DiscountsSection({
  locationId,
  discounts,
  loadingDiscounts,
  onDiscountsUpdated,
}: DiscountsSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);

  const handleNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (discount: Discount) => {
    setEditing(discount);
    setModalOpen(true);
  };

  const handleSave = async (input: NewDiscountInput) => {
    await createOrUpdateDiscount(locationId, input);
    onDiscountsUpdated();
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    await toggleDiscountActive(locationId, id, active);
    onDiscountsUpdated();
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
        loading={loadingDiscounts}
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

