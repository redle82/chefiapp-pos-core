import type { CustomersKPIs } from "../types";

const CURRENCY_FORMAT = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

interface CustomersKPIBarProps {
  kpis: CustomersKPIs | null;
  loading?: boolean;
}

const KPI_LABELS: { key: keyof CustomersKPIs; label: string; format: "number" | "currency" }[] = [
  { key: "customersCount", label: "Total de clientes", format: "number" },
  { key: "customersAverageTabs", label: "Média de contas por cliente", format: "number" },
  { key: "customersAverageAmount", label: "Ticket médio por cliente", format: "currency" },
  { key: "customersAverageAmountPerTab", label: "Ticket médio por conta", format: "currency" },
  { key: "customersAverageRating", label: "Avaliação média", format: "number" },
];

export function CustomersKPIBar({ kpis, loading }: CustomersKPIBarProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-stretch gap-6">
        {KPI_LABELS.map(({ key, label, format }) => {
          const raw = kpis == null ? null : kpis[key];
          const value =
            raw == null
              ? "—"
              : format === "currency"
                ? CURRENCY_FORMAT.format(raw as number)
                : typeof raw === "number"
                  ? key === "customersAverageTabs" || key === "customersAverageRating"
                    ? raw.toFixed(2)
                    : String(Math.round(raw))
                  : String(raw);
          return (
            <div
              key={key}
              className="flex min-w-0 flex-1 flex-col justify-center"
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {label}
              </div>
              {loading ? (
                <div className="mt-1 h-7 w-20 animate-pulse rounded bg-gray-200" />
              ) : (
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {value}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
