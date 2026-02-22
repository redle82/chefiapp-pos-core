type PaymentStatus =
  | "completed"
  | "failed"
  | "processing"
  | "pending"
  | "refunded";

export interface SumUpWebhookFields {
  eventId: string | null;
  eventType: string;
  paymentStatus: PaymentStatus;
  paymentAmount: number | null;
  merchantCode: string | null;
  paymentReference: string | null;
  orderId: string | null;
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return null;
}

function normalizeAmount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  if (Number.isInteger(value) && Math.abs(value) >= 1000) {
    return value / 100;
  }

  return value;
}

export function mapSumUpStatusToInternal(
  rawStatus?: string | null,
): PaymentStatus {
  const normalized = (rawStatus || "").trim().toLowerCase();

  if (
    [
      "successful",
      "succeeded",
      "paid",
      "completed",
      "settled",
      "approved",
    ].includes(normalized)
  ) {
    return "completed";
  }

  if (
    ["failed", "declined", "canceled", "cancelled", "error"].includes(
      normalized,
    )
  ) {
    return "failed";
  }

  if (["refunded", "refund", "partially_refunded"].includes(normalized)) {
    return "refunded";
  }

  if (
    ["processing", "in_progress", "pending_authorization"].includes(normalized)
  ) {
    return "processing";
  }

  return "pending";
}

export function extractSumUpWebhookFields(
  body: Record<string, any>,
): SumUpWebhookFields {
  const payload =
    (body?.payload as Record<string, any> | undefined) ||
    (body?.data as Record<string, any> | undefined) ||
    body;
  const metadata = (payload?.metadata as Record<string, any> | undefined) || {};

  const eventId =
    toStringOrNull(body?.id) ||
    toStringOrNull(body?.event_id) ||
    toStringOrNull(payload?.id) ||
    toStringOrNull(payload?.event_id) ||
    toStringOrNull(payload?.transaction_id) ||
    toStringOrNull(payload?.transaction_code);

  const eventType =
    toStringOrNull(payload?.event_type) ||
    toStringOrNull(body?.event_type) ||
    toStringOrNull(payload?.type) ||
    toStringOrNull(body?.type) ||
    "unknown";

  const merchantCode =
    toStringOrNull(payload?.merchant_code) ||
    toStringOrNull(payload?.merchantCode) ||
    toStringOrNull(body?.merchant_code);

  const paymentReference =
    toStringOrNull(payload?.transaction_code) ||
    toStringOrNull(payload?.transaction_id) ||
    toStringOrNull(payload?.payment_reference) ||
    toStringOrNull(body?.transaction_code);

  const orderId =
    toStringOrNull(payload?.order_id) ||
    toStringOrNull(body?.order_id) ||
    toStringOrNull(metadata?.order_id) ||
    toStringOrNull(metadata?.orderId);

  const rawStatus =
    toStringOrNull(payload?.status) ||
    toStringOrNull(payload?.transaction_status) ||
    toStringOrNull(body?.status) ||
    toStringOrNull(body?.transaction_status);

  const paymentAmount =
    normalizeAmount(payload?.amount) ||
    normalizeAmount(payload?.total_amount) ||
    normalizeAmount(payload?.price);

  return {
    eventId,
    eventType,
    paymentStatus: mapSumUpStatusToInternal(rawStatus),
    paymentAmount,
    merchantCode,
    paymentReference,
    orderId,
  };
}
