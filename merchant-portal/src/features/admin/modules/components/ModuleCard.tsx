/**
 * ModuleCard — Card reutilizável para o Hub Módulos.
 * Ref: plano página_mis_productos_módulos. Ícone, nome, descrição, badge, botões.
 */

import { useTranslation } from "react-i18next";
import type { Module, ModuleStatus } from "../types";

/** Badge style keys — label resolved via i18n at render time */
const BADGE_STYLES: Record<
  ModuleStatus,
  { bg: string; color: string; labelKey: string } | null
> = {
  active: {
    bg: "var(--status-success-bg)",
    color: "var(--status-success-text)",
    labelKey: "modules.badgeActive",
  },
  needs_setup: {
    bg: "var(--status-warning-bg)",
    color: "var(--status-warning-text)",
    labelKey: "modules.badgeConfigure",
  },
  locked: {
    bg: "var(--surface-overlay)",
    color: "var(--text-secondary)",
    labelKey: "modules.badgeUnavailable",
  },
  inactive: null,
};

const PRIMARY_LABEL_KEYS: Record<string, string> = {
  Activate: "modules.actionActivate",
  Configure: "modules.actionConfigure",
  Open: "modules.actionOpen",
  Upgrade: "modules.actionUpgrade",
};

interface ModuleCardProps {
  module: Module;
  onPrimaryAction?: (id: string) => void;
  onSecondaryAction?: (id: string) => void;
  /** Override da label do botão secundário (ex: "Instalar dispositivo" em vez de "Desactivar") */
  secondaryLabel?: string;
}

export function ModuleCard({
  module,
  onPrimaryAction,
  onSecondaryAction,
  secondaryLabel,
}: ModuleCardProps) {
  const { t } = useTranslation("sidebar");
  const badge = BADGE_STYLES[module.status];
  const primaryLabel = t(
    PRIMARY_LABEL_KEYS[module.primaryAction] ?? module.primaryAction,
  );
  const showSecondary =
    module.secondaryAction &&
    (module.status === "active" || module.status === "needs_setup");

  const cardStyle = {
    backgroundColor: "var(--card-bg-on-dark)",
    borderRadius: 10,
    border: "1px solid var(--surface-border)",
    padding: 14,
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
    minHeight: 0,
  };
  const headerStyle = {
    display: "flex" as const,
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  };
  const iconNameStyle = {
    display: "flex" as const,
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  };
  const descStyle = {
    margin: 0,
    fontSize: 12,
    color: "var(--text-secondary)",
    lineHeight: 1.4,
  };
  const depsStyle = {
    margin: 0,
    fontSize: 11,
    color: "var(--text-tertiary)",
  };
  const actionsStyle = {
    display: "flex" as const,
    alignItems: "center",
    gap: 8,
    marginTop: "auto",
  };
  const btnPrimaryStyle = {
    padding: "6px 14px",
    borderRadius: 6,
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    backgroundColor: "var(--color-primary)",
    color: "var(--text-inverse)",
  };
  const btnSecondaryStyle = {
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid var(--surface-border)",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
  };
  const btnLockedStyle = {
    ...btnPrimaryStyle,
    backgroundColor: "var(--text-tertiary)",
    cursor: "default",
  };

  return (
    <section
      style={cardStyle}
      aria-labelledby={`module-${module.id}-name`}
      data-module-id={module.id}
    >
      <div style={headerStyle}>
        <div style={iconNameStyle}>
          <span style={{ fontSize: 20 }} aria-hidden>
            {module.icon}
          </span>
          <h3
            id={`module-${module.id}-name`}
            style={{
              fontSize: 14,
              fontWeight: 600,
              margin: 0,
              color: "var(--text-primary)",
            }}
          >
            {module.name}
          </h3>
        </div>
        {badge && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 999,
              backgroundColor: badge.bg,
              color: badge.color,
              flexShrink: 0,
            }}
          >
            {t(badge.labelKey)}
          </span>
        )}
      </div>
      <p style={descStyle}>{module.description}</p>
      {module.dependencies && module.dependencies.length > 0 && (
        <p style={depsStyle}>
          {t("modules.requires", { deps: module.dependencies.join(", ") })}
        </p>
      )}
      <div style={actionsStyle}>
        <button
          type="button"
          onClick={() => onPrimaryAction?.(module.id)}
          style={module.status === "locked" ? btnLockedStyle : btnPrimaryStyle}
          disabled={module.status === "locked"}
        >
          {primaryLabel}
        </button>
        {showSecondary && (
          <button
            type="button"
            onClick={() => onSecondaryAction?.(module.id)}
            style={btnSecondaryStyle}
          >
            {secondaryLabel ?? t("modules.actionDeactivate")}
          </button>
        )}
      </div>
    </section>
  );
}
