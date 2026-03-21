/**
 * TrialStart — Trial ativado; continua para o ritual de abertura.
 * Quando from=assistant (onboarding integrado): completa o passo billing e volta ao fluxo.
 * Ref: docs/architecture/BILLING_FLOW.md
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { Button, Card } from "../../ui/design-system/primitives";
import { updateOnboardingStep } from "../../infra/clients/OnboardingClient";
import styles from "./OnboardingPlanTrialPage.module.css";

export function TrialStart() {
  const { t } = useTranslation(["onboarding", "common"]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const fromAssistant = searchParams.get("from") === "assistant";

  const handleContinuar = async () => {
    if (fromAssistant) {
      setSaving(true);
      try {
        const onboardingId =
          typeof window !== "undefined"
            ? sessionStorage.getItem("chefiapp_onboarding_id")
            : null;
        if (onboardingId) {
          await updateOnboardingStep(onboardingId, "billing", {
            billing_completed: true,
          });
        }
        navigate("/onboarding", { replace: true });
      } catch {
        setSaving(false);
      } finally {
        setSaving(false);
      }
      return;
    }
    navigate("/onboarding/ritual-open", { replace: true });
  };

  return (
    <div data-onboarding-step="trial-start" className={styles.pageRoot}>
      <OnboardingStepIndicator step={9} total={9} />
      <div className={styles.contentContainer}>
        <h1 className={styles.title}>{t("fiveMin.planTrial.headline")}</h1>
        <p className={styles.subtitle}>
          {t("fiveMin.planTrial.trialActive", { defaultValue: "Trial ativo. Podes continuar para abrir o turno." })}
        </p>
        <Card padding="lg" className={styles.planCard}>
          <div className={styles.planCardContent}>
            <p>{t("fiveMin.planTrial.cta")}</p>
          </div>
        </Card>
        <div className={styles.actions}>
          <Button
            type="button"
            tone="neutral"
            variant="outline"
            onClick={() =>
              navigate(fromAssistant ? "/onboarding" : "/onboarding/billing")
            }
          >
            {t("common:back")}
          </Button>
          <Button
            type="button"
            tone="success"
            variant="solid"
            onClick={handleContinuar}
            disabled={saving}
          >
            {saving ? t("common:saving") : t("fiveMin.planTrial.cta")}
          </Button>
        </div>
      </div>
    </div>
  );
}
