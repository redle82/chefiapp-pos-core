import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface LoyaltyPointsPerOrderCardProps {
  value: number;
  loading?: boolean;
  onSave: (value: number) => Promise<void> | void;
}

export function LoyaltyPointsPerOrderCard({
  value,
  loading,
  onSave,
}: LoyaltyPointsPerOrderCardProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState<string>(String(value ?? 0));
  const [saving, setSaving] = useState(false);
  const [savedAtLeastOnce, setSavedAtLeastOnce] = useState(false);

  useEffect(() => {
    setInputValue(String(value ?? 0));
  }, [value]);

  const handleSave = async () => {
    const numeric = Number(inputValue || 0);
    setSaving(true);
    try {
      await onSave(numeric);
      setSavedAtLeastOnce(true);
      setTimeout(() => setSavedAtLeastOnce(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const disabled = loading || saving;

  return (
    <section className="flex-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <header className="mb-3">
        <h2 className="text-sm font-semibold text-gray-900">
          Puntos por cuenta
        </h2>
        <p className="mt-1 text-xs text-gray-600">
          Pontos fixos atribuídos por cada conta/mesa fechada, independentemente
          do valor.
        </p>
        <p className="mt-1 text-[11px] text-gray-500">
          1 conta equivale a:&nbsp;
          <span className="font-semibold text-gray-800">N pontos</span>
        </p>
      </header>

      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="points-per-order"
            className="text-xs font-medium text-gray-600"
          >
            Pontos por conta
          </label>
          <input
            id="points-per-order"
            type="number"
            min={0}
            step={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-28 rounded-lg border border-gray-300 py-2 px-3 text-sm text-gray-700 placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        >
          {saving ? t("common:saving") : t("common:save")}
        </button>
        {savedAtLeastOnce && (
          <span className="text-xs text-green-600">Guardado</span>
        )}
      </div>
    </section>
  );
}
