/**
 * OrderModeSelector — Modo do pedido: Take away, Dine in, Delivery.
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
        gap: 8,
        marginBottom: 16,
      }}
    >
      {MODES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            backgroundColor: value === id ? "var(--color-primary, #c9a227)" : "var(--surface-elevated, #262626)",
            color: value === id ? "var(--text-inverse, #1a1a1a)" : "var(--text-secondary, #a3a3a3)",
            fontWeight: value === id ? 600 : 400,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
