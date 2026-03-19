import { useTranslation } from "react-i18next";
import { currencyService } from "@/core/currency/CurrencyService";
import { getFormatLocale } from "@/core/i18n/regionLocaleConfig";
import type { CustomersKPIs } from "../types";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat(getFormatLocale(), {
    style: "currency",
    currency: currencyService.getDefaultCurrency(),
    minimumFractionDigits: 2,
  }).format(n);

interface CustomersKPIBarProps {
  kpis: CustomersKPIs | null;
  loading?: boolean;
}

export function CustomersKPIBar({ kpis, loading }: CustomersKPIBarProps) {
  const { t } = useTranslation("customers");

  const items: { labelKey: string; value: string }[] = [
    {
      labelKey: "kpi.totalCustomers",
      value: kpis == null ? "\u2014" : String(kpis.customersCount),
    },
    {
      labelKey: "kpi.avgVisits",
      value: kpis == null ? "\u2014" : kpis.customersAverageTabs.toFixed(1),
    },
    {
      labelKey: "kpi.avgSpend",
      value: kpis == null ? "\u2014" : formatCurrency(kpis.customersAverageAmount),
    },
    {
      labelKey: "kpi.avgTicket",
      value:
        kpis == null ? "\u2014" : formatCurrency(kpis.customersAverageAmountPerTab),
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-stretch gap-6">
        {items.map(({ labelKey, value }) => (
          <div key={labelKey} className="flex min-w-0 flex-1 flex-col justify-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t(labelKey)}
            </div>
            {loading ? (
              <div className="mt-1 h-7 w-20 animate-pulse rounded bg-gray-200" />
            ) : (
              <div className="mt-1 text-lg font-semibold text-gray-900">{value}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
