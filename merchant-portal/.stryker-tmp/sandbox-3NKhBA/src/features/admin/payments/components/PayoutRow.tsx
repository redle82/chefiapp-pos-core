// @ts-nocheck
import type { Payout } from "../types";

const CURRENCY = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const DATE = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const STATUS_LABELS: Record<Payout["status"], string> = {
  SENT: "Enviado",
  PENDING: "Pendiente",
};

const STATUS_BADGE_CLASS: Record<Payout["status"], string> = {
  SENT: "bg-green-100 text-green-800",
  PENDING: "bg-amber-100 text-amber-800",
};

interface PayoutRowProps {
  payout: Payout;
  onViewDetail?: (id: string) => void;
}

export function PayoutRow({ payout, onViewDetail }: PayoutRowProps) {
  const periodStr = `${DATE.format(new Date(payout.periodStart))} — ${DATE.format(new Date(payout.periodEnd))}`;
  const createdAtStr = DATE.format(new Date(payout.createdAt));

  return (
    <tr className="border-b border-gray-100 transition-colors hover:bg-gray-50">
      <td className="py-3 pl-4 pr-2 text-sm text-gray-600">{periodStr}</td>
      <td className="py-3 px-2 text-sm font-medium text-gray-900">
        {CURRENCY.format(payout.amount)}
      </td>
      <td className="py-3 px-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[payout.status]}`}
        >
          {STATUS_LABELS[payout.status]}
        </span>
      </td>
      <td className="py-3 px-2 text-sm text-gray-600">{createdAtStr}</td>
      <td className="py-3 pr-4 pl-2">
        {onViewDetail && (
          <button
            type="button"
            onClick={() => onViewDetail(payout.id)}
            className="text-xs font-medium text-violet-600 hover:underline"
          >
            Ver detalhe
          </button>
        )}
      </td>
    </tr>
  );
}
