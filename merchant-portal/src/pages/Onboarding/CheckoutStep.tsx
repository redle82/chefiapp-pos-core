/**
 * CheckoutStep — Configurar pagamento (Stripe Checkout) no fluxo de onboarding.
 * Mostrado após escolher plano pago em BillingStep; redireciona para Stripe.
 * Ref: docs/architecture/BILLING_FLOW.md
 */

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { Button } from "../../ui/design-system/primitives";
import styles from "./OnboardingPlanTrialPage.module.css";

export function CheckoutStep() {
  const { t } = useTranslation(["onboarding", "common"]);
  const navigate = useNavigate();

  return (
    <div data-onboarding-step="checkout" className={styles.pageRoot}>
      <OnboardingStepIndicator step={8} total={9} />
      <div className={styles.contentContainer}>
        <h1 className={styles.title}>{t("fiveMin.planTrial.headline")}</h1>
        <p className={styles.subtitle}>
          {t("common:billing.subscriptionPage.checkoutRedirect") ??
            "Serás redirecionado para o checkout seguro."}
        </p>
        <div className={styles.actions}>
          <Button
            type="button"
            tone="neutral"
            variant="outline"
            onClick={() => navigate("/onboarding/billing")}
          >
            {t("common:back")}
          </Button>
        </div>
      </div>
    </div>
  );
}
