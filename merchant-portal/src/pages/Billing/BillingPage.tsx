/**
 * BillingPage — Gestão de assinatura e faturação
 *
 * Exibe estado da subscription (useSubscription), permite iniciar checkout
 * (BillingBroker.startSubscription) e abrir o portal do cliente Stripe
 * (BillingBroker.openCustomerPortal). Apenas owner (RoleGate /app/billing).
 *
 * Visual: VPC (Visual Patch Comercial) — escuro, botões grandes, espaçamento
 * generoso. Regra: "Se eu colocasse meu cartão aqui hoje, eu confiaria?"
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CONFIG } from "../../config";
import { BillingBroker } from "../../core/billing/BillingBroker";
import { useSubscription } from "../../hooks/useSubscription";
import { GlobalLoadingView } from "../../ui/design-system/components";

const STATUS_LABELS: Record<string, string> = {
  TRIAL: "Período de teste",
  ACTIVE: "Assinatura ativa",
  PAST_DUE: "Pagamento em atraso",
  SUSPENDED: "Suspensa",
  CANCELLED: "Cancelada",
};

/* VPC — valores locais para esta página (billing = página do cartão) */
const VPC = {
  bg: "#0a0a0a",
  surface: "#141414",
  border: "#262626",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  accent: "#22c55e",
  accentHover: "#16a34a",
  radius: 8,
  space: 24,
  spaceLg: 32,
  btnMinHeight: 48,
  btnPadding: "12px 24px",
  fontSizeBase: 16,
  fontSizeLarge: 20,
  lineHeight: 1.6,
} as const;

