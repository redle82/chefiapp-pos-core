// @ts-nocheck
import type {
  AutoPromotion,
  Discount,
  LoyaltyConfig,
  NewDiscountInput,
  PromotionChannel,
} from "../types";

// TODO: integrar com engine real de fidelidade e gm_orders / gm_customers.

const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  pointsPerEuro: 1,
  pointsPerOrder: 0,
};

const loyaltyConfigByLocation: Record<string, LoyaltyConfig> = {};
const discountsByLocation: Record<string, Discount[]> = {};
const autoPromotionsByLocation: Record<string, AutoPromotion[]> = {};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getOrInitLoyaltyConfig(locationId: string): LoyaltyConfig {
  if (!loyaltyConfigByLocation[locationId]) {
    loyaltyConfigByLocation[locationId] = { ...DEFAULT_LOYALTY_CONFIG };
  }
  return loyaltyConfigByLocation[locationId];
}

function getOrInitDiscounts(locationId: string): Discount[] {
  if (!discountsByLocation[locationId]) {
    discountsByLocation[locationId] = [];
  }
  return discountsByLocation[locationId];
}

function getOrInitAutoPromotions(locationId: string): AutoPromotion[] {
  if (!autoPromotionsByLocation[locationId]) {
    // Inicializa com canais base sem desconto associado.
    const channels: PromotionChannel[] = ["WEB", "QR", "DELIVERY"];
    autoPromotionsByLocation[locationId] = channels.map((channel, index) => ({
      id: `ap_${channel.toLowerCase()}_${index}`,
      channel,
      discountId: "",
    }));
  }
  return autoPromotionsByLocation[locationId];
}

export async function getLoyaltyConfig(
  locationId: string,
): Promise<LoyaltyConfig> {
  await delay(150);
  return { ...getOrInitLoyaltyConfig(locationId) };
}

export async function updateLoyaltyConfig(
  locationId: string,
  partial: Partial<LoyaltyConfig>,
): Promise<LoyaltyConfig> {
  await delay(200);
  const current = getOrInitLoyaltyConfig(locationId);
  const next: LoyaltyConfig = {
    ...current,
    ...partial,
  };
  loyaltyConfigByLocation[locationId] = next;
  return { ...next };
}

export async function getDiscounts(locationId: string): Promise<Discount[]> {
  await delay(200);
  return [...getOrInitDiscounts(locationId)];
}

export async function createOrUpdateDiscount(
  locationId: string,
  input: NewDiscountInput,
): Promise<Discount> {
  await delay(250);
  const list = getOrInitDiscounts(locationId);

  if (input.id) {
    const idx = list.findIndex((d) => d.id === input.id);
    if (idx >= 0) {
      const updated: Discount = {
        ...list[idx],
        ...input,
        id: list[idx].id,
        active: input.active ?? list[idx].active,
      };
      list[idx] = updated;
      return { ...updated };
    }
  }

  const id =
    input.id ?? `disc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const discount: Discount = {
    id,
    name: input.name,
    description: input.description,
    type: input.type,
    value: input.value,
    active: input.active ?? true,
  };
  list.push(discount);
  return { ...discount };
}

export async function toggleDiscountActive(
  locationId: string,
  id: string,
  active: boolean,
): Promise<void> {
  await delay(150);
  const list = getOrInitDiscounts(locationId);
  const idx = list.findIndex((d) => d.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], active };
  }
}

export async function getAutoPromotions(
  locationId: string,
): Promise<AutoPromotion[]> {
  await delay(200);
  return [...getOrInitAutoPromotions(locationId)];
}

export async function updateAutoPromotion(
  locationId: string,
  input: AutoPromotion,
): Promise<AutoPromotion> {
  await delay(200);
  const list = getOrInitAutoPromotions(locationId);
  const idx = list.findIndex((ap) => ap.id === input.id);
  const next: AutoPromotion = { ...input };

  if (idx >= 0) {
    list[idx] = next;
  } else {
    list.push(next);
  }

  return { ...next };
}
