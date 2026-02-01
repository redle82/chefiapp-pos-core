/**
 * Stripe Billing Service
 *
 * SEU STRIPE - Para cobrar assinaturas dos restaurantes / hotéis / venues
 *
 * SEPARAÇÃO CLARA:
 * - Este serviço = VOCÊ cobra o estabelecimento (merchant/venue)
 * - StripeGatewayAdapter = Estabelecimento cobra o cliente final
 *
 * NUNCA misture os dois.
 */

import Stripe from 'stripe';
import { v4 as uuid } from 'uuid';
import {
  Subscription,
  SubscriptionStatus,
  Plan,
  PlanTier,
  BillingEvent,
  DEFAULT_PLANS,
  DEFAULT_ADDONS,
  AddOnType,
} from '../billing-core/types';
import { SubscriptionStateMachine, BILLING_GRACE_PERIODS } from '../billing-core/state-machine';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface StripeBillingConfig {
  /** SUA API key do Stripe (sk_live_xxx ou sk_test_xxx) */
  apiKey: string;
  /** SEU webhook secret (whsec_xxx) */
  webhookSecret: string;
  /** Modo de teste */
  testMode?: boolean;
}

// ============================================================================
// BUSINESS TYPES
// ============================================================================

export type BusinessType =
  | 'RESTAURANT'
  | 'HOTEL'
  | 'BAR'
  | 'CLUB'
  | 'CAFE'
  | 'OTHER';

// ============================================================================
// STRIPE BILLING SERVICE
// ============================================================================

export class StripeBillingService {
  private stripe: Stripe;
  private webhookSecret: string;

  // Mapeamento Plan/AddOn -> Stripe Price ID
  private priceMap: Map<string, string> = new Map();

  constructor(private config: StripeBillingConfig) {
    this.stripe = new Stripe(config.apiKey);
    this.webhookSecret = config.webhookSecret;
  }

  // ========================================================================
  // CUSTOMER MANAGEMENT
  // ========================================================================

  /**
   * Cria customer no SEU Stripe para o merchant/venue
   */
  async createCustomer(input: CreateCustomerInput): Promise<StripeCustomer> {
    const normalized = normalizeCustomerInput(input);

    const customer = await this.stripe.customers.create({
      email: normalized.email,
      name: normalized.business_name,
      metadata: {
        merchant_id: normalized.merchant_id,
        business_type: normalized.business_type,
        owner_name: normalized.owner_name || '',
      },
    });

    return {
      customer_id: customer.id,
      email: customer.email || normalized.email,
      merchant_id: normalized.merchant_id,
      business_type: normalized.business_type,
      created_at: new Date(customer.created * 1000),
    };
  }

  /**
   * Adiciona método de pagamento ao customer
   */
  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Define como default
    await this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  // ========================================================================
  // SUBSCRIPTION MANAGEMENT
  // ========================================================================

  /**
   * Cria subscription no Stripe
   */
  async createSubscription(input: CreateSubscriptionInput): Promise<StripeSubscriptionResult> {
    const normalized = normalizeSubscriptionInput(input);
    const priceId = await this.getOrCreatePrice(normalized.plan_id);

    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: normalized.customer_id,
      items: [{ price: priceId }],
      metadata: {
        merchant_id: normalized.merchant_id,
        plan_id: normalized.plan_id,
      },
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    };

    // Trial?
    const plan = DEFAULT_PLANS.find(p => p.plan_id === normalized.plan_id);
    if (plan && plan.trial_days > 0 && normalized.start_trial) {
      subscriptionParams.trial_period_days = plan.trial_days;
    }

    const subscription = await this.stripe.subscriptions.create(subscriptionParams);

    // Obter client_secret para o front-end confirmar pagamento/setup
    // Cenários:
    // 1. Trial com setup_intent → pending_setup_intent.client_secret
    // 2. Sem trial, payment required → latest_invoice.payment_intent.client_secret
    // 3. Payment method já existe → pode não precisar de client_secret
    let clientSecret: string | undefined;

    if (subscription.pending_setup_intent) {
      // Trial: setup intent para guardar método de pagamento
      const setupIntent =
        typeof subscription.pending_setup_intent === 'string'
          ? await this.stripe.setupIntents.retrieve(subscription.pending_setup_intent)
          : subscription.pending_setup_intent;
      clientSecret = setupIntent.client_secret ?? undefined;
    } else if (subscription.latest_invoice) {
      // Sem trial: payment intent na invoice
      const invoice = typeof subscription.latest_invoice === 'string'
        ? await this.stripe.invoices.retrieve(subscription.latest_invoice, {
            expand: ['payment_intent'],
          })
        : subscription.latest_invoice;
      
      // @ts-expect-error - payment_intent existe após expand
      const paymentIntent = invoice.payment_intent;
      if (paymentIntent && typeof paymentIntent !== 'string') {
        clientSecret = paymentIntent.client_secret ?? undefined;
      }
    }

