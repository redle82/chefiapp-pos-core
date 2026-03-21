/**
 * BillingStep — Escolher plano no fluxo de onboarding.
 * Integra Billing no onboarding: trial ou checkout pago.
 * Ref: docs/architecture/BILLING_FLOW.md, ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CONFIG } from "../../config";
import { BillingBroker } from "../../core/billing/BillingBroker";
import { Logger } from "../../core/logger";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { Button, Card } from "../../ui/design-system/primitives";
import { PlanCard } from "../../features/admin/subscription/components/PlanCard";
import { useSubscriptionPage } from "../../features/admin/subscription/useSubscriptionPage";
import styles from "./OnboardingPlanTrialPage.module.css";

export interface BillingStepProps {
  /** Quando true, renderizado inline no OnboardingAssistantPage; esconde Back para plan-trial */
  embedded?: boolean;
  /** URL para onde voltar após trial/checkout (ex: /onboarding). Usado para successUrl quando from=onboarding */
  returnToOnboarding?: string;
}

export function BillingStep({ embedded, returnToOnboarding }: BillingStepProps = {}) {
  const { t } = useTranslation(["onboarding", "common"]);
  const navigate = useNavigate();
  const restaurantId = getTabIsolated("chefiapp_restaurant_id");
  const { plans, loading, error } = useSubscriptionPage();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleStartTrial = () => {
    const search = embedded ? "?from=assistant" : "";
    navigate(`/onboarding/trial-start${search}`, { replace: true });
  };

  const handleChoosePlan = async (planId: string) => {
    setCheckoutError(null);
    if (!restaurantId) {
      setCheckoutError(t("common:billing.subscriptionPage.selectRestaurant"));
      return;
    }
    try {
      const plan = plans.find((p) => p.id === planId);
      const priceId = plan?.stripePriceId || planId;
      const options =
        returnToOnboarding && typeof window !== "undefined"
          ? {
              successUrl: `${window.location.origin}/billing/success?from=onboarding`,
              cancelUrl: `${window.location.origin}${returnToOnboarding}`,
            }
          : undefined;
      const result = await BillingBroker.startSubscription(
        priceId,
        restaurantId,
        options,
      );
      if (result.url?.includes("stripe.com")) {
        window.location.href = result.url;
        return;
      }
      setCheckoutError(t("common:billing.subscriptionPage.checkoutFailed"));
    } catch (err) {
      Logger.error("[BillingStep] Checkout error:", err);
      setCheckoutError(
        err instanceof Error ? err.message : t("common:billing.subscriptionPage.checkoutError"),
      );
    }
  };

  return (
    <div data-onboarding-step="billing" className={styles.pageRoot}>
      {!embedded && <OnboardingStepIndicator step={6} total={10} />}
      <div className={styles.contentContainer}>
        <h1 className={styles.title}>{t("fiveMin.planTrial.headline")}</h1>
        <p className={styles.subtitle}>{t("fiveMin.planTrial.subtitle")}</p>

        {loading && <p>{t("common:loading")}</p>}
        {error && (
          <p role="alert" style={{ color: "var(--text-error, #ef4444)", marginBottom: 16 }}>
            {error}
          </p>
        )}
        {checkoutError && (
          <p role="alert" style={{ color: "var(--text-error, #ef4444)", marginBottom: 16 }}>
            {checkoutError}
          </p>
        )}

        {!CONFIG.isGatewayAvailable && (
          <p role="status" style={{ color: "var(--text-muted)", marginBottom: 16 }}>
            {t("common:billing.checkoutComingSoon", "Checkout em breve. Comece com o período de trial.")}
          </p>
        )}
        {plans.length > 0 && CONFIG.isGatewayAvailable && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {plans.map((plan) => (
              <Card key={plan.id} padding="lg">
                <PlanCard
                  plan={plan}
                  onChangePlan={handleChoosePlan}
                />
              </Card>
            ))}
          </div>
        )}

        <div className={styles.actions} style={{ marginTop: 24 }}>
          {!embedded && (
            <Button
              type="button"
              tone="neutral"
              variant="outline"
              onClick={() => navigate("/onboarding/plan-trial")}
            >
              {t("common:back")}
            </Button>
          )}
          <Button
            type="button"
            tone="success"
            variant="solid"
            onClick={handleStartTrial}
          >
            {t("fiveMin.planTrial.cta")}
          </Button>
        </div>
      </div>
    </div>
  );
}
