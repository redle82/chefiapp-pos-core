/**
 * Onboarding 5min — Tela 7: Plano & Trial (trial ativo, limites; "Escolher plano depois" / "Ver planos").
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */

import { useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { ONBOARDING_5MIN_COPY } from "../../copy/onboarding5min";
import { Button, Card } from "../../ui/design-system/primitives";
import styles from "./OnboardingPlanTrialPage.module.css";

export function OnboardingPlanTrialPage() {
  const navigate = useNavigate();

  return (
    <div data-onboarding-step="7" className={styles.pageRoot}>
      <OnboardingStepIndicator step={8} total={9} />
      <div className={styles.contentContainer}>
        <h1 className={styles.title}>
          {ONBOARDING_5MIN_COPY.planTrial.headline}
        </h1>
        <p className={styles.subtitle}>
          O teu trial está ativo. Podes escolher um plano quando quiseres; até
          lá, usa o sistema à vontade.
        </p>
        <Card padding="lg" className={styles.planCard}>
          <div className={styles.planCardContent}>
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
        <div className={styles.actions}>
          <Button
            type="button"
            tone="neutral"
            variant="outline"
            onClick={() => navigate("/onboarding/tpv-preview")}
          >
            Voltar
          </Button>
          <Button
            type="button"
            tone="success"
            variant="solid"
            onClick={() => navigate("/onboarding/ritual-open")}
          >
            {ONBOARDING_5MIN_COPY.planTrial.cta}
          </Button>
        </div>
      </div>
    </div>
  );
}