    const item = subscription.items.data[0];
    const periodStart = item?.current_period_start ?? subscription.created;
    const periodEnd = item?.current_period_end ?? (subscription.created + 30 * 24 * 60 * 60);

    return {
      subscription_id: subscription.id,
      status: this.mapStripeStatus(subscription.status),
      client_secret: clientSecret,
      current_period_start: new Date(periodStart * 1000),
      current_period_end: new Date(periodEnd * 1000),
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
    };
  }

  /**
   * Cancela subscription
   */
  async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<void> {
    if (immediately) {
      await this.stripe.subscriptions.cancel(subscriptionId);
    } else {
      await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
  }

  /**
   * Reativa subscription cancelada
   */
  async reactivateSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  /**
   * Muda plano (upgrade/downgrade)
   */
  async changePlan(subscriptionId: string, newPlanId: string): Promise<StripeSubscriptionResult> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const newPriceId = await this.getOrCreatePrice(newPlanId);

    const updated = await this.stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
      metadata: {
        ...subscription.metadata,
        plan_id: newPlanId,
      },
    });

    const updatedItem = updated.items.data[0];
    const updatedPeriodStart = updatedItem?.current_period_start ?? updated.created;
    const updatedPeriodEnd = updatedItem?.current_period_end ?? (updated.created + 30 * 24 * 60 * 60);

    return {
      subscription_id: updated.id,
      status: this.mapStripeStatus(updated.status),
      current_period_start: new Date(updatedPeriodStart * 1000),
      current_period_end: new Date(updatedPeriodEnd * 1000),
    };
  }

  // ========================================================================
  // ADD-ONS (Usage-based ou fixed)
  // ========================================================================

  /**
   * Adiciona add-on à subscription
   */
  async addAddOn(subscriptionId: string, addonType: AddOnType, quantity: number = 1): Promise<void> {
    const addon = DEFAULT_ADDONS.find(a => a.type === addonType);
    if (!addon) {
      throw new Error(`Add-on ${addonType} not found`);
    }

    const priceId = await this.getOrCreateAddonPrice(addon.addon_id);

    await this.stripe.subscriptionItems.create({
      subscription: subscriptionId,
      price: priceId,
      quantity,
    });
  }

  /**
   * Remove add-on
   */
  async removeAddOn(subscriptionId: string, addonType: AddOnType): Promise<void> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const addon = DEFAULT_ADDONS.find(a => a.type === addonType);

    if (!addon) return;

    const priceId = this.priceMap.get(addon.addon_id);
    const item = subscription.items.data.find(i => i.price.id === priceId);

    if (item) {
      await this.stripe.subscriptionItems.del(item.id);
    }
  }

  // ========================================================================
  // WEBHOOK HANDLING
  // ========================================================================

  // Cache de eventos processados (em produção: usar Redis/DB)
  private processedEvents: Set<string> = new Set();

  /**
   * Verifica e processa webhook do SEU Stripe
   * 
   * IDEMPOTÊNCIA: Eventos são identificados por event.id
   * Se já processado, retorna sucesso sem reprocessar
   */
  async handleWebhook(rawPayload: string | Buffer, signature: string): Promise<BillingWebhookResult> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawPayload, signature, this.webhookSecret);
    } catch (err) {
      return {
        success: false,
        error: `Webhook signature verification failed: ${err}`,
      };
    }

    // IDEMPOTENCY CHECK: Já processamos este evento?
    if (this.processedEvents.has(event.id)) {
      return {
        success: true,
        event_type: event.type,
        event_id: event.id,
        already_processed: true,
      };
    }

    const result: BillingWebhookResult = {
      success: true,
      event_type: event.type,
      event_id: event.id,
    };

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        result.subscription_update = this.extractSubscriptionUpdate(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.deleted':
        result.subscription_update = {
          stripe_subscription_id: (event.data.object as Stripe.Subscription).id,
          status: 'CANCELLED',
        };
        break;

      case 'invoice.payment_succeeded':
        result.payment_event = {
          type: 'PAYMENT_SUCCEEDED',
          invoice_id: (event.data.object as Stripe.Invoice).id,
          amount_cents: (event.data.object as Stripe.Invoice).amount_paid,
        };
        break;

      case 'invoice.payment_failed':
        result.payment_event = {
          type: 'PAYMENT_FAILED',
          invoice_id: (event.data.object as Stripe.Invoice).id,
          amount_cents: (event.data.object as Stripe.Invoice).amount_due,
        };
        break;

      case 'customer.subscription.trial_will_end':
        result.trial_ending = {
          stripe_subscription_id: (event.data.object as Stripe.Subscription).id,
          trial_end: new Date((event.data.object as Stripe.Subscription).trial_end! * 1000),
        };
        break;

      case 'invoice.payment_action_required':
        // 3D Secure ou outra ação necessária
        result.action_required = {
          invoice_id: (event.data.object as Stripe.Invoice).id,
          hosted_invoice_url: (event.data.object as Stripe.Invoice).hosted_invoice_url || undefined,
        };
        break;
    }

    // Marcar como processado (idempotência)
    this.processedEvents.add(event.id);
    
    // Limpar cache antigo (manter últimos 10000 eventos)
    if (this.processedEvents.size > 10000) {
      const toDelete = Array.from(this.processedEvents).slice(0, 5000);
      toDelete.forEach(id => this.processedEvents.delete(id));
    }

    return result;
  }

  // ========================================================================
  // INVOICES & RECEIPTS
  // ========================================================================

  /**
   * Lista faturas do customer
   */
  async listInvoices(customerId: string): Promise<StripeInvoice[]> {
    const invoices = await this.stripe.invoices.list({
      customer: customerId,
      limit: 100,
    });

    return invoices.data.map(inv => ({
      invoice_id: inv.id,
      number: inv.number || '',
      status: inv.status || 'draft',
      amount_cents: inv.amount_due,
      amount_paid_cents: inv.amount_paid,
      currency: inv.currency,
      created_at: new Date(inv.created * 1000),
      paid_at: inv.status_transitions?.paid_at
        ? new Date(inv.status_transitions.paid_at * 1000)
        : undefined,
      pdf_url: inv.invoice_pdf || undefined,
      hosted_url: inv.hosted_invoice_url || undefined,
    }));
  }

  /**
   * Obtém próxima fatura (preview)
   */
  async getUpcomingInvoice(customerId: string): Promise<StripeInvoice | null> {
    try {
      const invoice = await this.stripe.invoices.createPreview({
        customer: customerId,
      });

      return {
        invoice_id: 'upcoming',
        number: '',
        status: 'draft',
        amount_cents: invoice.amount_due,
        amount_paid_cents: 0,
        currency: invoice.currency,
        created_at: new Date(),
      };
    } catch {
      return null;
    }
  }

  // ========================================================================
  // HELPERS
  // ========================================================================

  private async getOrCreatePrice(planId: string): Promise<string> {
    if (this.priceMap.has(planId)) {
      return this.priceMap.get(planId)!;
    }

    const plan = DEFAULT_PLANS.find(p => p.plan_id === planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    try {
      // Buscar price existente ou criar
      const prices = await this.stripe.prices.search({
        query: `metadata['plan_id']:'${planId}' AND active:'true'`,
      });

      if (prices.data.length > 0) {
        this.priceMap.set(planId, prices.data[0].id);
        return prices.data[0].id;
      }

      // Criar product + price
      const product = await this.stripe.products.create({
        name: `ChefIApp - ${plan.name}`,
        metadata: { plan_id: planId },
      });

      const price = await this.stripe.prices.create({
        product: product.id,
        unit_amount: plan.price_cents,
        currency: plan.currency.toLowerCase(),
        recurring: {
          interval: plan.billing_period === 'MONTHLY' ? 'month' : 'year',
        },
        metadata: { plan_id: planId },
      });

      this.priceMap.set(planId, price.id);
      return price.id;
    } catch (err) {
      throw new Error(`Failed to get/create price for plan ${planId}: ${err instanceof Error ? err.message : err}`);
    }
  }

  private async getOrCreateAddonPrice(addonId: string): Promise<string> {
    if (this.priceMap.has(addonId)) {
      return this.priceMap.get(addonId)!;
    }

    const addon = DEFAULT_ADDONS.find(a => a.addon_id === addonId);
    if (!addon) {
      throw new Error(`Add-on ${addonId} not found`);
    }

    const prices = await this.stripe.prices.search({
      query: `metadata['addon_id']:'${addonId}' AND active:'true'`,
    });

    if (prices.data.length > 0) {
      this.priceMap.set(addonId, prices.data[0].id);
      return prices.data[0].id;
    }

    const product = await this.stripe.products.create({
      name: `ChefI Add-on - ${addon.name}`,
      metadata: { addon_id: addonId },
    });

    const price = await this.stripe.prices.create({
      product: product.id,
      unit_amount: addon.price_cents,
      currency: addon.currency.toLowerCase(),
      recurring:
        addon.billing_period !== 'ONE_TIME'
          ? {
              interval: addon.billing_period === 'MONTHLY' ? 'month' : 'year',
            }
          : undefined,
      metadata: { addon_id: addonId },
    });

    this.priceMap.set(addonId, price.id);
    return price.id;
  }

  private mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    switch (status) {
      case 'trialing':
        return 'TRIAL';
      case 'active':
        return 'ACTIVE';
      case 'past_due':
        return 'PAST_DUE';
      case 'canceled':
      case 'unpaid':
      case 'incomplete_expired':  // Expirou sem pagar = cancelado
        return 'CANCELLED';
      case 'incomplete':
      case 'paused':              // Stripe pause feature
        return 'SUSPENDED';
      default:
        return 'SUSPENDED';
    }
  }

  private extractSubscriptionUpdate(sub: Stripe.Subscription): SubscriptionUpdate {
    const subItem = sub.items.data[0];
    const subPeriodStart = subItem?.current_period_start ?? sub.created;
    const subPeriodEnd = subItem?.current_period_end ?? (sub.created + 30 * 24 * 60 * 60);

    // Extrair merchant_id dos metadados (crucial para rastrear qual merchant)
    const merchantId = sub.metadata?.merchant_id;

    return {
      stripe_subscription_id: sub.id,
      merchant_id: merchantId,
      status: this.mapStripeStatus(sub.status),
      current_period_start: new Date(subPeriodStart * 1000),
      current_period_end: new Date(subPeriodEnd * 1000),
      cancel_at_period_end: sub.cancel_at_period_end,
      trial_end: sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
    };
  }
}

