/**
 * Payment Schemas
 *
 * Schemas Zod para validação de payloads de pagamento.
 */

import { z } from "zod";

/** Schema para método de pagamento */
export const PaymentMethodSchema = z.enum([
  "cash",
  "card",
  "mbway",
  "pix",
  "sumup_eur",
  "loyalty",
]);

/** Schema para moeda */
export const CurrencySchema = z.enum([
  "BRL",
  "EUR",
  "USD",
  "GBP",
  "MXN",
  "CAD",
  "AUD",
]);

/** Schema para região de pagamento */
export const PaymentRegionSchema = z.enum([
  "BR",
  "PT",
  "ES",
  "EU",
  "US",
  "GB",
  "MX",
  "CA",
  "AU",
  "DEFAULT",
]);

/** Schema para parâmetros de criação de pagamento */
export const CreatePaymentParamsSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
  currency: CurrencySchema,
  restaurantId: z.string().min(1),
  description: z.string().optional(),
  operatorId: z.string().optional(),
  cashRegisterId: z.string().optional(),
  returnUrl: z.string().url().optional(),
});

/** Schema para resultado de PaymentIntent (Stripe) */
export const PaymentIntentResultSchema = z.object({
  id: z.string(),
  clientSecret: z.string(),
});

/** Schema para resultado de checkout Pix */
export const PixCheckoutResultSchema = z.object({
  provider: z.string(),
  payment_method: z.string(),
  country: z.string(),
  checkout_id: z.string(),
  checkout_reference: z.string(),
  status: z.string(),
  amount: z.number(),
  currency: z.string(),
  raw: z.unknown().optional(),
});

/** Schema para status de checkout Pix */
export const PixCheckoutStatusSchema = z.object({
  provider: z.string(),
  checkout_id: z.string(),
  status: z.string(),
  amount: z.number(),
  currency: z.string(),
  raw: z.unknown().optional(),
});

/** Schema para checkout SumUp */
export const SumUpCheckoutSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  status: z.string(),
  amount: z.number(),
  currency: z.string(),
  expiresAt: z.string(),
  reference: z.string(),
});

/** Schema para resultado de checkout SumUp */
export const SumUpCheckoutResultSchema = z.object({
  success: z.boolean(),
  checkout: SumUpCheckoutSchema,
  paymentId: z.string().optional(),
});

/** Schema para status de checkout SumUp */
export const SumUpCheckoutStatusSchema = z.object({
  success: z.boolean(),
  checkout: z.object({
    id: z.string(),
    status: z.string(),
    amount: z.number(),
    currency: z.string(),
    reference: z.string(),
    transactions: z.array(z.unknown()).optional(),
    validUntil: z.string().optional(),
  }),
});

/** Tipos inferidos dos schemas */
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type Currency = z.infer<typeof CurrencySchema>;
export type PaymentRegion = z.infer<typeof PaymentRegionSchema>;
export type CreatePaymentParams = z.infer<typeof CreatePaymentParamsSchema>;
export type PaymentIntentResult = z.infer<typeof PaymentIntentResultSchema>;
export type PixCheckoutResult = z.infer<typeof PixCheckoutResultSchema>;
export type PixCheckoutStatus = z.infer<typeof PixCheckoutStatusSchema>;
export type SumUpCheckoutResult = z.infer<typeof SumUpCheckoutResultSchema>;
export type SumUpCheckoutStatus = z.infer<typeof SumUpCheckoutStatusSchema>;
