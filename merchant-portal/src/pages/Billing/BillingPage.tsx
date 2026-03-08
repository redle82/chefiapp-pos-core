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
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CONFIG } from "../../config";
import { BillingBroker } from "../../core/billing/BillingBroker";
import {
  getBillingPlanPrice,
  getBillingPlans,
  getRestaurantBillingCurrency,
  resolveStripePriceId,
  type BillingPlanPriceRow,
  type BillingPlanRow,
} from "../../core/billing/coreBillingApi";
import {
  currencyService,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
} from "../../core/currency/CurrencyService";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { useSubscription } from "../../hooks/useSubscription";
import { GlobalLoadingView } from "../../ui/design-system/components";
import styles from "./BillingPage.module.css";

/** Format price_cents to a human label, e.g. 4900 → "49" + symbol */
function formatPrice(priceCents: number, currency: string): string {
  const amount = Math.round(priceCents / 100);
  const symbol =
    SUPPORTED_CURRENCIES[currency as CurrencyCode]?.symbol ?? currency;
  return `${amount} ${symbol}`;
}

/** Resolve which price ID to send to the gateway. Currency from restaurant/tenant, never locale. */
function resolvePlanPriceId(
  plan: BillingPlanRow,
  currency: string,
  planPriceRow: BillingPlanPriceRow | null,
): string {
  return resolveStripePriceId(plan, currency, planPriceRow);
}

export function BillingPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subscription, loading, error, isActive } = useSubscription();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [plans, setPlans] = useState<BillingPlanRow[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [billingCurrency, setBillingCurrency] = useState<string>(
    currencyService.getDefaultCurrency(),
  );
  const [planPrices, setPlanPrices] = useState<
    Record<string, BillingPlanPriceRow | null>
  >({});
  const restaurantId = getTabIsolated("chefiapp_restaurant_id");

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

  // Billing currency from restaurant (country/currency), never from locale
  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    getRestaurantBillingCurrency(restaurantId).then((currency) => {
      if (!cancelled) setBillingCurrency(currency);
    });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  // Fetch plan prices for billing currency (billing_plan_prices)
  useEffect(() => {
    if (plans.length === 0) return;
    let cancelled = false;
    (async () => {
      const next: Record<string, BillingPlanPriceRow | null> = {};
      for (const plan of plans) {
        const row = await getBillingPlanPrice(plan.id, billingCurrency);
        if (!cancelled) next[plan.id] = row ?? null;
      }
      if (!cancelled) setPlanPrices((prev) => ({ ...prev, ...next }));
    })();
    return () => {
      cancelled = true;
    };
  }, [plans, billingCurrency]);

  useEffect(() => {
    if (searchParams.get("billing") === "cancel") {
      setActionError(t("common:billing.checkoutCanceled"));
      window.history.replaceState({}, "", "/app/billing");
    }
  }, [searchParams, t]);

  const handleStartSubscription = useCallback(
    async (priceId: string) => {
      if (!priceId) {
        setActionError(t("common:billing.priceNotConfigured"));
        return;
      }
      if (!restaurantId) {
        setActionError(t("common:billing.noRestaurant"));
        return;
      }
      setActionError(null);
      setActionLoading(priceId);
      try {
        const { url } = await BillingBroker.startSubscription(
          priceId,
          restaurantId,
        );
        if (url) window.location.href = url;
      } catch (e: unknown) {
        setActionError(
          e instanceof Error
            ? e.message
            : t("common:billing.errorStartCheckout"),
        );
      } finally {
        setActionLoading(null);
      }
    },
    [t, restaurantId],
  );

  const handleOpenPortal = useCallback(async () => {
    setActionError(null);
    setActionLoading("portal");
    try {
      const { url } = await BillingBroker.openCustomerPortal();
      if (url) window.location.href = url;
    } catch (e: unknown) {
      setActionError(
        e instanceof Error ? e.message : t("common:billing.errorOpenPortal"),
      );
    } finally {
      setActionLoading(null);
    }
  }, [t]);

  if (loading || plansLoading) {
    return (
      <GlobalLoadingView
        message={t("common:billing.loadingSubscription")}
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
          <h1 className={styles.title}>{t("common:billing.title")}</h1>
          <p className={styles.subtitle}>
            {subscription
              ? t("common:billing.subtitle")
              : t("common:billing.subtitleNoSubscription")}
          </p>
        </header>

        {/* Aviso: venda da plataforma só em chefiapp.com */}
        {!canSellPlatform && (
          <div className={styles.errorBox} role="alert">
            {t("common:billing.sellOnlyChefiapp")}{" "}
            <a href="https://www.chefiapp.com" rel="noopener noreferrer">
              chefiapp.com
            </a>
            . {t("common:billing.sellOnlyChefiappCta")}
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
              <span className={styles.statusLabel}>
                {t("common:billing.statusLabel")}
              </span>
              <p className={styles.statusValue}>
                {t(
                  `common:billing.subscriptionStatus.${subscription.status}`,
                ) ?? subscription.status}
              </p>
              <p className={styles.statusDetails}>
                {subscription.plan_tier} · {t("common:billing.nextPayment")}:{" "}
                {subscription.next_payment_at
                  ? new Date(subscription.next_payment_at).toLocaleDateString(
                      undefined,
                      { dateStyle: "medium" },
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
                    ? t("common:billing.redirecting")
                    : t("common:billing.activateNow")}
                </button>
              )}
              <button
                type="button"
                onClick={handleOpenPortal}
                disabled={!!actionLoading}
                className={styles.buttonSecondary}
              >
                {actionLoading === "portal"
                  ? t("common:billing.opening")
                  : t("common:billing.manageBilling")}
              </button>
            </div>
          </section>
        )}

        {/* No subscription: show plan cards (apenas se pode vender) */}
        {!subscription && hasPlans && canSellPlatform && (
          <div className={styles.plansGrid}>
            {plans.map((plan) => {
              const planPriceRow = planPrices[plan.id] ?? null;
              const priceId = resolvePlanPriceId(
                plan,
                billingCurrency,
                planPriceRow,
              );
              const displayCents =
                planPriceRow?.price_cents ?? plan.price_cents;
              const displayCurrency = planPriceRow?.currency ?? plan.currency;
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
                    <span className={styles.recommendedBadge}>
                      {t("common:billing.recommended")}
                    </span>
                  )}
                  <h2 className={styles.planName}>{plan.name}</h2>
                  <p className={styles.planPrice}>
                    {formatPrice(displayCents, displayCurrency)}
                    <span className={styles.planInterval}>
                      /
                      {plan.interval === "year"
                        ? t("common:billing.perYear")
                        : t("common:billing.perMonth")}
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
                      ? t("common:billing.redirecting")
                      : t("common:billing.activateNow")}
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
              {t("common:billing.noSubscription")}
            </p>
            {legacyPriceId && canSellPlatform && (
              <p className={styles.pricingText}>
                {t("common:billing.planPerMonth", {
                  price: formatPrice(7900, billingCurrency),
                })}
              </p>
            )}
            {canSellPlatform && (
              <button
                type="button"
                onClick={() => handleStartSubscription(legacyPriceId || "pro")}
                disabled={!!actionLoading}
                className={styles.buttonPrimary}
              >
                {actionLoading
                  ? t("common:billing.redirecting")
                  : t("common:billing.activateNow")}
              </button>
            )}
            {!legacyPriceId && canSellPlatform && (
              <p className={styles.configMessage}>
                {t("common:billing.configureStripe")}
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
          ← {t("common:billing.backToDashboard")}
        </button>
      </div>
    </div>
  );
}
