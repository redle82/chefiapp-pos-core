import crypto from "crypto";

type StripeSignatureResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
    };

function normalizeHexSignature(signature: string | undefined | null): string {
  if (!signature) return "";
  return signature.startsWith("sha256=")
    ? signature.slice("sha256=".length)
    : signature;
}

function timingSafeHexEqual(leftHex: string, rightHex: string): boolean {
  const left = Buffer.from(leftHex, "utf8");
  const right = Buffer.from(rightHex, "utf8");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function parseStripeHeader(
  signatureHeader: string,
): { timestamp: number; signatures: string[] } | null {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestampEntry = parts.find((part) => part.startsWith("t="));
  const signatureEntries = parts.filter((part) => part.startsWith("v1="));

  if (!timestampEntry || signatureEntries.length === 0) {
    return null;
  }

  const timestamp = Number(timestampEntry.slice(2));
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  const signatures = signatureEntries
    .map((entry) => entry.slice(3))
    .filter((entry) => entry.length > 0);

  if (signatures.length === 0) {
    return null;
  }

  return { timestamp, signatures };
}

export function verifyStripeSignature(
  payload: string,
  signatureHeader: string | undefined,
  webhookSecret: string | undefined,
  toleranceSeconds = 300,
): StripeSignatureResult {
  if (!signatureHeader?.trim()) {
    return { ok: false, error: "Missing Stripe-Signature header" };
  }

  if (!webhookSecret?.trim()) {
    return { ok: false, error: "Missing STRIPE_WEBHOOK_SECRET" };
  }

  const parsed = parseStripeHeader(signatureHeader);
  if (!parsed) {
    return { ok: false, error: "Malformed Stripe-Signature header" };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const age = Math.abs(nowSeconds - parsed.timestamp);
  if (age > toleranceSeconds) {
    return { ok: false, error: "Stripe webhook timestamp outside tolerance" };
  }

  const signedPayload = `${parsed.timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const isValid = parsed.signatures.some((candidate) =>
    timingSafeHexEqual(candidate, expectedSignature),
  );

  if (!isValid) {
    return { ok: false, error: "Invalid Stripe signature" };
  }

  return { ok: true };
}

export function verifySumUpSignature(
  payload: string,
  signatureHeader: string | undefined,
  secretKey: string | undefined,
): boolean {
  if (!signatureHeader?.trim() || !secretKey?.trim()) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(payload, "utf8")
    .digest("hex");

  const providedSignature = normalizeHexSignature(signatureHeader.trim());
  return timingSafeHexEqual(providedSignature, expectedSignature);
}

type RawBodyRequest = { rawBody?: string; body?: unknown };

export function getRawBody(req: RawBodyRequest): string {
  const rawRequest = req;
  if (typeof rawRequest.rawBody === "string" && rawRequest.rawBody.length > 0) {
    return rawRequest.rawBody;
  }
  return JSON.stringify(req.body ?? {});
}
