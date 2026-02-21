/**
 * IntegrationsPaymentsPage - Pagamentos (Stripe como integração plugável).
 * Ref: CHEFIAPP_INTEGRATIONS_HUB_SPEC.md §3.2, CHEFIAPP_PAYMENTS_INTEGRATION_SPEC.md
 *
 * Mostra Stripe com status (disabled | configured | active | error); configurar/ativar via BillingBroker.
 */

import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../../../../context/RestaurantRuntimeContext";
import { IntegrationRegistry, StripePaymentAdapter, openCustomerPortal } from "../../../../../integrations";
import { getBillingStatus } from "../../../../../core/billing/coreBillingApi";
import type { BillingStatus } from "../../../../../core/billing/coreBillingApi";
import { AdminPageHeader } from "../../../dashboard/components/AdminPageHeader";

type StripeCardStatus = "disabled" | "configured" | "active" | "error";

function billingToCardStatus(status: BillingStatus | null): StripeCardStatus {
  if (!status) return "disabled";
  if (status === "active") return "active";
  if (status === "trial") return "configured";
  if (status === "past_due" || status === "canceled") return "error";
  return "configured";
}

export function IntegrationsPaymentsPage() {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    IntegrationRegistry.register(StripePaymentAdapter).catch(() => {});
  }, []);

  useEffect(() => {
    if (!restaurantId) {
      setBillingStatus(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    getBillingStatus(restaurantId).then((s) => {
      if (!cancelled) setBillingStatus(s ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const status = billingToCardStatus(billingStatus);
  const statusLabel = { disabled: "Inativo", configured: "Configurado", active: "Ativo", error: "Erro" }[status];

  const handleConfigure = async () => {
    setActionLoading(true);
    try {
      const { url } = await openCustomerPortal();
      if (url) window.location.href = url;
    } catch (e) {
      console.error("[IntegrationsPaymentsPage] openCustomerPortal:", e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Pagamentos"
        subtitle="Stripe e outros; config, status, logs."
      />

      {loading ? (
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>A carregar…</p>
      ) : (
        <div
          style={{
            padding: 24,
            border: "1px solid var(--surface-border)",
            borderRadius: 12,
            backgroundColor: "var(--card-bg-on-dark)",
            maxWidth: 480,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px 0", color: "var(--text-primary)" }}>
                Stripe
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>
                Assinatura SaaS e customer portal (método de pagamento, faturas).
              </p>
            </div>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                background:
                  status === "active"
                    ? "var(--status-success-bg)"
                    : status === "error"
                      ? "var(--status-error-bg)"
                      : status === "configured"
                        ? "var(--status-warning-bg)"
                        : "var(--card-bg-on-dark)",
                color:
                  status === "active"
                    ? "var(--color-success)"
                    : status === "error"
                      ? "var(--color-error)"
                      : status === "configured"
                        ? "var(--color-warning)"
                        : "var(--text-secondary)",
              }}
            >
              {statusLabel}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={handleConfigure}
              disabled={actionLoading}
              style={{
                padding: "8px 16px",
                background: "var(--color-primary)",
                color: "var(--text-inverse)",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                cursor: actionLoading ? "wait" : "pointer",
              }}
            >
              {actionLoading ? "A abrir…" : "Configurar / Portal do cliente"}
            </button>
          </div>
          <p style={{ margin: "16px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
            Checkout e portal são tratados pelo Stripe; o webhook de pagamento deve emitir{" "}
            <code style={{ background: "var(--surface-overlay)", padding: "2px 6px", borderRadius: 4 }}>
              payment.confirmed
            </code>{" "}
            para o Event Bus (Webhooks OUT).
          </p>
        </div>
      )}
    </>
  );
}
