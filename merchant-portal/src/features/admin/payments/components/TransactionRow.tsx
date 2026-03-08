import { currencyService } from "@/core/currency/CurrencyService";
import { getFormatLocale } from "@/core/i18n/regionLocaleConfig";
import type { Transaction, TransactionStatus } from "../types";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat(getFormatLocale(), {
    style: "currency",
    currency: currencyService.getDefaultCurrency(),
  }).format(n);

const formatDateTime = (d: Date) =>
  new Intl.DateTimeFormat(getFormatLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);

const METHOD_LABELS: Record<Transaction["method"], string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  ONLINE: "Online",
  WALLET: "Monedero",
  OTHER: "Otro",
};

const CHANNEL_LABELS: Record<Transaction["channel"], string> = {
  POS: "TPV",
  QR: "QR",
  DELIVERY: "Delivery",
  RESERVATION: "Reserva",
};

const STATUS_LABELS: Record<TransactionStatus, string> = {
  PROCESSED: "Pago",
  PENDING: "Pendiente",
  REFUNDED: "Reembolsado",
  FAILED: "Falhou",
};

const STATUS_BADGE_CLASS: Record<TransactionStatus, string> = {
  PROCESSED: "bg-green-100 text-green-800",
  PENDING: "bg-amber-100 text-amber-800",
  REFUNDED: "bg-red-100 text-red-800",
  FAILED: "bg-gray-100 text-gray-800",
};

interface TransactionRowProps {
  transaction: Transaction;
  onViewDetail?: (id: string) => void;
}

export function TransactionRow({
  transaction,
  onViewDetail,
}: TransactionRowProps) {
  const dateStr = formatDateTime(new Date(transaction.createdAt));

  return (
    <tr className="border-b border-gray-100 transition-colors hover:bg-gray-50">
      <td className="py-3 pl-4 pr-2 text-sm text-gray-600">{dateStr}</td>
      <td className="py-3 px-2 text-sm text-gray-600">
        {transaction.orderId ?? "—"}
      </td>
      <td className="py-3 px-2 text-sm text-gray-600">
        {METHOD_LABELS[transaction.method]}
      </td>
      <td className="py-3 px-2 text-sm text-gray-600">
        {CHANNEL_LABELS[transaction.channel]}
      </td>
      <td className="py-3 px-2 text-sm font-medium text-gray-900">
        {formatCurrency(transaction.amount)}
      </td>
      <td className="py-3 px-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            STATUS_BADGE_CLASS[transaction.status]
          }`}
        >
          {STATUS_LABELS[transaction.status]}
        </span>
      </td>
      <td className="py-3 pr-4 pl-2">
        {onViewDetail && (
          <button
            type="button"
            onClick={() => onViewDetail(transaction.id)}
            className="text-xs font-medium text-violet-600 hover:underline"
          >
            Ver detalhe
          </button>
        )}
      </td>
    </tr>
  );
}
