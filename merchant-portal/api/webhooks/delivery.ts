/**
 * POST /api/webhooks/delivery
 *
 * Receives order notifications from delivery platforms (Glovo, UberEats).
 * Validates API key, inserts into integration_orders, returns 200 immediately.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "../_lib/supabase";

type DeliveryPlatform = "glovo" | "uber_eats" | "unknown";

function identifyPlatform(req: VercelRequest): {
  platform: DeliveryPlatform;
  isValid: boolean;
} {
  const glovoKey = req.headers["x-glovo-api-key"] as string | undefined;
  const uberSignature = req.headers["x-uber-signature"] as string | undefined;
  const genericKey = req.headers["x-api-key"] as string | undefined;

  const expectedKey = process.env.DELIVERY_WEBHOOK_API_KEY;
  if (!expectedKey) {
    return { platform: "unknown", isValid: false };
  }

  if (glovoKey) {
    return { platform: "glovo", isValid: glovoKey === expectedKey };
  }

  if (uberSignature) {
    // UberEats uses HMAC signature; simplified check for now
    return { platform: "uber_eats", isValid: uberSignature === expectedKey };
  }

  if (genericKey) {
    return { platform: "unknown", isValid: genericKey === expectedKey };
  }

  return { platform: "unknown", isValid: false };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { platform, isValid } = identifyPlatform(req);

  if (!isValid) {
    res.status(401).json({ error: "Invalid or missing API key" });
    return;
  }

  const body = req.body;
  if (!body || typeof body !== "object") {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  // Return 200 immediately — process async below
  res.status(200).json({ received: true, platform });

  // Fire-and-forget insertion
  try {
    const supabase = getSupabaseAdmin();

    await supabase.from("integration_orders").insert({
      platform,
      external_order_id: body.order_id ?? body.id ?? null,
      restaurant_id: body.restaurant_id ?? null,
      payload: body,
      status: "pending",
      received_at: new Date().toISOString(),
    });
  } catch (err) {
    // Log but don't fail — we already returned 200
    console.error("Failed to insert delivery webhook:", err);
  }
}
