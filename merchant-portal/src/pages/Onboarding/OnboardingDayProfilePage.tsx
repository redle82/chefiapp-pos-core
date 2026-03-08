/**
 * Onboarding 5min — Tela 3: Como funciona o dia (balcão/mesas, ticket médio, método pagamento).
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { useCurrency } from "../../core/currency/useCurrency";
import { Button, Card } from "../../ui/design-system/primitives";
import styles from "./OnboardingDayProfilePage.module.css";

type ServiceType = "balcao" | "mesas" | "ambos";
type TicketLevel = "low" | "mid" | "high";
type PaymentMain = "dinheiro" | "cartao" | "ambos";

export function OnboardingDayProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["onboarding", "common"]);
  const { symbol } = useCurrency();
  const [service, setService] = useState<ServiceType>("ambos");
  const [ticket, setTicket] = useState<TicketLevel>("mid");
  const [payment, setPayment] = useState<PaymentMain>("ambos");

  const serviceLabels: Record<ServiceType, string> = {
    balcao: t("fiveMin.dayProfile.serviceCounter"),
    mesas: t("fiveMin.dayProfile.serviceTables"),
    ambos: t("fiveMin.dayProfile.serviceBoth"),
  };

  const paymentLabels: Record<PaymentMain, string> = {
    dinheiro: t("fiveMin.dayProfile.paymentCash"),
    cartao: t("fiveMin.dayProfile.paymentCard"),
    ambos: t("fiveMin.dayProfile.paymentBoth"),
  };

  const handleNext = () => {
    navigate("/onboarding/shift-setup");
  };

  return (
    <div data-onboarding-step="3" className={styles.pageRoot}>
      <OnboardingStepIndicator step={4} total={9} />
      <div className={styles.contentContainer}>
        <h1 className={styles.headline}>{t("fiveMin.dayProfile.headline")}</h1>
        <Card padding="lg" className={styles.formCard}>
          <div className={styles.fieldSet}>
            <div>
              <div className={styles.fieldLabel}>
                {t("fiveMin.dayProfile.serviceLabel")}
              </div>
              <div className={styles.buttonGroup}>
                {(["balcao", "mesas", "ambos"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setService(s)}
                    className={
                      service === s
                        ? styles.optionButtonActive
                        : styles.optionButton
                    }
                  >
                    {serviceLabels[s]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className={styles.fieldLabel}>
                {t("fiveMin.dayProfile.ticketLabel")}
              </div>
              <div className={styles.buttonGroup}>
                {(["low", "mid", "high"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setTicket(level)}
                    className={
                      ticket === level
                        ? styles.optionButtonActive
                        : styles.optionButton
                    }
                  >
                    {level === "low"
                      ? symbol
                      : level === "mid"
                      ? `${symbol}${symbol}`
                      : `${symbol}${symbol}${symbol}`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className={styles.fieldLabel}>
                {t("fiveMin.dayProfile.paymentLabel")}
              </div>
              <div className={styles.buttonGroup}>
                {(["dinheiro", "cartao", "ambos"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPayment(p)}
                    className={
                      payment === p
                        ? styles.optionButtonActive
                        : styles.optionButton
                    }
                  >
                    {paymentLabels[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
        <div className={styles.actionRow}>
          <Button
            type="button"
            tone="neutral"
            variant="outline"
            onClick={() => navigate("/onboarding/location")}
          >
            {t("common:back")}
          </Button>
          <Button
            type="button"
            tone="success"
            variant="solid"
            onClick={handleNext}
          >
            {t("fiveMin.dayProfile.cta")}
          </Button>
        </div>
      </div>
    </div>
  );
}
