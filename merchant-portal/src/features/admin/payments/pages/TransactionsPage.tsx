import { useCallback, useEffect, useState } from "react";
import {
  getTransactions,
  getTransactionSummary,
} from "../services/paymentsService";
import type { TransactionSummary as SummaryType, TransactionsFilters as FiltersType } from "../types";
import { TransactionsFilters } from "../components/TransactionsFilters";
import { TransactionsKPIBar } from "../components/TransactionsKPIBar";
import { TransactionsTable } from "../components/TransactionsTable";
import type { Transaction } from "../types";

const DEFAULT_LOCATION_ID = "sofia-gastrobar-ibiza";

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<SummaryType | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (appliedFilters?: FiltersType) => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        getTransactions(DEFAULT_LOCATION_ID, appliedFilters),
        getTransactionSummary(DEFAULT_LOCATION_ID, appliedFilters),
      ]);
      setTransactions(list);
      setSummary(sum);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApplyFilters = useCallback(
    (f: FiltersType) => {
      load(f);
    },
    [load]
  );

  const handleViewDetail = useCallback((_id: string) => {
    // TODO: rota placeholder ou modal de detalhe
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">
          Transacciones procesadas
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Pagamentos processados pelos sistemas (Shop, LastPay, Reservas), sem
          dinheiro externo ou TPV de terceiros.
        </p>
      </header>

      <TransactionsFilters onApply={handleApplyFilters} loading={loading} />

      <TransactionsKPIBar summary={summary} loading={loading} />

      <TransactionsTable
        transactions={transactions}
        loading={loading}
        onViewDetail={handleViewDetail}
      />
    </div>
  );
}
