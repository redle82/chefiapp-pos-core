import axios from "axios";

export interface CreateSumUpCheckoutInput {
  amount: number;
  checkoutReference: string;
  currency?: string;
  merchantCode?: string;
  description?: string;
  returnUrl?: string;
  paymentType?: string;
  country?: string;
}

export interface SumUpCheckoutResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  checkout_reference?: string;
  merchant_code?: string;
  date?: string;
  transactions?: Array<{
    id?: string;
    card?: {
      last_4_digits?: string;
      type?: string;
    };
  }>;
  [key: string]: unknown;
}

export function normalizeCheckoutAmount(value: number): number {
  return Number(value.toFixed(2));
}

export async function createSumUpCheckout(
  input: CreateSumUpCheckoutInput,
): Promise<SumUpCheckoutResponse> {
  const token = process.env.SUMUP_ACCESS_TOKEN;

  if (!token) {
    throw new Error("SUMUP_ACCESS_TOKEN is not configured");
  }

  const baseUrl = process.env.SUMUP_API_BASE_URL || "https://api.sumup.com";
  const merchantCode = input.merchantCode || process.env.SUMUP_MERCHANT_CODE;

  const payload: Record<string, unknown> = {
    checkout_reference: input.checkoutReference,
    amount: normalizeCheckoutAmount(input.amount),
    currency: input.currency || "EUR",
  };

  if (merchantCode) {
    payload.merchant_code = merchantCode;
  }

  if (input.description) {
    payload.description = input.description;
  }

  if (input.returnUrl) {
    payload.return_url = input.returnUrl;
  }

  if (input.paymentType) {
    payload.payment_type = input.paymentType;
  }

  if (input.country) {
    payload.country = input.country;
  }

  const response = await axios.post(`${baseUrl}/v0.1/checkouts`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });

  return response.data as SumUpCheckoutResponse;
}

export async function createSumUpPixCheckout(
  input: Omit<
    CreateSumUpCheckoutInput,
    "currency" | "paymentType" | "country"
  > & {
    currency?: string;
  },
): Promise<SumUpCheckoutResponse> {
  return createSumUpCheckout({
    ...input,
    currency: input.currency || "BRL",
    paymentType: "pix",
    country: "BR",
  });
}

export async function getSumUpCheckout(
  checkoutId: string,
): Promise<SumUpCheckoutResponse> {
  const token = process.env.SUMUP_ACCESS_TOKEN;

  if (!token) {
    throw new Error("SUMUP_ACCESS_TOKEN is not configured");
  }

  const baseUrl = process.env.SUMUP_API_BASE_URL || "https://api.sumup.com";

  const response = await axios.get(`${baseUrl}/v0.1/checkouts/${checkoutId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });

  return response.data as SumUpCheckoutResponse;
}
