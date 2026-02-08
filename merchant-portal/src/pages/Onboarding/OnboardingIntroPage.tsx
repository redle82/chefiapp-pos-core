/**
 * Onboarding 5min — Tela 0: Pré-Onboarding (intro).
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */

import { useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { ONBOARDING_5MIN_COPY } from "../../copy/onboarding5min";
import { Button, Card } from "../../ui/design-system/primitives";
import { colors } from "../../ui/design-system/tokens/colors";
import { spacing } from "../../ui/design-system/tokens/spacing";

export function OnboardingIntroPage() {
  const navigate = useNavigate();

  return (
    <div
      data-onboarding-step="0"
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
      <OnboardingStepIndicator step={1} total={9} />
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            fontSize: 24,
            marginBottom: spacing[4],
            color: colors.text.primary,
            textAlign: "center",
          }}
        >
          {ONBOARDING_5MIN_COPY.intro.headline}
        </h1>
        <ul
          style={{
            color: colors.text.secondary,
            marginBottom: spacing[6],
            paddingLeft: spacing[5],
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          {ONBOARDING_5MIN_COPY.intro.bullets.map((b, i) => (
            <li key={i} style={{ marginBottom: spacing[2] }}>
              {b}
            </li>
          ))}
        </ul>
        <Card padding="lg" style={{ marginBottom: spacing[6] }}>
          <Button
            type="button"
            tone="success"
            variant="solid"
            size="lg"
            onClick={() => navigate("/onboarding/identity")}
            style={{ width: "100%" }}
          >
            {ONBOARDING_5MIN_COPY.intro.cta}
          </Button>
        </Card>
      </div>
    </div>
  );
}
