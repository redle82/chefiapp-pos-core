/**
 * useSubscriptionPage — Aggregates all data the SubscriptionPage needs.
 *
 * Sources:
 *   - Plans: Core DB (billing_plans table); empty when table missing/empty
 *   - Subscription: useSubscription hook (Core DB)
 *   - Invoices: Core DB (billing_invoices table)
 *   - Usage: Core when available; empty array until tracking infra exists
 *   - Billing summary: Derived from subscription + plan data
 *   - Payment method: from Core/Stripe when available; empty placeholder otherwise
 */

import { useCallback, useEffect, useState } from "react";
import type { PlanTier } from "../../../../../../billing-core/types";
import {
  getBillingInvoices,
  getBillingPlans,
  type BillingInvoiceRow,
  type BillingPlanRow,
} from "../../../core/billing/coreBillingApi";
import { getTabIsolated } from "../../../core/storage/TabIsolatedStorage";
import {
  useSubscription,
  type Subscription,
} from "../../../hooks/useSubscription";
import type {
  BillingSummary,
  Invoice,
  PaymentMethod,
  Plan,
  UsageMeter,
} from "./types";

const EMPTY_USAGE: UsageMeter[] = [];
const EMPTY_PAYMENT: PaymentMethod = {
  brand: "",
  last4: "",
  failureDeadline: null,
};

/** Convert DB plan row to UI Plan interface */
function toUIPlan(
  row: BillingPlanRow,
  currentPlanId: string | null,
  trialEnd?: string | null,
): Plan {
  return {
    id: row.id,
    name: row.name,
    tier: row.tier as PlanTier,
    priceCents: row.price_cents,
    currency: row.currency,
    interval: row.interval as "month" | "year",
    features: Array.isArray(row.features) ? row.features : [],
    maxDevices: row.max_devices,
    maxIntegrations: row.max_integrations,
    maxDeliveryOrders: row.max_delivery_orders,
    isCurrent: row.id === currentPlanId,
    trialEndsAt: row.id === currentPlanId ? trialEnd : undefined,
    stripePriceId: row.stripe_price_id ?? null,
  };
}

/** Convert DB invoice row to UI Invoice interface */
function toUIInvoice(row: BillingInvoiceRow): Invoice {
  return {
    id: row.id,
    date: row.invoice_date,
    amountEur: row.amount_cents / 100,
    status:
      row.status === "paid" ||
      row.status === "pending" ||
      row.status === "failed"
        ? row.status
        : "pending",
    downloadUrl: row.pdf_url,
  };
}

/** Derive billing summary from subscription + plan data */
function deriveBillingSummary(
  sub: Subscription | null,
  plan: Plan | undefined,
): BillingSummary {
  const priceCents = plan?.priceCents ?? 0;
  const subtotal = priceCents / 100;
  const tax = Math.round(subtotal * 0.21 * 100) / 100; // 21% IVA
  return {
    cycle: (plan?.interval ?? "month") as "monthly" | "yearly",
    nextChargeAt: sub?.current_period_end ?? "",
    subtotalEur: subtotal,
    taxEur: tax,
    totalEur: Math.round((subtotal + tax) * 100) / 100,
    planLabel: plan?.name ? `${plan.name} Plan` : "—",
    canSwitchToYearly: true,
  };
}

export interface SubscriptionPageData {
  plans: Plan[];
  usage: UsageMeter[];
  billingSummary: BillingSummary;
  paymentMethod: PaymentMethod;
  billingEmail: string;
  invoices: Invoice[];
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSubscriptionPage(): SubscriptionPageData {
  const {
    subscription,
    loading: subLoading,
    error: subError,
    refetch: refetchSub,
  } = useSubscription();
  const restaurantId = getTabIsolated("chefiapp_restaurant_id");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPageData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch plans from Core DB
      const planRows = await getBillingPlans();
      const currentPlanId = subscription?.plan_id ?? null;
      const trialEnd = subscription?.trial_ends_at ?? null;

      if (planRows.length > 0) {
        setPlans(
          planRows.map((r: BillingPlanRow) =>
            toUIPlan(r, currentPlanId, trialEnd),
          ),
        );
      } else {
        // Fallback: um plano (Starter) quando a tabela billing_plans está vazia ou indisponível
        setPlans([
          toUIPlan(
            {
              id: "starter",
              name: "Starter",
              tier: "starter",
              price_cents: 4900,
              currency: "EUR",
              interval: "month",
              features: [
                "Software TPV (1 dispositivo)",
                "E-mail e SMS de confirmação",
                "Notificações de fecho",
                "Telemetria integrada",
              ],
              max_devices: 1,
              max_integrations: 0,
              max_delivery_orders: 0,
              sort_order: 0,
              active: true,
            } as BillingPlanRow,
            currentPlanId,
            trialEnd,
          ),
        ]);
      }

      // Fetch invoices from Core DB
      if (restaurantId) {
        const invoiceRows = await getBillingInvoices(restaurantId);
        setInvoices(invoiceRows.map(toUIInvoice));
      }
    } catch (err: unknown) {
      console.error("[useSubscriptionPage]", err);
      setError(
        err instanceof Error ? err.message : "Failed to load billing data",
      );
    } finally {
      setLoading(false);
    }
  }, [subscription?.plan_id, subscription?.trial_ends_at, restaurantId]);

  useEffect(() => {
    if (!subLoading) {
      fetchPageData();
    }
  }, [subLoading, fetchPageData]);

  const refetch = useCallback(async () => {
    await refetchSub();
    await fetchPageData();
  }, [refetchSub, fetchPageData]);

  // Derive billing summary from current plan
  const currentPlan = plans.find((p) => p.isCurrent);
  const billingSummary = deriveBillingSummary(subscription, currentPlan);

  return {
    plans,
    usage: EMPTY_USAGE,
    billingSummary,
    paymentMethod: EMPTY_PAYMENT,
    billingEmail: "",
    invoices,
    subscription,
    loading: loading || subLoading,
    error: error || subError,
    refetch,
  };
}
