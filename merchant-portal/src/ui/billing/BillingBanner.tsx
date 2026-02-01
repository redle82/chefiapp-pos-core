import { useGlobalUIState } from "../../context/GlobalUIStateContext";
import { colors } from "../design-system/tokens/colors";

export function BillingBanner() {
  const { billingStatus, isBillingBlocked, isBillingWarning } =
    useGlobalUIState();

  if (isBillingBlocked || !isBillingWarning) return null;

  const config = {
    past_due: {
      message:
        "Faturação Pendente: Por favor, regularize para evitar a suspensão do serviço.",
      color: colors.palette.amber[500],
      bg: "rgba(245, 158, 11, 0.15)",
      textColor: colors.palette.amber[400],
    },
    trial: {
      message: "Modo de Demonstração Activa. Explore o potencial do ChefIApp.",
      color: colors.palette.blue[500],
      bg: "rgba(59, 130, 246, 0.15)",
      textColor: colors.palette.blue[400],
    },
  };

  const current = config[billingStatus as keyof typeof config];
  if (!current) return null;

  return (
    <div
      style={{
        backgroundColor: current.bg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${current.color}44`,
        color: current.textColor,
        padding: "10px 20px",
        textAlign: "center",
        fontSize: "13px",
        width: "100%",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        transition: "all 0.3s ease",
      }}
    >
      <span style={{ fontWeight: 500, letterSpacing: "0.01em" }}>
        {current.message}
      </span>
      <button
        style={{
          border: `1px solid ${current.color}66`,
          background: "rgba(255, 255, 255, 0.05)",
          color: current.textColor,
          padding: "4px 12px",
          borderRadius: "100px",
          cursor: "pointer",
          fontSize: "11px",
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          transition: "background 0.2s",
        }}
        onMouseOver={(e) =>
          (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")
        }
        onClick={() => (window.location.href = "/app/billing")}
      >
        Gerir Conta
      </button>
    </div>
  );
}
