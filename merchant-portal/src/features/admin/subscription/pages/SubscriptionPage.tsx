/**
 * SubscriptionPage — Assinatura / Billing Center (Last.app style).
 * Responde: que plano tenho, o que inclui, uso/limites, quanto pago, método de pagamento,
 * e-mail de faturação, histórico de faturas.
 * Ref: Tu suscripción — plano, uso, resumo, pagamento, e-mail, historial.
 */

import { PlanCard } from "../components/PlanCard";
import { UsageMeterRow } from "../components/UsageMeterRow";
import { BillingSummaryCard } from "../components/BillingSummaryCard";
import { PaymentMethodCard } from "../components/PaymentMethodCard";
import { BillingEmailCard } from "../components/BillingEmailCard";
import { InvoicesTable } from "../components/InvoicesTable";
import {
  MOCK_PLANS,
  MOCK_USAGE,
  MOCK_BILLING,
  MOCK_PAYMENT,
  MOCK_BILLING_EMAIL,
  MOCK_INVOICES,
} from "../data/subscriptionMock";

export function SubscriptionPage() {
  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <header style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: "0 0 4px 0",
            color: "#111827",
          }}
        >
          Tu suscripción
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "#6b7280",
          }}
        >
          Administra tu plan y complementos de ChefIApp.
        </p>
      </header>

      {/* A) Planos */}
      <section style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#374151",
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
          {MOCK_PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onChangePlan={(id) => console.log("Change plan", id)}
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
            color: "#374151",
            margin: "0 0 8px 0",
          }}
        >
          Uso del plan
        </h2>
        <p
          style={{
            margin: "0 0 12px 0",
            fontSize: 13,
            color: "#6b7280",
          }}
        >
          Realiza un seguimiento de los límites de tu plan actual y del uso
          adicional.
        </p>
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "0 16px",
            backgroundColor: "#fff",
          }}
        >
          {MOCK_USAGE.map((meter) => (
            <UsageMeterRow key={meter.id} meter={meter} />
          ))}
        </div>
      </section>

      {/* C) Resumo + D) Pagamento + E) E-mail — 2 colunas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <BillingSummaryCard
          summary={MOCK_BILLING}
          onSwitchToYearly={() => console.log("Switch to yearly")}
          onCancelSubscription={() => console.log("Cancel subscription")}
        />
        <PaymentMethodCard
          method={MOCK_PAYMENT}
          onChangeCard={() => console.log("Change card")}
        />
      </div>

      <section style={{ marginBottom: 24 }}>
        <BillingEmailCard
          initialEmail={MOCK_BILLING_EMAIL}
          onSave={async (email) => {
            console.log("Save billing email", email);
          }}
        />
      </section>

      {/* F) Histórico de faturas */}
      <section>
        <InvoicesTable
          invoices={MOCK_INVOICES}
          onApplyFilters={(opts) => console.log("Apply filters", opts)}
          onDownloadPdf={(id) => console.log("Download PDF", id)}
        />
      </section>
    </div>
  );
}
