interface ResolveInput {
  provider: string;
  orderId?: string | null;
  merchantCode?: string | null;
  paymentReference?: string | null;
  eventId?: string | null;
}

interface PaymentLookupResult {
  restaurantId: string | null;
  orderId: string | null;
}

export interface RestaurantResolutionRepository {
  findRestaurantByOrderId(orderId: string): Promise<string | null>;
  findRestaurantByMerchantCode(
    merchantCode: string,
    provider: string,
  ): Promise<string | null>;
  findPaymentByExternalRef(
    externalRef: string,
  ): Promise<PaymentLookupResult | null>;
}

function normalize(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function resolveRestaurantIdFromPaymentContext(
  input: ResolveInput,
  repository: RestaurantResolutionRepository,
): Promise<string | null> {
  const provider = normalize(input.provider) || "sumup";
  const orderId = normalize(input.orderId);
  const merchantCode = normalize(input.merchantCode);
  const paymentReference = normalize(input.paymentReference);
  const eventId = normalize(input.eventId);

  if (orderId) {
    const restaurantId = await repository.findRestaurantByOrderId(orderId);
    if (restaurantId) return restaurantId;
  }

  if (merchantCode) {
    const restaurantId = await repository.findRestaurantByMerchantCode(
      merchantCode,
      provider,
    );
    if (restaurantId) return restaurantId;
  }

  const references = [paymentReference, eventId].filter(
    (value): value is string => value !== null,
  );

  for (const reference of references) {
    const payment = await repository.findPaymentByExternalRef(reference);
    if (!payment) continue;

    if (payment.restaurantId) {
      return payment.restaurantId;
    }

    if (payment.orderId) {
      const restaurantId = await repository.findRestaurantByOrderId(
        payment.orderId,
      );
      if (restaurantId) return restaurantId;
    }
  }

  return null;
}

export function createSupabaseRestaurantResolutionRepository(
  supabase: any,
): RestaurantResolutionRepository {
  return {
    async findRestaurantByOrderId(orderId: string): Promise<string | null> {
      const { data, error } = await supabase
        .from("gm_orders")
        .select("restaurant_id")
        .eq("id", orderId)
        .maybeSingle();

      if (error) return null;
      return normalize(data?.restaurant_id ?? null);
    },

    async findRestaurantByMerchantCode(
      merchantCode: string,
      provider: string,
    ): Promise<string | null> {
      const { data, error } = await supabase.rpc(
        "resolve_restaurant_from_merchant_code",
        {
          p_merchant_code: merchantCode,
          p_provider: provider,
        },
      );

      if (error || !Array.isArray(data) || data.length === 0) return null;
      return normalize(data[0]?.restaurant_id ?? null);
    },

    async findPaymentByExternalRef(
      externalRef: string,
    ): Promise<PaymentLookupResult | null> {
      const lookups = ["external_payment_id", "external_checkout_id"];

      for (const field of lookups) {
        const { data, error } = await supabase
          .from("gm_payments")
          .select("restaurant_id,order_id")
          .eq(field, externalRef)
          .maybeSingle();

        if (error) continue;
        if (data) {
          return {
            restaurantId: normalize(data.restaurant_id ?? null),
            orderId: normalize(data.order_id ?? null),
          };
        }
      }

      return null;
    },
  };
}