// ============================================================================
// INPUT NORMALIZATION (backward compatibility)
// ============================================================================

function normalizeCustomerInput(input: CreateCustomerInput): {
  merchant_id: string;
  email: string;
  business_name: string;
  owner_name?: string;
  business_type: BusinessType;
} {
  const merchant_id = input.merchant_id ?? input.restaurant_id;
  const business_name = input.business_name ?? input.restaurant_name;
  const business_type = input.business_type ?? 'RESTAURANT';

  if (!merchant_id) throw new Error('merchant_id (or restaurant_id) is required');
  if (!business_name) throw new Error('business_name (or restaurant_name) is required');

  return {
    merchant_id,
    email: input.email,
    business_name,
    owner_name: input.owner_name,
    business_type,
  };
}

function normalizeSubscriptionInput(input: CreateSubscriptionInput): {
  merchant_id: string;
  customer_id: string;
  plan_id: string;
  start_trial?: boolean;
} {
  const merchant_id = input.merchant_id ?? input.restaurant_id;
  if (!merchant_id) throw new Error('merchant_id (or restaurant_id) is required');

  return {
    merchant_id,
    customer_id: input.customer_id,
    plan_id: input.plan_id,
    start_trial: input.start_trial,
  };
}

// ============================================================================
// TYPES
// ============================================================================

