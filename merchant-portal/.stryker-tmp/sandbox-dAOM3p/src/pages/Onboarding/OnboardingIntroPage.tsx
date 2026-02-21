/**
 * Onboarding 5min — Tela 0: Pré-Onboarding (intro).
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */
// @ts-nocheck


import { useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { ONBOARDING_5MIN_COPY } from "../../copy/onboarding5min";
import { Button, Card } from "../../ui/design-system/primitives";
import styles from "./OnboardingIntroPage.module.css";

export function OnboardingIntroPage() {
  const navigate = useNavigate();

  return (
    <div data-onboarding-step="0" className={styles.pageRoot}>
      <OnboardingStepIndicator step={1} total={9} />
      <div className={styles.contentContainer}>
        <h1 className={styles.headline}>
          {ONBOARDING_5MIN_COPY.intro.headline}
        </h1>
        <ul className={styles.bulletList}>
          {ONBOARDING_5MIN_COPY.intro.bullets.map((b, i) => (
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
            {ONBOARDING_5MIN_COPY.intro.cta}
          </Button>
        </Card>
      </div>
    </div>
  );
}