export function BillingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subscription, loading, error, isActive } = useSubscription();
  const [actionLoading, setActionLoading] = useState<
    "checkout" | "portal" | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const priceId = CONFIG.STRIPE_PRICE_ID;

  useEffect(() => {
    if (searchParams.get("billing") === "cancel") {
      setActionError(
        "Checkout cancelado. Pode tentar novamente quando quiser.",
      );
      window.history.replaceState({}, "", "/app/billing");
    }
  }, [searchParams]);

  const handleStartSubscription = async () => {
    if (!priceId) {
      setActionError("Preço do plano não configurado (VITE_STRIPE_PRICE_ID).");
      return;
    }
    setActionError(null);
    setActionLoading("checkout");
    try {
      const { url } = await BillingBroker.startSubscription(priceId);
      if (url) window.location.href = url;
    } catch (e: unknown) {
      setActionError(
        e instanceof Error ? e.message : "Erro ao iniciar checkout.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenPortal = async () => {
    setActionError(null);
    setActionLoading("portal");
    try {
      const { url } = await BillingBroker.openCustomerPortal();
      if (url) window.location.href = url;
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Erro ao abrir portal.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <GlobalLoadingView
        message="A carregar assinatura..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: VPC.bg,
        fontFamily: "Inter, system-ui, sans-serif",
        color: VPC.text,
        lineHeight: VPC.lineHeight,
        padding: VPC.spaceLg,
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        {/* Título e descrição */}
        <header style={{ marginBottom: VPC.spaceLg }}>
          <h1
            style={{
              fontSize: VPC.fontSizeLarge,
              fontWeight: 700,
              color: VPC.text,
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}
          >
            Faturação
          </h1>
          <p
            style={{
              fontSize: VPC.fontSizeBase,
              color: VPC.textMuted,
              margin: 0,
            }}
          >
            Gerir a sua assinatura e método de pagamento.
          </p>
        </header>

        {/* Erros */}
        {(error || actionError) && (
          <div
            style={{
              padding: VPC.space,
              marginBottom: VPC.space,
              borderRadius: VPC.radius,
              backgroundColor: "rgba(185, 28, 28, 0.12)",
              border: `1px solid ${VPC.border}`,
              color: "#f87171",
              fontSize: VPC.fontSizeBase,
            }}
          >
            {actionError ?? error}
          </div>
        )}

        {/* Card principal */}
        <section
          style={{
            padding: VPC.spaceLg,
            borderRadius: VPC.radius,
            border: `1px solid ${VPC.border}`,
            backgroundColor: VPC.surface,
            marginBottom: VPC.spaceLg,
          }}
        >
          {subscription ? (
            <>
              <div style={{ marginBottom: VPC.spaceLg }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: VPC.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Estado
                </span>
                <p
                  style={{
                    fontSize: VPC.fontSizeLarge,
                    fontWeight: 600,
                    color: VPC.text,
                    marginTop: 8,
                    marginBottom: 4,
                  }}
                >
                  {STATUS_LABELS[subscription.status] ?? subscription.status}
                </p>
                <p
                  style={{
                    fontSize: VPC.fontSizeBase,
                    color: VPC.textMuted,
                    margin: 0,
                  }}
                >
                  Plano: {subscription.plan_tier} · Próximo pagamento:{" "}
                  {subscription.next_payment_at
                    ? new Date(subscription.next_payment_at).toLocaleDateString(
                        "pt-PT",
                      )
                    : "—"}
                </p>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {!isActive && (
                  <button
                    type="button"
                    onClick={handleStartSubscription}
                    disabled={!!actionLoading || !priceId}
                    style={{
                      minHeight: VPC.btnMinHeight,
                      padding: VPC.btnPadding,
                      fontSize: VPC.fontSizeBase,
                      fontWeight: 600,
                      color: "#fff",
                      backgroundColor: VPC.accent,
                      border: "none",
                      borderRadius: VPC.radius,
                      cursor: actionLoading ? "wait" : "pointer",
                    }}
                  >
                    {actionLoading === "checkout"
                      ? "A redirecionar..."
                      : "Ativar agora"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOpenPortal}
                  disabled={!!actionLoading}
                  style={{
                    minHeight: VPC.btnMinHeight,
                    padding: VPC.btnPadding,
                    fontSize: VPC.fontSizeBase,
                    fontWeight: 600,
                    color: VPC.text,
                    backgroundColor: "transparent",
                    border: `1px solid ${VPC.border}`,
                    borderRadius: VPC.radius,
                    cursor: actionLoading ? "wait" : "pointer",
                  }}
                >
                  {actionLoading === "portal"
                    ? "A abrir..."
                    : "Gerir faturação"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p
                style={{
                  fontSize: VPC.fontSizeBase,
                  color: VPC.textMuted,
                  marginBottom: VPC.spaceLg,
                  marginTop: 0,
                }}
              >
                Ainda não tem uma assinatura ativa. Assine um plano para ativar
                o modo ao vivo.
              </p>
              <button
                type="button"
                onClick={handleStartSubscription}
                disabled={!!actionLoading || !priceId}
                style={{
                  minHeight: VPC.btnMinHeight,
                  padding: VPC.btnPadding,
                  fontSize: VPC.fontSizeBase,
                  fontWeight: 600,
                  color: "#fff",
                  backgroundColor: VPC.accent,
                  border: "none",
                  borderRadius: VPC.radius,
                  cursor: actionLoading ? "wait" : "pointer",
                }}
              >
                {actionLoading === "checkout"
                  ? "A redirecionar..."
                  : "Ativar agora"}
              </button>
              {!priceId && (
                <p
                  style={{
                    fontSize: 14,
                    color: VPC.textMuted,
                    marginTop: 12,
                    marginBottom: 0,
                  }}
                >
                  Configure VITE_STRIPE_PRICE_ID no ambiente para ativar o
                  checkout.
                </p>
              )}
            </>
          )}
        </section>

        {/* Voltar */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "12px 0",
            fontSize: VPC.fontSizeBase,
            color: VPC.textMuted,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          ← Voltar ao Dashboard
        </button>
      </div>

      <style>{`
        @keyframes vpc-fade {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
