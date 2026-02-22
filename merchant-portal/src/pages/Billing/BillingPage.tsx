/**
 * BillingPage — Gestão de assinatura e faturação
 *
 * Exibe estado da subscription (useSubscription), permite iniciar checkout
 * (BillingBroker.startSubscription) e abrir o portal do cliente Stripe
 * (BillingBroker.openCustomerPortal). Apenas owner (RoleGate /app/billing).
 *
 * Shows all available plans from billing_plans table (Starter, Pro, Enterprise).
 * Each plan card has its own price, features, and "Ativar agora" button.
 *
 * Visual: VPC (Visual Patch Comercial) — escuro, botões grandes, espaçamento
 * generoso. Regra: "Se eu colocasse meu cartão aqui hoje, eu confiaria?"
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CONFIG } from "../../config";
import { BillingBroker } from "../../core/billing/BillingBroker";
import {
  getBillingPlans,
  type BillingPlanRow,
} from "../../core/billing/coreBillingApi";
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

/** Format price_cents to a human label, e.g. 4900 → "49 €" */
function formatPrice(priceCents: number, currency: string): string {
  const amount = Math.round(priceCents / 100);
  const symbol = currency === "EUR" ? "€" : currency;
  return `${amount} ${symbol}`;
}

/** Resolve which price ID to send to the gateway for a given plan */
function resolvePlanPriceId(plan: BillingPlanRow): string {
  // Best: plan has an explicit Stripe Price ID from DB
  if (plan.stripe_price_id) return plan.stripe_price_id;
  // Fallback: use the plan tier/slug — the gateway's resolveStripePriceId() maps it
  return plan.tier;
}

export function BillingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subscription, loading, error, isActive } = useSubscription();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [plans, setPlans] = useState<BillingPlanRow[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Fetch available plans from Core DB
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getBillingPlans();
        if (!cancelled) setPlans(rows);
      } catch {
        // Non-fatal: will show legacy single-plan fallback
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("billing") === "cancel") {
      setActionError("Checkout cancelado. Tente de novo quando quiser.");
      window.history.replaceState({}, "", "/app/billing");
    }
  }, [searchParams]);

  const handleStartSubscription = useCallback(async (priceId: string) => {
    if (!priceId) {
      setActionError("Preço do plano não configurado.");
      return;
    }
    setActionError(null);
    setActionLoading(priceId);
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
  }, []);

  const handleOpenPortal = useCallback(async () => {
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
  }, []);

  if (loading || plansLoading) {
    return (
      <GlobalLoadingView
        message="A carregar assinatura..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  // Legacy fallback: if no plans from DB, use single VITE_STRIPE_PRICE_ID
  const legacyPriceId = CONFIG.STRIPE_PRICE_ID;
  const hasPlans = plans.length > 0;
  const canSellPlatform = CONFIG.canSellPlatform;

  return (
    <div className={styles.pageWrapper}>
      <div className={hasPlans ? styles.containerWide : styles.container}>
        {/* Título e descrição */}
        <header className={styles.header}>
          <h1 className={styles.title}>Faturação</h1>
          <p className={styles.subtitle}>
            {subscription
              ? "Gerir a sua assinatura e método de pagamento."
              : "Escolha o plano ideal para o seu restaurante."}
          </p>
        </header>

        {/* Aviso: venda da plataforma só em chefiapp.com */}
        {!canSellPlatform && (
          <div className={styles.errorBox} role="alert">
            A subscrição e alteração de plano estão disponíveis apenas em{" "}
            <a href="https://www.chefiapp.com" rel="noopener noreferrer">
              chefiapp.com
            </a>
            . Aceda a esse site para subscrever ou alterar o seu plano.
          </div>
        )}

        {/* Erros */}
        {(error || actionError) && (
          <div className={styles.errorBox}>{actionError ?? error}</div>
        )}

        {/* Active subscription: show status + manage buttons */}
        {subscription && (
          <section className={styles.mainCard}>
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
              {!isActive && canSellPlatform && (
                <button
                  type="button"
                  onClick={() =>
                    handleStartSubscription(legacyPriceId || "pro")
                  }
                  disabled={!!actionLoading}
                  className={styles.buttonPrimary}
                >
                  {actionLoading && actionLoading !== "portal"
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
                {actionLoading === "portal" ? "A abrir..." : "Gerir faturação"}
              </button>
            </div>
          </section>
        )}

        {/* No subscription: show plan cards (apenas se pode vender) */}
        {!subscription && hasPlans && canSellPlatform && (
          <div className={styles.plansGrid}>
            {plans.map((plan) => {
              const priceId = resolvePlanPriceId(plan);
              const isRecommended = plan.tier === "pro";
              const features: string[] = Array.isArray(plan.features)
                ? plan.features
                : [];
              return (
                <section
                  key={plan.id}
                  className={`${styles.planCard} ${
                    isRecommended ? styles.planCardRecommended : ""
                  }`}
                >
                  {isRecommended && (
                    <span className={styles.recommendedBadge}>Recomendado</span>
                  )}
                  <h2 className={styles.planName}>{plan.name}</h2>
                  <p className={styles.planPrice}>
                    {formatPrice(plan.price_cents, plan.currency)}
                    <span className={styles.planInterval}>
                      /{plan.interval === "year" ? "ano" : "mês"}
                    </span>
                  </p>
                  <ul className={styles.featureList}>
                    {features.map((f, i) => (
                      <li key={i} className={styles.featureItem}>
                        <span className={styles.featureCheck}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => handleStartSubscription(priceId)}
                    disabled={!!actionLoading}
                    className={
                      isRecommended
                        ? styles.buttonPrimary
                        : styles.buttonSecondary
                    }
                  >
                    {actionLoading === priceId
                      ? "A redirecionar..."
                      : "Ativar agora"}
                  </button>
                </section>
              );
            })}
          </div>
        )}

        {/* Legacy fallback: single plan (when DB has no plans) */}
        {!subscription && !hasPlans && (
          <section className={styles.mainCard}>
            <p className={styles.noSubscriptionText}>
              Ainda não tem uma assinatura ativa. Assine um plano para passar a
              plano ativo (operação ao vivo).
            </p>
            {legacyPriceId && canSellPlatform && (
              <p className={styles.pricingText}>
                Plano — {formatPrice(7900, "EUR")}/mês
              </p>
            )}
            {canSellPlatform && (
              <button
                type="button"
                onClick={() => handleStartSubscription(legacyPriceId || "pro")}
                disabled={!!actionLoading}
                className={styles.buttonPrimary}
              >
                {actionLoading ? "A redirecionar..." : "Ativar agora"}
              </button>
            )}
            {!legacyPriceId && canSellPlatform && (
              <p className={styles.configMessage}>
                Configure VITE_STRIPE_PRICE_ID no ambiente para ativar o
                checkout.
              </p>
            )}
          </section>
        )}

        {/* Voltar */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className={styles.backButton}
        >
          ← Voltar ao Dashboard
        </button>
      </div>
    </div>
  );
}
