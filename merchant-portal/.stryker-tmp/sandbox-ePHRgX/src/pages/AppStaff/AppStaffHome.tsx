// @ts-nocheck
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../ui/design-system/tokens/colors";
import { useStaff } from "./context/StaffContext";

/** Design Contract v1: mesma cor de acção (dourado) que o dashboard. */
const actionAccent = colors.modes.dashboard.action;
import { useAppStaffHaptics } from "./hooks/useAppStaffHaptics";
import { getModeById } from "./routing/staffModeConfig";
import { canSeeMode } from "./visibility/appStaffVisibility";

/**
 * AppStaffHome — AppRootSurface. Shell manda no scroll. Home = tiles. Sem dashboard/portal.
 * Launcher em /app/staff/home. Contrato: docs/architecture/APPSTAFF_APPROOT_SURFACE_CONTRACT.md
 */
export const AppStaffHome: React.FC = () => {
  const navigate = useNavigate();
  const {
    shiftState,
    dominantTool,
    currentRiskLevel,
    pressureMode,
    tasks,
    activeRole,
  } = useStaff();
  const { triggerHaptic } = useAppStaffHaptics();

  const isShiftActive = shiftState === "active";

  type CardState = "disabled" | "idle" | "alert" | "active";

  const hasCriticalTasks = tasks.some(
    (t) =>
      (t.status === "pending" || t.status === "focused") &&
      (t.priority === "urgent" || t.priority === "critical"),
  );

  const modeCards = useMemo(
    () => [
      {
        id: "operation" as const,
        mode: getModeById("operation"),
        computeState: (): CardState => {
          if (!isShiftActive) return "disabled";
          if (pressureMode === "pressure" || currentRiskLevel > 0)
            return "alert";
          return "idle";
        },
      },
      {
        id: "turn" as const,
        mode: getModeById("turn"),
        computeState: (): CardState => {
          if (shiftState === "closing") return "alert";
          if (!isShiftActive) return "alert";
          return "idle";
        },
      },
      {
        id: "tpv" as const,
        mode: getModeById("tpv"),
        computeState: (): CardState => {
          if (!isShiftActive) return "disabled";
          if (dominantTool === "order") return "active";
          return "idle";
        },
      },
      {
        id: "kds" as const,
        mode: getModeById("kds"),
        computeState: (): CardState => {
          if (!isShiftActive) return "disabled";
          if (dominantTool === "production") return "active";
          return "idle";
        },
      },
      {
        id: "tasks" as const,
        mode: getModeById("tasks"),
        computeState: (): CardState => {
          if (!isShiftActive) return "disabled";
          if (dominantTool === "check") return "active";
          if (hasCriticalTasks) return "alert";
          return "idle";
        },
      },
      {
        id: "alerts" as const,
        mode: getModeById("alerts"),
        computeState: (): CardState => {
          if (!isShiftActive) return "disabled";
          return "idle";
        },
      },
    ],
    [
      isShiftActive,
      shiftState,
      dominantTool,
      pressureMode,
      currentRiskLevel,
      hasCriticalTasks,
    ],
  );

  const visibleModeCards = useMemo(
    () => modeCards.filter((c) => canSeeMode(activeRole, c.id)),
    [modeCards, activeRole],
  );

  const stateOrder: CardState[] = ["active", "alert", "idle", "disabled"];
  const orderedByState = useMemo(() => {
    return [...visibleModeCards]
      .map((item) => ({ item, state: item.computeState() }))
      .sort(
        (a, b) =>
          stateOrder.indexOf(a.state) - stateOrder.indexOf(b.state),
      );
  }, [visibleModeCards]);

  const activeBlock = orderedByState[0]?.state === "active" ? orderedByState[0] : null;
  const secondaryBlocks = activeBlock
    ? orderedByState.slice(1)
    : orderedByState;
  // Alias para compatibilidade com bundle/HMR que possa referir nome antigo
  const orderedCardsWithTier = secondaryBlocks;

  const getCardVisual = (state: CardState) => {
    switch (state) {
      case "disabled":
        return {
          bg: colors.surface.layer2,
          border: `1px solid ${colors.border.subtle}`,
          label: "",
          badgeBg: "transparent",
          badgeColor: colors.text.tertiary,
          opacity: 0.65,
        };
      case "alert":
        return {
          bg: colors.surface.layer1,
          border: `1px solid ${colors.warning.base}`,
          label: "!",
          badgeBg: "rgba(249, 115, 22, 0.12)",
          badgeColor: "#fb923c",
          opacity: 1,
        };
      case "active":
        return {
          bg: colors.surface.layer1,
          border: `1px solid ${actionAccent.base}`,
          label: "●",
          badgeBg: `${actionAccent.base}20`,
          badgeColor: actionAccent.base,
          opacity: 1,
        };
      case "idle":
      default:
        return {
          bg: colors.surface.layer1,
          border: `1px solid ${colors.border.subtle}`,
          label: "",
          badgeBg: "transparent",
          badgeColor: colors.text.tertiary,
          opacity: 1,
        };
    }
  };

  const handleCardClick = (modePath: string, state: CardState) => {
    if (state === "disabled") return;
    triggerHaptic("navigation");
    navigate(modePath);
  };

  const renderModeCard = (
    item: (typeof visibleModeCards)[number],
    state: CardState,
    isDominant: boolean,
  ) => {
    const { mode } = item;
    const visual = getCardVisual(state);

    // Estilo app: ícone grande ao centro, label por baixo; o tile é o ícone, não uma caixa vazia
    return (
      <button
        key={mode.id}
        type="button"
        className="staff-launcher-card"
        onClick={() => handleCardClick(mode.path, state)}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          minHeight: 0,
          padding: isDominant ? 16 : 12,
          borderRadius: isDominant ? 20 : 16,
          background: visual.bg,
          border:
            isDominant && state === "active"
              ? `2px solid ${actionAccent.base}`
              : visual.border,
          color: state === "disabled" ? colors.text.tertiary : colors.text.primary,
          textAlign: "center",
          cursor: state === "disabled" ? "default" : "pointer",
          opacity: visual.opacity,
          position: "relative",
          transition:
            "transform 0.12s ease-out, box-shadow 0.12s ease-out, border-color 0.12s ease-out, background-color 0.12s ease-out",
          boxShadow:
            state === "active"
              ? `0 0 0 1px ${actionAccent.base}40, 0 10px 20px rgba(0,0,0,0.45)`
              : isDominant
              ? "0 8px 18px rgba(0,0,0,0.45)"
              : "0 4px 12px rgba(0,0,0,0.35)",
        }}
      >
        {visual.label ? (
          <span
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              fontSize: 10,
              fontWeight: 700,
              width: 18,
              height: 18,
              borderRadius: "50%",
              backgroundColor: visual.badgeBg,
              color: visual.badgeColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {visual.label}
          </span>
        ) : null}
        <span
          style={{
            fontSize: isDominant ? 56 : 44,
            lineHeight: 1,
            marginBottom: 8,
          }}
          aria-hidden
        >
          {mode.icon}
        </span>
        <span
          style={{
            fontSize: isDominant ? 17 : 15,
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          {mode.label}
        </span>
      </button>
    );
  };

  // Layout de app: ícone = tile; grid denso; pouco padding; estilo launcher nativo
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        height: "100%",
        width: "100%",
        backgroundColor: colors.surface.base,
        padding: "10px 8px 8px",
        boxSizing: "border-box",
        gap: 8,
      }}
    >
      {activeBlock && (
        <div style={{ flexShrink: 0, width: "100%" }}>
          {renderModeCard(activeBlock.item, activeBlock.state, true)}
        </div>
      )}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gridTemplateRows: "repeat(3, minmax(0, 1fr))",
          gap: 8,
          width: "100%",
        }}
      >
        {orderedCardsWithTier.map(({ item, state }) =>
          renderModeCard(item, state, false),
        )}
      </div>
    </div>
  );
};
