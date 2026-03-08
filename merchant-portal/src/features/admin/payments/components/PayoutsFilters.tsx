import { useCurrency } from "@/core/currency/useCurrency";
import { useState } from "react";
import type { PayoutsFilters as PayoutsFiltersType } from "../types";

const PERIOD_OPTIONS = [
  { value: "last_7_days", label: "Últimos 7 días" },
  { value: "last_30_days", label: "Últimos 30 días" },
  { value: "last_90_days", label: "Últimos 90 días" },
] as const;

interface PayoutsFiltersProps {
  onApply: (filters: PayoutsFiltersType) => void;
  loading?: boolean;
}

export function PayoutsFilters({ onApply, loading }: PayoutsFiltersProps) {
  const { symbol } = useCurrency();
  const [period, setPeriod] = useState<string>(PERIOD_OPTIONS[0].value);
  const [amountMin, setAmountMin] = useState<string>("");
  const [amountMax, setAmountMax] = useState<string>("");

  const handleApply = () => {
    onApply({
      period,
      amountMin: amountMin ? Number(amountMin) : undefined,
      amountMax: amountMax ? Number(amountMax) : undefined,
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="po-period"
          className="text-xs font-medium text-gray-600"
        >
          Período
        </label>
        <select
          id="po-period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          aria-label="Período"
        >
          {PERIOD_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="po-amount-min"
          className="text-xs font-medium text-gray-600"
        >
          {`Desde (${symbol})`}
        </label>
        <input
          id="po-amount-min"
          type="number"
          min={0}
          step={0.01}
          value={amountMin}
          onChange={(e) => setAmountMin(e.target.value)}
          placeholder="0"
          className="w-28 rounded-lg border border-gray-300 py-2 px-3 text-sm text-gray-700 placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          aria-label="Valor mínimo"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="po-amount-max"
          className="text-xs font-medium text-gray-600"
        >
          {`Hasta (${symbol})`}
        </label>
        <input
          id="po-amount-max"
          type="number"
          min={0}
          step={0.01}
          value={amountMax}
          onChange={(e) => setAmountMax(e.target.value)}
          placeholder="—"
          className="w-28 rounded-lg border border-gray-300 py-2 px-3 text-sm text-gray-700 placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          aria-label="Valor máximo"
        />
      </div>
      <button
        type="button"
        onClick={handleApply}
        disabled={loading}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
      >
        Aplicar
      </button>
    </div>
  );
}
