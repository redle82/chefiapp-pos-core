/**
 * Onboarding 5min — Tela 4: Turno & Caixa (conceitual). Valor padrão sugerido para abertura de turnos; não abre turno.
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { setDefaultOpeningCashCents } from "../../core/storage/shiftDefaultsStorage";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { ONBOARDING_5MIN_COPY } from "../../copy/onboarding5min";
import { Button, Card } from "../../ui/design-system/primitives";
import { colors } from "../../ui/design-system/tokens/colors";
import { spacing } from "../../ui/design-system/tokens/spacing";

const OPENING_OPTIONS = [0, 50, 100] as const;

export function OnboardingShiftSetupPage() {
  const navigate = useNavigate();
  const [openingEur, setOpeningEur] = useState<number>(0);

  const handleNext = () => {
    const restaurantId =
      getTabIsolated("chefiapp_restaurant_id") ??
      (typeof window !== "undefined" ? window.localStorage.getItem("chefiapp_restaurant_id") : null);
    if (restaurantId) {
      setDefaultOpeningCashCents(restaurantId, openingEur * 100);
    }
    navigate("/onboarding/products");
  };

  return (
    <div
      data-onboarding-step="4"
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
      <OnboardingStepIndicator step={5} total={9} />
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
            marginBottom: spacing[2],
            color: colors.text.primary,
          }}
        >
          {ONBOARDING_5MIN_COPY.shiftSetup.headline}
        </h1>
        <p
          style={{
            color: colors.text.secondary,
            marginBottom: spacing[6],
            fontSize: 14,
          }}
        >
          {ONBOARDING_5MIN_COPY.shiftSetup.description}
        </p>
        <Card padding="lg" style={{ marginBottom: spacing[6] }}>
          <div style={{ marginBottom: spacing[4] }}>
            <div style={{ fontSize: 14, marginBottom: spacing[2], color: colors.text.secondary }}>
              {ONBOARDING_5MIN_COPY.shiftSetup.openingLabel}
            </div>
            <div style={{ display: "flex", gap: spacing[2] }}>
              {OPENING_OPTIONS.map((eur) => (
                <button
                  key={eur}
                  type="button"
                  onClick={() => setOpeningEur(eur)}
                  style={{
                    padding: spacing[2] + " " + spacing[4],
                    borderRadius: 8,
                    border: openingEur === eur ? "2px solid var(--color-action-base)" : "1px solid rgba(255,255,255,0.2)",
                    background: openingEur === eur ? "rgba(10,132,255,0.2)" : colors.surface.layer1,
                    color: colors.text.primary,
                    cursor: "pointer",
                  }}
                >
                  {eur} €
                </button>
              ))}
            </div>
          </div>
        </Card>
        <div style={{ display: "flex", gap: spacing[4], justifyContent: "flex-end" }}>
          <Button type="button" tone="neutral" variant="outline" onClick={() => navigate("/onboarding/day-profile")}>
            Voltar
          </Button>
          <Button type="button" tone="success" variant="solid" onClick={handleNext}>
            {ONBOARDING_5MIN_COPY.shiftSetup.cta}
          </Button>
        </div>
      </div>
    </div>
  );
}
