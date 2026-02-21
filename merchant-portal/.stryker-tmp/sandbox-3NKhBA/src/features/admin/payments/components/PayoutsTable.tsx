// @ts-nocheck
import type { Payout } from "../types";
import { PaymentsEmptyState } from "./PaymentsEmptyState";
import { PayoutRow } from "./PayoutRow";

interface PayoutsTableProps {
  payouts: Payout[];
  loading?: boolean;
  onViewDetail?: (id: string) => void;
}

const HEADERS = [
  "Período",
  "Valor transferido",
  "Estado",
  "Data de criação",
  "Ações",
];

export function PayoutsTable({
  payouts,
  loading,
  onViewDetail,
}: PayoutsTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded bg-gray-100"
                aria-hidden
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (payouts.length === 0) {
    return (
      <PaymentsEmptyState
        title="Aún no hay payouts"
        description="Las transferencias agrupadas a tu cuenta bancaria aparecerán aquí."
      />
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
            {payouts.map((p) => (
              <PayoutRow key={p.id} payout={p} onViewDetail={onViewDetail} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
