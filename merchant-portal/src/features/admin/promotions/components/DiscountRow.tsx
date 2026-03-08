import { useCurrency } from "@/core/currency/useCurrency";
import type { Discount, DiscountType } from "../types";

const TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: "% sobre o total",
  FIXED: "Valor fixo",
};

const TYPE_BADGE_CLASS: Record<DiscountType, string> = {
  PERCENTAGE: "bg-blue-100 text-blue-800",
  FIXED: "bg-emerald-100 text-emerald-800",
};

interface DiscountRowProps {
  discount: Discount;
  onToggleActive?: (id: string, active: boolean) => void;
  onEdit?: (discount: Discount) => void;
}

export function DiscountRow({
  discount,
  onToggleActive,
  onEdit,
}: DiscountRowProps) {
  const { symbol } = useCurrency();
  return (
    <tr className="border-b border-gray-100 transition-colors hover:bg-gray-50">
      <td className="py-3 pl-4 pr-2 text-sm text-gray-900">{discount.name}</td>
      <td className="py-3 px-2 text-sm text-gray-600">
        {discount.description || "—"}
      </td>
      <td className="py-3 px-2 text-sm">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            TYPE_BADGE_CLASS[discount.type]
          }`}
        >
          {TYPE_LABELS[discount.type]}
        </span>
      </td>
      <td className="py-3 px-2 text-sm text-gray-900">
        {discount.type === "PERCENTAGE"
          ? `${discount.value.toFixed(1)} %`
          : `${discount.value.toFixed(2)} ${symbol}`}
      </td>
      <td className="py-3 px-2 text-sm">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            discount.active
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {discount.active ? "Ativo" : "Inativo"}
        </span>
      </td>
      <td className="py-3 pr-4 pl-2">
        <div className="flex gap-3">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(discount)}
              className="text-xs font-medium text-violet-600 hover:underline"
            >
              Editar
            </button>
          )}
          {onToggleActive && (
            <button
              type="button"
              onClick={() => onToggleActive(discount.id, !discount.active)}
              className="text-xs font-medium text-gray-600 hover:underline"
            >
              {discount.active ? "Desativar" : "Ativar"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
