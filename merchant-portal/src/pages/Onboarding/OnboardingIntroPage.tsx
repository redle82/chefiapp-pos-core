/**
 * Onboarding 5min — Tela 0: Pré-Onboarding (intro).
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { Button, Card } from "../../ui/design-system/primitives";
import styles from "./OnboardingIntroPage.module.css";

export function OnboardingIntroPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("onboarding");

  const bullets = [
    t("fiveMin.intro.bullet1"),
    t("fiveMin.intro.bullet2"),
    t("fiveMin.intro.bullet3"),
    t("fiveMin.intro.bullet4"),
    t("fiveMin.intro.bullet5"),
  ];

  return (
    <div data-onboarding-step="0" className={styles.pageRoot}>
      <OnboardingStepIndicator step={1} total={9} />
      <div className={styles.contentContainer}>
        <h1 className={styles.headline}>{t("fiveMin.intro.headline")}</h1>
        <ul className={styles.bulletList}>
          {bullets.map((b, i) => (
            <li key={i} className={styles.bulletItem}>
              {b}
            </li>
          ))}
        </ul>
        <Card padding="lg" className={styles.ctaCard}>
          <Button
            type="button"
            tone="success"
            variant="solid"
            size="lg"
            onClick={() => navigate("/onboarding/identity")}
            className={styles.ctaButton}
          >
            {t("fiveMin.intro.cta")}
          </Button>
        </Card>
      </div>
    </div>
  );
}
