/**
 * OrderModeSelector — Segmented tab bar: Take away / Dine in / Delivery.
 * Ref: white pill on selected, border outline on unselected.
 */

export type OrderMode = "take_away" | "dine_in" | "delivery";

const MODES: { id: OrderMode; label: string }[] = [
  { id: "take_away", label: "Take away" },
  { id: "dine_in", label: "Dine in" },
  { id: "delivery", label: "Delivery" },
];

interface OrderModeSelectorProps {
  value: OrderMode;
  onChange: (mode: OrderMode) => void;
}

export function OrderModeSelector({ value, onChange }: OrderModeSelectorProps) {
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
      {MODES.map(({ id, label }) => {
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
            {label}
          </button>
        );
      })}
    </div>
  );
}
