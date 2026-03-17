/**
 * OrderModeSelector — Segmented tab bar: Take away / Dine in / Delivery.
 * Ref: white pill on selected, border outline on unselected.
 */

import { useTranslation } from "react-i18next";

export type OrderMode = "dine_in" | "counter" | "take_away" | "delivery";

const MODE_IDS: OrderMode[] = ["dine_in", "counter", "take_away", "delivery"];

const MODE_KEYS: Record<OrderMode, string> = {
  dine_in: "orderMode.dineIn",
  counter: "orderMode.counter",
  take_away: "orderMode.takeAway",
  delivery: "orderMode.delivery",
};

interface OrderModeSelectorProps {
  value: OrderMode;
  onChange: (mode: OrderMode) => void;
}

export function OrderModeSelector({ value, onChange }: OrderModeSelectorProps) {
  const { t } = useTranslation("tpv");

  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        padding: 3,
        borderRadius: 12,
        backgroundColor: "#1a1a1a",
      }}
    >
      {MODE_IDS.map((id) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 10,
              border: active ? "none" : "1px solid rgba(255,255,255,0.08)",
              backgroundColor: active ? "#fff" : "transparent",
              color: active ? "#0a0a0a" : "#737373",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {t(MODE_KEYS[id])}
          </button>
        );
      })}
    </div>
  );
}
