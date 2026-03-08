import { currencyService } from "@/core/currency/CurrencyService";
import { getFormatLocale } from "@/core/i18n/regionLocaleConfig";
import type { TransactionSummary } from "../types";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat(getFormatLocale(), {
    style: "currency",
    currency: currencyService.getDefaultCurrency(),
  }).format(n);

interface TransactionsKPIBarProps {
  summary: TransactionSummary | null;
  loading?: boolean;
}

export function TransactionsKPIBar({
  summary,
  loading,
}: TransactionsKPIBarProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
            aria-hidden
          />
        ))}
      </div>
    );
  }

  const count = summary?.count ?? 0;
  const totalReceived = summary?.totalReceived ?? 0;
  const totalRefunded = summary?.totalRefunded ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-600">
          Número de transacciones
        </p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{count}</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-600">Total recibido</p>
        <p className="mt-1 text-2xl font-semibold text-green-700">
          {formatCurrency(totalReceived)}
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-600">Total reembolsado</p>
        <p className="mt-1 text-2xl font-semibold text-red-700">
          {formatCurrency(totalRefunded)}
        </p>
      </div>
    </div>
  );
}
