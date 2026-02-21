// @ts-nocheck
import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useCoreHealth } from "../../core/health";
import { isDevStableMode } from "../../core/runtime/devStableMode";

type BadgeStatus = "active" | "unstable" | "offline" | "checking";

const TOOLTIPS: Record<BadgeStatus, string> = {
  active: "Backend operacional conectado.",
  unstable: "Ligação instável. Algumas ações podem falhar.",
  offline: "Servidor operacional offline. Inicie o Docker Core.",
  checking: "A verificar ligação ao servidor.",
};

const LABELS: Record<BadgeStatus, string> = {
  active: "Core ativo",
  unstable: "Core instável",
  offline: "Core offline",
  checking: "A verificar…",
};

const ICONS: Record<BadgeStatus, string> = {
  active: "🟢",
  unstable: "🟡",
  offline: "🔴",
  checking: "🟡",
};

/**
 * CoreStatusBadge — Indicador discreto de estado do Core na sidebar.
 * Sem navegação, sem rota, sem tela; apenas indicador + tooltip.
 * Fonte: coreReachable (RestaurantRuntime) + useCoreHealth (UP/DEGRADED/DOWN/UNKNOWN).
 */
export function CoreStatusBadge() {
  const { runtime } = useRestaurantRuntime();
  const devStable = isDevStableMode();
  const { status: healthStatus, check } = useCoreHealth({
    autoStart: !devStable,
    pollInterval: 60000,
    downPollInterval: 30000,
  });

  const [showTooltip, setShowTooltip] = useState(false);
  const coreReachable = runtime.coreReachable ?? true;

  // Primeiro check logo ao montar para o badge ficar verde o mais cedo possível
  useEffect(() => {
    if (!devStable && coreReachable) check();
  }, [devStable, coreReachable, check]);

  // Mapeamento de contrato:
  // - UP + coreReachable        → active (🟢)
  // - DEGRADED                  → unstable (🟡)
  // - DOWN/UNKNOWN ou !reachable → offline (🔴)
  let badgeStatus: BadgeStatus = "offline";
  if (coreReachable) {
    if (healthStatus === "UP") {
      badgeStatus = "active";
    } else if (healthStatus === "DEGRADED") {
      badgeStatus = "unstable";
    } else {
      badgeStatus = "offline";
    }
  }

  const tooltip = TOOLTIPS[badgeStatus];
  const label = LABELS[badgeStatus];
  const icon = ICONS[badgeStatus];

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 8,
        fontSize: 12,
        color: "var(--sidebar-fg, #a3a3a3)",
        backgroundColor: "var(--sidebar-bg-badge, rgba(255,255,255,0.05))",
        border: "1px solid var(--sidebar-border, rgba(255,255,255,0.08))",
        cursor: "default",
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      role="status"
      aria-label={label}
      title={tooltip}
    >
      <span aria-hidden="true">{icon}</span>
      <span style={{ fontWeight: 500 }}>{label}</span>
      {showTooltip && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%) translateY(-6px)",
            padding: "6px 10px",
            fontSize: 11,
            color: "#e5e5e5",
            backgroundColor: "#262626",
            border: "1px solid #404040",
            borderRadius: 6,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 1000,
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}
