// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { getPayouts } from "../services/paymentsService";
import type { Payout, PayoutsFilters as PayoutsFiltersType } from "../types";
import { PayoutsFilters } from "../components/PayoutsFilters";
import { PayoutsTable } from "../components/PayoutsTable";

const DEFAULT_LOCATION_ID = "sofia-gastrobar-ibiza";

export function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (filters?: PayoutsFiltersType) => {
    setLoading(true);
    try {
      const list = await getPayouts(DEFAULT_LOCATION_ID, filters);
      setPayouts(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApplyFilters = useCallback(
    (f: PayoutsFiltersType) => {
      load(f);
    },
    [load]
  );

  const handleViewDetail = useCallback((_id: string) => {
    // TODO: rota placeholder ou modal de detalhe
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payouts"
        subtitle="Transferências agrupadas para a conta bancária do restaurante."
      />

      <PayoutsFilters onApply={handleApplyFilters} loading={loading} />

      <PayoutsTable
        payouts={payouts}
        loading={loading}
        onViewDetail={handleViewDetail}
      />
    </div>
  );
}
