import { useNavigate, useLocation } from "react-router-dom";
import {
  stepsWithState,
  useRestaurantReadinessForSetup,
  type SetupStepGroupId,
} from "../../core/setup/restaurantSetupSteps";

const GROUP_LABELS: Record<SetupStepGroupId, string> = {
  BASICS: "Restaurant basics",
  SERVICES: "Services & opening hours",
  PAYMENTS: "Payment methods & taxes",
  MENU: "Menu setup",
  PUBLISHING: "Publishing",
};

export function RestaurantSetupSidebar() {
  const readiness = useRestaurantReadinessForSetup();
  const steps = stepsWithState(readiness);
  const navigate = useNavigate();
  const location = useLocation();

  const grouped = steps.reduce<Record<SetupStepGroupId, typeof steps>>(
    (acc, step) => {
      (acc[step.group] ??= []).push(step);
      return acc;
    },
    {
      BASICS: [],
      SERVICES: [],
      PAYMENTS: [],
      MENU: [],
      PUBLISHING: [],
    }
  );

  return (
    <nav
      aria-label="Setup do restaurante"
      style={{
        width: 260,
        padding: "24px 16px",
        borderRight: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#111827",
          marginBottom: 4,
        }}
      >
        Configuração
      </div>
      {(
        ["BASICS", "SERVICES", "PAYMENTS", "MENU", "PUBLISHING"] as const
      ).map((groupId) => {
        const groupSteps = grouped[groupId];
        if (groupSteps.length === 0) return null;
        return (
          <div key={groupId}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#9ca3af",
                marginBottom: 4,
                paddingLeft: 8,
              }}
            >
              {GROUP_LABELS[groupId]}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {groupSteps.map((step) => {
                const isActive = location.pathname === step.route;
                const badge =
                  step.state === "RED" ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#b91c1c",
                        backgroundColor: "#fee2e2",
                        borderRadius: 999,
                        padding: "2px 8px",
                      }}
                    >
                      Requer atenção
                    </span>
                  ) : step.state === "GREEN" ? (
                    <span
                      aria-label="Pronto"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: "#22c55e",
                        display: "inline-block",
                      }}
                    />
                  ) : null;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => navigate(step.route)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "none",
                      backgroundColor: isActive ? "#eef2ff" : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      fontSize: 13,
                      color: "#111827",
                    }}
                  >
                    <span>{step.label}</span>
                    {badge}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