export interface CreateCustomerInput {
  // NEW
  merchant_id?: string;
  business_name?: string;
  business_type?: BusinessType;

  // LEGACY (backward compatibility)
  restaurant_id?: string;
  restaurant_name?: string;

  email: string;
  owner_name?: string;
}

export interface StripeCustomer {
  customer_id: string;
  email: string;
  merchant_id: string;
  business_type: BusinessType;
  created_at: Date;
}

export interface CreateSubscriptionInput {
  // NEW
  merchant_id?: string;

  // LEGACY (backward compatibility)
  restaurant_id?: string;

  customer_id: string;
  plan_id: string;
  start_trial?: boolean;
}

export interface StripeSubscriptionResult {
  subscription_id: string;
  status: SubscriptionStatus;
  client_secret?: string;
  current_period_start: Date;
  current_period_end: Date;
  trial_end?: Date;
}

export interface SubscriptionUpdate {
  stripe_subscription_id: string;
  /** Extraído dos metadados da subscription */
  merchant_id?: string;
  status: SubscriptionStatus;
  current_period_start?: Date;
  current_period_end?: Date;
  cancel_at_period_end?: boolean;
  trial_end?: Date;
}

export interface BillingWebhookResult {
  success: boolean;
  error?: string;
  event_type?: string;
  event_id?: string;
  /** True se evento já foi processado antes (idempotência) */
  already_processed?: boolean;
  subscription_update?: SubscriptionUpdate;
  payment_event?: {
    type: 'PAYMENT_SUCCEEDED' | 'PAYMENT_FAILED';
    invoice_id: string;
    amount_cents: number;
  };
  trial_ending?: {
    stripe_subscription_id: string;
    trial_end: Date;
  };
  /** 3D Secure ou outra ação necessária do cliente */
  action_required?: {
    invoice_id: string;
    hosted_invoice_url?: string;
  };
}

export interface StripeInvoice {
  invoice_id: string;
  number: string;
  status: string;
  amount_cents: number;
  amount_paid_cents: number;
  currency: string;
  created_at: Date;
  paid_at?: Date;
  pdf_url?: string;
  hosted_url?: string;
}
