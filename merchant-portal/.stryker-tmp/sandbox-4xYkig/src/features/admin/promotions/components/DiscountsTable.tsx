import type { Discount } from "../types";
import { DiscountRow } from "./DiscountRow";

interface DiscountsTableProps {
  discounts: Discount[];
  loading?: boolean;
  onToggleActive?: (id: string, active: boolean) => void;
  onEdit?: (discount: Discount) => void;
}

const HEADERS = ["Nome", "Descrição", "Tipo", "Valor", "Estado", "Ações"];

export function DiscountsTable({
  discounts,
  loading,
  onToggleActive,
  onEdit,
}: DiscountsTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded bg-gray-100"
                aria-hidden
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (discounts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-sm">
        Ainda não há descontos configurados.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {discounts.map((discount) => (
              <DiscountRow
                key={discount.id}
                discount={discount}
                onToggleActive={onToggleActive}
                onEdit={onEdit}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

