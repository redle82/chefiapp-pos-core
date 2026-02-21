/**
 * Onboarding 5min — Tela 3: Como funciona o dia (balcão/mesas, ticket médio, método pagamento).
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */
// @ts-nocheck


import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { ONBOARDING_5MIN_COPY } from "../../copy/onboarding5min";
import { Button, Card } from "../../ui/design-system/primitives";
import styles from "./OnboardingDayProfilePage.module.css";

type ServiceType = "balcao" | "mesas" | "ambos";
type TicketLevel = "€" | "€€" | "€€€";
type PaymentMain = "dinheiro" | "cartao" | "ambos";

export function OnboardingDayProfilePage() {
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceType>("ambos");
  const [ticket, setTicket] = useState<TicketLevel>("€€");
  const [payment, setPayment] = useState<PaymentMain>("ambos");

  const handleNext = () => {
    navigate("/onboarding/shift-setup");
  };

  return (
    <div data-onboarding-step="3" className={styles.pageRoot}>
      <OnboardingStepIndicator step={4} total={9} />
      <div className={styles.contentContainer}>
        <h1 className={styles.headline}>
          {ONBOARDING_5MIN_COPY.dayProfile.headline}
        </h1>
        <Card padding="lg" className={styles.formCard}>
          <div className={styles.fieldSet}>
            <div>
              <div className={styles.fieldLabel}>Serviço</div>
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
                    {s === "balcao"
                      ? "Balcão"
                      : s === "mesas"
                      ? "Mesas"
                      : "Ambos"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className={styles.fieldLabel}>Ticket médio</div>
              <div className={styles.buttonGroup}>
                {(["€", "€€", "€€€"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTicket(t)}
                    className={
                      ticket === t
                        ? styles.optionButtonActive
                        : styles.optionButton
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className={styles.fieldLabel}>Método principal</div>
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
                    {p === "dinheiro"
                      ? "Dinheiro"
                      : p === "cartao"
                      ? "Cartão"
                      : "Ambos"}
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
            Voltar
          </Button>
          <Button
            type="button"
            tone="success"
            variant="solid"
            onClick={handleNext}
          >
            {ONBOARDING_5MIN_COPY.dayProfile.cta}
          </Button>
        </div>
      </div>
    </div>
  );
}
