/**
 * SubscriptionPage — Assinatura / Billing Center (Last.app style).
 * Responde: que plano tenho, o que inclui, uso/limites, quanto pago, método de pagamento,
 * e-mail de faturação, histórico de faturas.
 *
 * Data source: useSubscriptionPage hook (Core DB only; empty when no data).
 */

import { CONFIG } from "../../../../config";
import { BillingBroker } from "../../../../core/billing/BillingBroker";
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

  const handleChangePlan = async (planId: string) => {
    try {
      // Prefer stripePriceId (Stripe price_xxx) over plan slug for checkout
      const plan = plans.find((p) => p.id === planId);
      const priceId = plan?.stripePriceId || planId;
      const result = await BillingBroker.startSubscription(priceId);
      if (result.url) window.location.href = result.url;
    } catch (err) {
      console.error("[SubscriptionPage] Change plan error:", err);
    }
  };

  const handleChangeCard = async () => {
    try {
      const result = await BillingBroker.openCustomerPortal();
      if (result.url) window.location.href = result.url;
    } catch (err) {
      console.error("[SubscriptionPage] Open portal error:", err);
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

  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <AdminPageHeader
        title="Tu suscripción"
        subtitle="Administra tu plan y complementos de ChefIApp."
      />
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
              Período de prueba activo
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
          Planes
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
              onChangePlan={handleChangePlan}
              onContactSupport={() => console.log("Contact support")}
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
          Uso del plan
        </h2>
        <p
          style={{
            margin: "0 0 12px 0",
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          Realiza un seguimiento de los límites de tu plan actual y del uso
          adicional.
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
          onSwitchToYearly={() => console.log("Switch to yearly")}
          onCancelSubscription={() => console.log("Cancel subscription")}
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
            console.log("Save billing email", email);
          }}
        />
      </section>

      {/* F) Histórico de faturas */}
      <section>
        <InvoicesTable
          invoices={invoices}
          onApplyFilters={(opts) => console.log("Apply filters", opts)}
          onDownloadPdf={(id) => console.log("Download PDF", id)}
        />
      </section>
    </div>
  );
}
