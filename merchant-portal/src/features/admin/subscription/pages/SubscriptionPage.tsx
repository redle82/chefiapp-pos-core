/**
 * SubscriptionPage — Assinatura / Billing Center (Last.app style).
 * Responde: que plano tenho, o que inclui, uso/limites, quanto pago, método de pagamento,
 * e-mail de faturação, histórico de faturas.
 *
 * Data source: useSubscriptionPage hook (Core DB only; empty when no data).
 */

import { useState } from "react";
import { CONFIG } from "../../../../config";
import { BillingBroker } from "../../../../core/billing/BillingBroker";
import { Logger } from "../../../../core/logger";
import { getTabIsolated } from "../../../../core/storage/TabIsolatedStorage";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";
import { BillingEmailCard } from "../components/BillingEmailCard";
import { BillingSummaryCard } from "../components/BillingSummaryCard";
import { InvoicesTable } from "../components/InvoicesTable";
import { PaymentMethodCard } from "../components/PaymentMethodCard";
import { PlanCard } from "../components/PlanCard";
import { UsageMeterRow } from "../components/UsageMeterRow";
import { useSubscriptionPage } from "../useSubscriptionPage";

export function SubscriptionPage() {
  const {
    plans,
    usage,
    billingSummary,
    paymentMethod,
    billingEmail,
    invoices,
    subscription,
    loading,
    error,
  } = useSubscriptionPage();

  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const restaurantId = getTabIsolated("chefiapp_restaurant_id");

  const handleChangePlan = async (planId: string) => {
    setCheckoutError(null);
    if (!restaurantId) {
      setCheckoutError("Selecione um restaurante para alterar o plano.");
      return;
    }
    try {
      const plan = plans.find((p) => p.id === planId);
      const priceId = plan?.stripePriceId || planId;
      const result = await BillingBroker.startSubscription(
        priceId,
        restaurantId,
      );
      if (result.url) {
        if (result.url.includes("stripe.com")) {
          window.location.href = result.url;
        } else {
          setCheckoutError(
            "O servidor devolveu um URL inválido. Tenta de novo ou contacta o suporte.",
          );
        }
      } else {
        setCheckoutError("Não foi possível abrir o checkout. Tenta de novo.");
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao iniciar checkout. Tenta de novo.";
      setCheckoutError(message);
    }
  };

  const handleChangeCard = async () => {
    try {
      const result = await BillingBroker.openCustomerPortal();
      if (result.url) window.location.href = result.url;
    } catch (err) {
      Logger.error("[SubscriptionPage] Open portal error:", err);
    }
  };

  if (loading) {
    return (
      <div
        style={{ padding: 32, color: "var(--text-secondary)", fontSize: 14 }}
      >
        A carregar dados de faturação…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32, color: "var(--color-error)", fontSize: 14 }}>
        Erro: {error}
      </div>
    );
  }

  const isTrialing = subscription?.status === "trialing";
  const canSellPlatform = CONFIG.canSellPlatform;

  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <AdminPageHeader
        title="A tua assinatura"
        subtitle="Gerir plano e complementos ChefIApp."
      />
      {!canSellPlatform && (
        <div
          role="alert"
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            backgroundColor: "var(--status-warning-bg, #fff3cd)",
            color: "var(--text-primary)",
            fontSize: 14,
          }}
        >
          A assinatura e a mudança de plano estão disponíveis apenas em{" "}
          <a href="https://www.chefiapp.com" rel="noopener noreferrer">
            chefiapp.com
          </a>
          .
        </div>
      )}
      {checkoutError && (
        <div
          role="alert"
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            backgroundColor: "var(--status-error-bg, #f8d7da)",
            color: "var(--text-primary)",
            fontSize: 14,
          }}
        >
          {checkoutError}
          {checkoutError.includes("4320") && (
            <span>
              {" "}
              Na raiz do projeto:{" "}
              <code style={{ fontSize: 12 }}>pnpm run dev:gateway</code>
            </span>
          )}
        </div>
      )}
      {(isTrialing && subscription?.trial_ends_at) || CONFIG.STRIPE_IS_TEST ? (
        <div
          style={{
            marginTop: -8,
            marginBottom: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          {isTrialing && subscription?.trial_ends_at && (
            <span
              style={{
                color: "var(--color-warning)",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Período de teste ativo
            </span>
          )}
          {CONFIG.STRIPE_IS_TEST && (
            <span
              style={{
                padding: "2px 8px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--color-info)",
                background: "var(--status-info-bg)",
                borderRadius: 4,
              }}
            >
              Stripe em modo demo/teste
            </span>
          )}
        </div>
      ) : null}

      {/* A) Planos */}
      <section style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
            margin: "0 0 12px 0",
          }}
        >
          Planos
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onChangePlan={canSellPlatform ? handleChangePlan : undefined}
              onContactSupport={() => Logger.debug("Contact support")}
            />
          ))}
        </div>
      </section>

      {/* B) Uso do plano */}
      <section style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
            margin: "0 0 8px 0",
          }}
        >
          Uso do plano
        </h2>
        <p
          style={{
            margin: "0 0 12px 0",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          Acompanha os limites do teu plano atual e o uso adicional.
        </p>
        <div
          style={{
            border: "1px solid var(--surface-border)",
            borderRadius: 12,
            padding: "0 16px",
            backgroundColor: "var(--card-bg-on-dark)",
          }}
        >
          {usage.map((meter) => (
            <UsageMeterRow key={meter.id} meter={meter} />
          ))}
        </div>
      </section>

      {/* C) Resumo + D) Pagamento — 2 colunas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <BillingSummaryCard
          summary={billingSummary}
          onSwitchToYearly={() => Logger.debug("Switch to yearly")}
          onCancelSubscription={() => Logger.debug("Cancel subscription")}
        />
        <PaymentMethodCard
          method={paymentMethod}
          onChangeCard={handleChangeCard}
        />
      </div>

      <section style={{ marginBottom: 24 }}>
        <BillingEmailCard
          initialEmail={billingEmail}
          onSave={async (email) => {
            Logger.info(`Save billing email: ${email}`);
          }}
        />
      </section>

      {/* F) Histórico de faturas */}
      <section>
        <InvoicesTable
          invoices={invoices}
          onApplyFilters={(opts) => Logger.debug("Apply filters", { opts })}
          onDownloadPdf={(id) => Logger.debug(`Download PDF: ${id}`)}
        />
      </section>
    </div>
  );
}
