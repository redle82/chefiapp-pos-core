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
import styles from "./BillingPage.module.css";

const STATUS_LABELS: Record<string, string> = {
  TRIAL: "Período de teste",
  ACTIVE: "Assinatura ativa",
  PAST_DUE: "Pagamento em atraso",
  SUSPENDED: "Suspensa",
  CANCELLED: "Cancelada",
};

/* Preço exibido quando STRIPE_PRICE_ID está configurado (mínimo vendável) */
const PLAN_PRICE_LABEL = "79 €/mês";

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
        "Checkout cancelado. Tente de novo quando quiser.",
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
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Título e descrição */}
        <header className={styles.header}>
          <h1 className={styles.title}>Faturação</h1>
          <p className={styles.subtitle}>
            Gerir a sua assinatura e método de pagamento.
          </p>
        </header>

        {/* Erros */}
        {(error || actionError) && (
          <div className={styles.errorBox}>{actionError ?? error}</div>
        )}

        {/* Card principal */}
        <section className={styles.mainCard}>
          {subscription ? (
            <>
              <div className={styles.statusSection}>
                <span className={styles.statusLabel}>Estado</span>
                <p className={styles.statusValue}>
                  {STATUS_LABELS[subscription.status] ?? subscription.status}
                </p>
                <p className={styles.statusDetails}>
                  Plano: {subscription.plan_tier} · Próximo pagamento:{" "}
                  {subscription.next_payment_at
                    ? new Date(subscription.next_payment_at).toLocaleDateString(
                        "pt-PT",
                      )
                    : "—"}
                </p>
              </div>

              <div className={styles.buttonGroup}>
                {!isActive && (
                  <button
                    type="button"
                    onClick={handleStartSubscription}
                    disabled={!!actionLoading || !priceId}
                    className={styles.buttonPrimary}
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
                  className={styles.buttonSecondary}
                >
                  {actionLoading === "portal"
                    ? "A abrir..."
                    : "Gerir faturação"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={styles.noSubscriptionText}>
                Ainda não tem uma assinatura ativa. Assine um plano para passar
                a plano ativo (operação ao vivo).
              </p>
              {priceId && (
                <p className={styles.pricingText}>Plano — {PLAN_PRICE_LABEL}</p>
              )}
              <button
                type="button"
                onClick={handleStartSubscription}
                disabled={!!actionLoading || !priceId}
                className={styles.buttonPrimary}
              >
                {actionLoading === "checkout"
                  ? "A redirecionar..."
                  : "Ativar agora"}
              </button>
              {!priceId && (
                <p className={styles.configMessage}>
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
          className={styles.backButton}
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
