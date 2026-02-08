interface KpiCardProps {
  label: string;
  value: number;
  variant?: "number" | "currency";
  loading?: boolean;
  onClick?: () => void;
}

export function KpiCard({
  label,
  value,
  variant = "number",
  loading,
  onClick,
}: KpiCardProps) {
  const formatted =
    variant === "currency"
      ? new Intl.NumberFormat("es-ES", {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: 2,
        }).format(value)
      : value.toString();

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      style={{
        flex: 1,
        padding: "12px 12px 12px 0",
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#9ca3af",
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      {loading ? (
        <div
          style={{
            width: 64,
            height: 18,
            borderRadius: 999,
            backgroundColor: "#e5e7eb",
          }}
        />
      ) : (
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#111827",
          }}
        >
          {formatted}
        </div>
      )}
    </div>
  );
}

