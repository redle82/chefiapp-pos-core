/**
 * Onboarding 5min — Tela 3: Como funciona o dia (balcão/mesas, ticket médio, método pagamento).
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { ONBOARDING_5MIN_COPY } from "../../copy/onboarding5min";
import { Button, Card } from "../../ui/design-system/primitives";
import { colors } from "../../ui/design-system/tokens/colors";
import { spacing } from "../../ui/design-system/tokens/spacing";

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
    <div
      data-onboarding-step="3"
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
      <OnboardingStepIndicator step={4} total={9} />
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
            marginBottom: spacing[4],
            color: colors.text.primary,
          }}
        >
          {ONBOARDING_5MIN_COPY.dayProfile.headline}
        </h1>
        <Card padding="lg" style={{ marginBottom: spacing[6] }}>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[5] }}>
            <div>
              <div style={{ fontSize: 14, marginBottom: spacing[2], color: colors.text.secondary }}>Serviço</div>
              <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap" }}>
                {(["balcao", "mesas", "ambos"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setService(s)}
                    style={{
                      padding: spacing[2] + " " + spacing[4],
                      borderRadius: 8,
                      border: service === s ? "2px solid var(--color-action-base, #0a84ff)" : "1px solid rgba(255,255,255,0.2)",
                      background: service === s ? "rgba(10,132,255,0.2)" : colors.surface.layer1,
                      color: colors.text.primary,
                      cursor: "pointer",
                    }}
                  >
                    {s === "balcao" ? "Balcão" : s === "mesas" ? "Mesas" : "Ambos"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, marginBottom: spacing[2], color: colors.text.secondary }}>Ticket médio</div>
              <div style={{ display: "flex", gap: spacing[2] }}>
                {(["€", "€€", "€€€"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTicket(t)}
                    style={{
                      padding: spacing[2] + " " + spacing[4],
                      borderRadius: 8,
                      border: ticket === t ? "2px solid var(--color-action-base)" : "1px solid rgba(255,255,255,0.2)",
                      background: ticket === t ? "rgba(10,132,255,0.2)" : colors.surface.layer1,
                      color: colors.text.primary,
                      cursor: "pointer",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, marginBottom: spacing[2], color: colors.text.secondary }}>Método principal</div>
              <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap" }}>
                {(["dinheiro", "cartao", "ambos"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPayment(p)}
                    style={{
                      padding: spacing[2] + " " + spacing[4],
                      borderRadius: 8,
                      border: payment === p ? "2px solid var(--color-action-base)" : "1px solid rgba(255,255,255,0.2)",
                      background: payment === p ? "rgba(10,132,255,0.2)" : colors.surface.layer1,
                      color: colors.text.primary,
                      cursor: "pointer",
                    }}
                  >
                    {p === "dinheiro" ? "Dinheiro" : p === "cartao" ? "Cartão" : "Ambos"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
        <div style={{ display: "flex", gap: spacing[4], justifyContent: "flex-end" }}>
          <Button type="button" tone="neutral" variant="outline" onClick={() => navigate("/onboarding/location")}>
            Voltar
          </Button>
          <Button type="button" tone="success" variant="solid" onClick={handleNext}>
            {ONBOARDING_5MIN_COPY.dayProfile.cta}
          </Button>
        </div>
      </div>
    </div>
  );
}
