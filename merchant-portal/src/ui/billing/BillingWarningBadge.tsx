import { useGlobalUIState } from "../../context/GlobalUIStateContext";

export function BillingWarningBadge() {
  const { billingStatus } = useGlobalUIState();

  if (billingStatus !== "past_due" && billingStatus !== "trial") return null;

  const config = {
    past_due: { label: "Atraso", color: "#facc15", textColor: "#000" },
    trial: { label: "Trial", color: "#3b82f6", textColor: "#fff" },
  };

  const current = config[billingStatus as keyof typeof config];
  if (!current) return null;

  return (
    <span
      style={{
        backgroundColor: current.color,
        color: current.textColor,
        padding: "2px 6px",
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: "bold",
        textTransform: "uppercase",
        marginLeft: "8px",
      }}
    >
      {current.label}
    </span>
  );
}
