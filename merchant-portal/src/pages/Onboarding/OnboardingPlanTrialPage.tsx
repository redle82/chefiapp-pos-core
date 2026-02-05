/**
 * Onboarding 5min — Tela 7: Plano & Trial (trial ativo, limites; "Escolher plano depois" / "Ver planos").
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */

import { useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { ONBOARDING_5MIN_COPY } from "../../copy/onboarding5min";
import { Button, Card } from "../../ui/design-system/primitives";
import { colors } from "../../ui/design-system/tokens/colors";
import { spacing } from "../../ui/design-system/tokens/spacing";

export function OnboardingPlanTrialPage() {
  const navigate = useNavigate();

  return (
    <div
      data-onboarding-step="7"
      style={{
        background: colors.surface.base,
        minHeight: "100vh",
        color: colors.text.primary,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: `0 ${spacing[6]} ${spacing[6]} ${spacing[6]}`,
      }}
    >
      <OnboardingStepIndicator step={8} total={9} />
      <div
        style={{
          maxWidth: 400,
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            fontSize: 22,
            marginBottom: spacing[4],
            color: colors.text.primary,
          }}
        >
          {ONBOARDING_5MIN_COPY.planTrial.headline}
        </h1>
        <p
          style={{
            color: colors.text.secondary,
            marginBottom: spacing[6],
            fontSize: 14,
          }}
        >
          O teu trial está ativo. Podes escolher um plano quando quiseres; até lá, usa o sistema à vontade.
        </p>
        <Card padding="lg" style={{ marginBottom: spacing[6] }}>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
            <Button
              type="button"
              tone="neutral"
              variant="outline"
              onClick={() => navigate("/app/billing")}
            >
              Ver planos
            </Button>
          </div>
        </Card>
        <div style={{ display: "flex", gap: spacing[4], justifyContent: "flex-end" }}>
          <Button type="button" tone="neutral" variant="outline" onClick={() => navigate("/onboarding/tpv-preview")}>
            Voltar
          </Button>
          <Button type="button" tone="success" variant="solid" onClick={() => navigate("/onboarding/ritual-open")}>
            {ONBOARDING_5MIN_COPY.planTrial.cta}
          </Button>
        </div>
      </div>
    </div>
  );
}
