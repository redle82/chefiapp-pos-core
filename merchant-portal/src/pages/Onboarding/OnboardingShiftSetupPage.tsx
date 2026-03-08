/**
 * Onboarding 5min — Tela 4: Turno & Caixa (conceitual). Valor padrão sugerido para abertura de turnos; não abre turno.
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { useCurrency } from "../../core/currency/useCurrency";
import { setDefaultOpeningCashCents } from "../../core/storage/shiftDefaultsStorage";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { Button, Card } from "../../ui/design-system/primitives";
import styles from "./OnboardingShiftSetupPage.module.css";

const OPENING_OPTIONS = [0, 50, 100] as const;

export function OnboardingShiftSetupPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["onboarding", "common"]);
  const { symbol } = useCurrency();
  const [openingEur, setOpeningEur] = useState<number>(0);

  const handleNext = () => {
    const restaurantId =
      getTabIsolated("chefiapp_restaurant_id") ??
      (typeof window !== "undefined"
        ? window.localStorage.getItem("chefiapp_restaurant_id")
        : null);
    if (restaurantId) {
      setDefaultOpeningCashCents(restaurantId, openingEur * 100);
    }
    navigate("/onboarding/products");
  };

  return (
    <div data-onboarding-step="4" className={styles.pageRoot}>
      <OnboardingStepIndicator step={5} total={9} />
      <div className={styles.contentContainer}>
        <h1 className={styles.title}>{t("fiveMin.shiftSetup.headline")}</h1>
        <p className={styles.subtitle}>{t("fiveMin.shiftSetup.description")}</p>
        <Card padding="lg" className={styles.card}>
          <div className={styles.optionsSection}>
            <div className={styles.optionsLabel}>
              {t("fiveMin.shiftSetup.openingLabel")}
            </div>
            <div className={styles.optionsContainer}>
              {OPENING_OPTIONS.map((eur) => (
                <button
                  key={eur}
                  type="button"
                  onClick={() => setOpeningEur(eur)}
                  className={`${styles.optionButton} ${
                    openingEur === eur ? styles.optionButtonActive : ""
                  }`}
                >
                  {eur} {symbol}
                </button>
              ))}
            </div>
          </div>
        </Card>
        <div className={styles.actions}>
          <Button
            type="button"
            tone="neutral"
            variant="outline"
            onClick={() => navigate("/onboarding/day-profile")}
          >
            {t("common:back")}
          </Button>
          <Button
            type="button"
            tone="success"
            variant="solid"
            onClick={handleNext}
          >
            {t("fiveMin.shiftSetup.cta")}
          </Button>
        </div>
      </div>
    </div>
  );
}
