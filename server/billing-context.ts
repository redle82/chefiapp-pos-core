import Stripe from 'stripe';
import { AddOnType, PlanTier, SubscriptionStatus } from '../billing-core/types';

// Mapeia status do Stripe para nosso status interno
const STATUS_MAP: Record<string, SubscriptionStatus> = {
  trialing: 'TRIAL',
  active: 'ACTIVE',
  past_due: 'PAST_DUE',
  canceled: 'CANCELLED',
  unpaid: 'SUSPENDED',
  incomplete: 'SUSPENDED',
  incomplete_expired: 'CANCELLED',
  paused: 'SUSPENDED',
};

function detectTier(productName: string, amount: number): PlanTier | null {
  const name = (productName || '').toLowerCase();
  if (name.includes('starter')) return 'STARTER';
  if (name.includes('professional')) return 'PROFESSIONAL';
  if (name.includes('enterprise')) return 'ENTERPRISE';

  // Fallback heurísticas
  if (amount === 2900) return 'STARTER';
  if (amount === 5900) return 'PROFESSIONAL';
  if (amount === 14900) return 'ENTERPRISE';
  return null;
}

function detectAddon(productName: string, amount: number): AddOnType | null {
  const name = (productName || '').toLowerCase();
  if (name.includes('reserva')) return 'RESERVATIONS';
  if (name.includes('web page') || name.includes('webpage')) return 'WEB_PAGE';
  if (name.includes('web experience') || name.includes('experience')) return 'WEB_EXPERIENCE';
  if (name.includes('multi-venue') || name.includes('multi venue') || name.includes('multi-location')) return 'MULTI_LOCATION';
  if (name.includes('white-label') || name.includes('white label')) return 'WHITE_LABEL';
  if (name.includes('analytics')) return 'ANALYTICS_PRO';
  if (name.includes('terminal')) return 'EXTRA_TERMINAL';

  if (amount === 1900) return 'RESERVATIONS';
  if (amount === 900) return 'WEB_PAGE';
  if (amount === 4900) return 'MULTI_LOCATION';
  if (amount === 9900) return 'WHITE_LABEL';
  if (amount === 1500) return 'EXTRA_TERMINAL';
  if (amount === 2900) return 'ANALYTICS_PRO';
  return null;
}

export async function getSubscriptionContextFromStripe(
  stripe: Stripe,
  subscriptionId: string
): Promise<{ status: SubscriptionStatus; tier: PlanTier; addons: AddOnType[]; raw_status: string }>
{
  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product'],
  });

  // Tipagem do Stripe v20 retorna Response<Subscription>.
  const subscription: any = sub;

  let tier: PlanTier = 'STARTER';
  let tierLocked = false;
  const addons: AddOnType[] = [];

  for (const item of sub.items.data) {
    const productName = (item.price.product as any)?.name || '';
    const amount = item.price.unit_amount || 0;

    if (!tierLocked) {
      const detectedTier = detectTier(productName, amount);
      if (detectedTier) {
        tier = detectedTier;
        tierLocked = true;
      }
    }

    const addon = detectAddon(productName, amount);
    if (addon) addons.push(addon);
  }

  const status = STATUS_MAP[subscription.status] || 'SUSPENDED';

  return {
    status,
    tier,
    addons,
    raw_status: subscription.status,
  };
}
