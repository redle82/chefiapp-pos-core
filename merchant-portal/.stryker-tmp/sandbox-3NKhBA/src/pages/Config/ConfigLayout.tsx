/**
 * ConfigLayout - Layout Principal do Config Tree
 *
 * Layout com sidebar fixa + conteúdo dinâmico.
 * Visual: Restaurant OS Design System (dark-first, core-design-system).
 */
// @ts-nocheck


import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  radius,
  space,
  tapTarget,
} from "@chefiapp/core-design-system";
import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { ConfigSidebar } from "../../components/config/ConfigSidebar";
import { ManagementAdvisor } from "../../components/onboarding/ManagementAdvisor";
import { OnboardingProvider } from "../../context/OnboardingContext";

const MODULE_LABELS: Record<string, string> = {
  tpv: "TPV",
  kds: "KDS",
  menu: "Cardápio",
  appstaff: "App Staff",
};

function ConfigContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromModule = searchParams.get("from");
  const moduleLabel = fromModule
    ? MODULE_LABELS[fromModule] ?? fromModule
    : null;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: fontFamily.sans,
      }}
    >
      <ConfigSidebar />

      <div
        style={{
          marginLeft: "280px",
          flex: 1,
          padding: space.lg,
          backgroundColor: colors.background,
          color: colors.textPrimary,
        }}
      >
        {moduleLabel && (
          <div
            style={{
              marginBottom: space.lg,
              padding: "14px 18px",
              borderRadius: radius.md,
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <span
              style={{
                fontSize: `${fontSize.sm}px`,
                color: colors.textSecondary,
              }}
            >
              Para usar o{" "}
              <strong style={{ color: colors.textPrimary }}>
                {moduleLabel}
              </strong>
              , ative-o no Dashboard.
            </span>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              style={{
                padding: "12px 24px",
                minHeight: tapTarget.min,
                fontSize: `${fontSize.sm}px`,
                fontWeight: fontWeight.semibold,
                color: colors.textInverse,
                backgroundColor: colors.accent,
                border: "none",
                borderRadius: radius.md,
                cursor: "pointer",
              }}
            >
              Ir ao Dashboard
            </button>
          </div>
        )}
        <Outlet />
      </div>
    </div>
  );
}

export function ConfigLayout() {
  return (
    <ManagementAdvisor>
      <OnboardingProvider>
        <ConfigContent />
      </OnboardingProvider>
    </ManagementAdvisor>
  );
}
