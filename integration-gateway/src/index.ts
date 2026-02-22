/**
 * Integration Gateway - Webhook Receiver
 *
 * Purpose: Receive webhooks from payment processors (SumUp, Stripe)
 * - Port: 4320 (configurable)
 * - Verify HMAC signatures
 * - Persist to database via RPC
 * - Handle retries & idempotency
 *
 * Run: SUPABASE_URL=... SUPABASE_ANON_KEY=... npm run dev:gateway
 */

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import path from "path";
import MonitoringService from "./services/monitoring";
import OutboundWebhookService from "./services/outbound";
import PaymentIntegrationService from "./services/payment-integration";
import {
  createSumUpCheckout,
  createSumUpPixCheckout,
  getSumUpCheckout,
} from "./services/sumup-checkout";
import { extractSumUpWebhookFields } from "./services/sumup-payment";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
app.use(express.json());

// Supabase client for RPC calls (service_role bypasses RLS for server-side ops)
const supabaseUrl = process.env.SUPABASE_URL || "http://localhost:3000";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "test-key";
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize outbound webhook service
const outboundService = new OutboundWebhookService();

// Initialize monitoring service
const monitoringService = MonitoringService;
const paymentIntegrationService = PaymentIntegrationService;

// Port configuration
const PORT = process.env.PORT || 4320;

// =============================================================================
// Health Check Endpoint
// =============================================================================

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "integration-gateway",
    version: "1.0.0",
  });
});

// =============================================================================
// SumUp Checkout API (Frontend Integration)
// =============================================================================
// POST /api/v1/sumup/checkout - Create SumUp checkout session
// GET /api/v1/sumup/checkout/:id - Get checkout status

/**
 * Authorization middleware
 * Validates Bearer token from Authorization header
 */
const requireAuth = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  const expectedToken =
    process.env.INTERNAL_API_TOKEN || "chefiapp-internal-token-dev";

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid Authorization header",
      timestamp: new Date().toISOString(),
    });
  }

  const token = authHeader.substring(7); // Remove "Bearer "
  if (token !== expectedToken) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid access token",
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

/**
 * POST /api/v1/sumup/checkout
 * Create SumUp checkout session for card payment
 *
 * Body:
 * - orderId: UUID (required)
 * - restaurantId: UUID (required)
 * - amount: number in cents (required)
 * - currency: string (default: EUR)
 * - description: string (optional)
 * - returnUrl: string (optional)
 *
 * Returns:
 * - checkoutId: SumUp checkout ID
 * - checkoutUrl: URL to redirect customer
 * - status: PENDING
 * - expiresAt: ISO timestamp
 */
app.post(
  "/api/v1/sumup/checkout",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const {
        orderId,
        restaurantId,
        amount,
        currency = "EUR",
        description,
        returnUrl,
      } = req.body;

      // Validation
      if (!orderId || !restaurantId || !amount) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Missing required fields: orderId, restaurantId, amount",
          timestamp: new Date().toISOString(),
        });
      }

      if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Amount must be a positive number (in cents)",
          timestamp: new Date().toISOString(),
        });
      }

      // Create SumUp checkout
      const checkoutInput = {
        amount: amount / 100, // Convert cents to EUR
        currency: currency,
        checkoutReference: orderId, // Link to our order ID
        description: description || `Order ${orderId.substring(0, 8)}`,
        merchantCode: process.env.SUMUP_MERCHANT_CODE,
        returnUrl:
          returnUrl ||
          `${
            process.env.FRONTEND_URL || "http://localhost:5175"
          }/payment/success`,
      };

      console.log("[SumUp Checkout] Creating checkout:", checkoutInput);
      const checkout = await createSumUpCheckout(checkoutInput);

      // Insert payment record in database
      const { data: paymentData, error: paymentError } = await supabase
        .from("gm_payments")
        .insert({
          restaurant_id: restaurantId,
          order_id: orderId,
          amount_cents: amount,
          currency: currency,
          payment_method: "card",
          payment_provider: "sumup",
          external_checkout_id: checkout.id,
          status: "pending",
          metadata: {
            checkout_url: checkout.checkout_url,
            merchant_code: checkout.merchant_code,
            valid_until: checkout.valid_until,
          },
        })
        .select()
        .single();

      if (paymentError) {
        console.error(
          "[SumUp Checkout] Failed to insert payment record:",
          paymentError,
        );
        // Continue even if DB insert fails - checkout is already created
      }

      res.status(201).json({
        success: true,
        checkout: {
          id: checkout.id,
          url: checkout.checkout_url,
          status: checkout.status,
          amount: checkout.amount,
          currency: checkout.currency,
          expiresAt: checkout.valid_until,
          reference: checkout.checkout_reference,
        },
        paymentId: paymentData?.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[SumUp Checkout] Error creating checkout:", error);
      res.status(500).json({
        error: "Failed to create checkout",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  },
);

/**
 * GET /api/v1/sumup/checkout/:id
 * Get SumUp checkout status
 *
 * Returns:
 * - checkoutId: SumUp checkout ID
 * - status: PENDING | PAID | FAILED | EXPIRED
 * - amount: number
 * - currency: string
 * - transactions: array of payment attempts
 */
app.get(
  "/api/v1/sumup/checkout/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const checkoutId = req.params.id;

      if (!checkoutId) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Missing checkout ID",
          timestamp: new Date().toISOString(),
        });
      }

      console.log("[SumUp Checkout] Fetching status:", checkoutId);
      const checkout = await getSumUpCheckout(checkoutId);

      // Update payment record if status changed
      if (checkout.status === "PAID") {
        const transactionId = checkout.transactions?.[0]?.id;
        const existingRecord = await supabase
          .from("gm_payments")
          .select("metadata")
          .eq("external_checkout_id", checkoutId)
          .single();

        const updatedMetadata = {
          ...(existingRecord.data?.metadata || {}),
          completed_at: new Date().toISOString(),
          transaction_id: transactionId,
          card_last4: checkout.transactions?.[0]?.card?.last_4_digits,
          card_type: checkout.transactions?.[0]?.card?.type,
        };

        await supabase
          .from("gm_payments")
          .update({
            status: "paid",
            external_payment_id: transactionId,
            metadata: updatedMetadata,
            updated_at: new Date().toISOString(),
          })
          .eq("external_checkout_id", checkoutId);
      }

      res.json({
        success: true,
        checkout: {
          id: checkout.id,
          status: checkout.status,
          amount: checkout.amount,
          currency: checkout.currency,
          reference: checkout.checkout_reference,
          transactions: checkout.transactions,
          validUntil: checkout.valid_until,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[SumUp Checkout] Error fetching status:", error);
      res.status(500).json({
        error: "Failed to fetch checkout status",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  },
);

// =============================================================================
// SumUp Webhook Receiver
// =============================================================================
// POST /api/v1/webhook/sumup
//
// SumUp sends payment completion webhooks here
// Signature verification: HMAC-SHA256 using SumUp API key

app.post("/api/v1/webhook/sumup", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-sumup-signature"] as string;
    const rawBody = JSON.stringify(req.body);
    const parsedWebhook = extractSumUpWebhookFields(req.body || {});

    // 1. Verify signature
    const secretKey = process.env.SUMUP_API_KEY;
    if (!secretKey) {
      console.warn(
        "SUMUP_API_KEY not configured, skipping signature verification",
      );
    } else if (!signature) {
      return res.status(401).json({
        error: "Missing X-SumUp-Signature header",
        timestamp: new Date().toISOString(),
      });
    } else {
      const expectedSignature = crypto
        .createHmac("sha256", secretKey)
        .update(rawBody)
        .digest("hex");

      const provided = Buffer.from(signature);
      const expected = Buffer.from(expectedSignature);

      if (
        provided.length !== expected.length ||
        !crypto.timingSafeEqual(provided, expected)
      ) {
        console.error("Invalid SumUp signature", {
          signature,
          expectedSignature,
        });
        return res.status(401).json({
          error: "Invalid signature",
          timestamp: new Date().toISOString(),
        });
      }
    }

    // 2. Extract event details
    const eventId = parsedWebhook.eventId;
    const eventType = parsedWebhook.eventType;

    if (!eventId) {
      return res.status(400).json({
        error: "Missing event ID in webhook payload",
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Call backend RPC to persist event
    const { data, error } = await supabase.rpc("process_webhook_event", {
      p_provider: "sumup",
      p_event_type: eventType,
      p_event_id: eventId,
      p_payload: req.body,
      p_signature: signature,
    });

    if (error) {
      console.error("RPC error:", error);
      return res.status(500).json({
        error: "Failed to process webhook",
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    const { data: webhookEvent, error: webhookReadError } = await supabase
      .from("webhook_events")
      .select("id")
      .eq("provider", "sumup")
      .eq("event_id", eventId)
      .maybeSingle();

    if (webhookReadError) {
      console.warn("Failed to load webhook event for payment sync", {
        eventId,
        error: webhookReadError.message,
      });
    }

    if (webhookEvent?.id) {
      const webhookPatch: Record<string, string> = {};

      if (parsedWebhook.merchantCode) {
        webhookPatch.merchant_code = parsedWebhook.merchantCode;
      }

      if (parsedWebhook.orderId) {
        webhookPatch.order_id = parsedWebhook.orderId;
      }

      if (parsedWebhook.paymentReference) {
        webhookPatch.payment_reference = parsedWebhook.paymentReference;
      }

      if (Object.keys(webhookPatch).length > 0) {
        const { error: webhookUpdateError } = await supabase
          .from("webhook_events")
          .update(webhookPatch)
          .eq("id", webhookEvent.id);

        if (webhookUpdateError) {
          console.warn("Failed to enrich webhook event fields", {
            eventId,
            error: webhookUpdateError.message,
          });
        }
      }

      // Fetch real checkout status from SumUp API (webhook only sends notification)
      let resolvedPaymentStatus: string = parsedWebhook.paymentStatus;
      let resolvedPaymentAmount = parsedWebhook.paymentAmount || 0;

      try {
        const checkout = await getSumUpCheckout(eventId);
        console.log("SumUp checkout fetched:", {
          id: checkout.id,
          status: checkout.status,
          amount: checkout.amount,
        });

        // Map SumUp checkout status to internal status
        const statusMap: Record<string, string> = {
          PAID: "paid",
          SUCCESSFUL: "paid",
          FAILED: "failed",
          EXPIRED: "failed",
          PENDING: "pending",
        };
        resolvedPaymentStatus =
          statusMap[checkout.status?.toUpperCase()] ||
          checkout.status?.toLowerCase() ||
          resolvedPaymentStatus;
        resolvedPaymentAmount =
          Math.round((checkout.amount || 0) * 100) || resolvedPaymentAmount;
      } catch (fetchError) {
        console.warn(
          "Failed to fetch SumUp checkout status, using webhook data",
          {
            eventId,
            error: fetchError instanceof Error ? fetchError.message : "Unknown",
          },
        );
      }

      const paymentSync =
        await paymentIntegrationService.updateOrderFromPaymentEvent(
          webhookEvent.id,
          resolvedPaymentStatus,
          resolvedPaymentAmount,
        );

      if (!paymentSync) {
        console.warn("SumUp payment sync did not update an order", {
          eventId,
          merchantCode: parsedWebhook.merchantCode,
          status: parsedWebhook.paymentStatus,
        });
      }
    }

    console.log("✓ SumUp webhook processed:", {
      eventId,
      provider: "sumup",
      event_type: eventType,
      payment_status: parsedWebhook.paymentStatus,
      merchant_code: parsedWebhook.merchantCode,
      timestamp: new Date().toISOString(),
    });

    // 4. Return success (idempotent)
    res.json({
      status: "received",
      event_id: eventId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

// =============================================================================
// Stripe Webhook Receiver (Future)
// =============================================================================
// POST /api/v1/webhook/stripe

app.post("/api/v1/webhook/stripe", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      return res.status(401).json({
        error: "Missing Stripe-Signature header",
        timestamp: new Date().toISOString(),
      });
    }

    // TODO: Implement Stripe signature verification
    // Stripe uses different signature format: timestamp.signature
    // Verify using stripe.webhooks.constructEvent()

    const eventId = req.body.id;

    // Call backend RPC
    const { data, error } = await supabase.rpc("process_webhook_event", {
      p_provider: "stripe",
      p_event_type: req.body.type,
      p_event_id: eventId,
      p_payload: req.body,
      p_signature: signature,
    });

    if (error) {
      console.error("Stripe webhook error:", error);
      return res.status(500).json({
        error: "Failed to process webhook",
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      status: "received",
      event_id: eventId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    res.status(500).json({
      error: "Internal server error",
      timestamp: new Date().toISOString(),
    });
  }
});

// =============================================================================
// Generic Webhook Receiver
// =============================================================================
// POST /api/v1/webhook/custom

app.post("/api/v1/webhook/custom", async (req: Request, res: Response) => {
  try {
    const { provider, event_type, event_id, payload, signature } = req.body;

    if (!provider || !event_id) {
      return res.status(400).json({
        error: "Missing required fields: provider, event_id",
        timestamp: new Date().toISOString(),
      });
    }

    const { data, error } = await supabase.rpc("process_webhook_event", {
      p_provider: provider,
      p_event_type: event_type || "custom",
      p_event_id: event_id,
      p_payload: payload || req.body,
      p_signature: signature,
    });

    if (error) {
      console.error("Custom webhook error:", error);
      return res.status(500).json({
        error: "Failed to process webhook",
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      status: "received",
      event_id: event_id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Custom webhook error:", error);
    res.status(500).json({
      error: "Internal server error",
      timestamp: new Date().toISOString(),
    });
  }
});

// =============================================================================
// Status & Metrics Endpoints
// =============================================================================

app.get("/api/v1/metrics", async (req: Request, res: Response) => {
  try {
    // Get webhook metrics from database
    const { data, error } = await supabase
      .from("webhook_events")
      .select("provider, status")
      .then((result) => {
        if (result.error) return result;

        const counts: Record<string, Record<string, number>> = {};
        result.data?.forEach((row) => {
          if (!counts[row.provider]) counts[row.provider] = {};
          counts[row.provider][row.status] =
            (counts[row.provider][row.status] || 0) + 1;
        });

        return { data: counts, error: null };
      });

    if (error) {
      throw error;
    }

    res.json({
      timestamp: new Date().toISOString(),
      metrics: data,
    });
  } catch (error) {
    console.error("Metrics error:", error);
    res.status(500).json({
      error: "Failed to fetch metrics",
      timestamp: new Date().toISOString(),
    });
  }
});

// =============================================================================
// Advanced Monitoring Endpoints (Day 6)
// =============================================================================

// Get per-restaurant webhook metrics
app.get(
  "/api/v1/monitoring/restaurant/:restaurantId",
  async (req: Request, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;

      const metrics = await monitoringService.getRestaurantMetrics(
        restaurantId,
        hours,
      );

      if (!metrics) {
        return res.json({
          restaurant_id: restaurantId,
          time_window_hours: hours,
          metrics: null,
          message: "No delivery data found for this restaurant",
        });
      }

      res.json({
        restaurant_id: restaurantId,
        time_window_hours: hours,
        metrics,
      });
    } catch (error) {
      console.error("[Gateway] Monitoring error:", error);
      res.status(500).json({
        error: "Failed to fetch restaurant metrics",
        timestamp: new Date().toISOString(),
      });
    }
  },
);

// Get failed deliveries requiring alert/intervention
app.get("/api/v1/monitoring/alerts", async (req: Request, res: Response) => {
  try {
    const maxAgeHours = req.query.maxAgeHours
      ? parseInt(req.query.maxAgeHours as string)
      : 1;
    const alerts = await monitoringService.getFailedDeliveries(maxAgeHours);

    res.json({
      max_age_hours: maxAgeHours,
      active_alerts: alerts.length,
      alerts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Gateway] Alerts error:", error);
    res.status(500).json({
      error: "Failed to fetch alerts",
      timestamp: new Date().toISOString(),
    });
  }
});

// Get system-wide performance metrics
app.get(
  "/api/v1/monitoring/performance",
  async (req: Request, res: Response) => {
    try {
      const metrics = await monitoringService.getPerformanceMetrics();

      const metricsMap: Record<string, any> = {};
      metrics.forEach((m) => {
        metricsMap[m.metric_name] = {
          value: m.metric_value,
          unit: m.measurement_unit,
          window_hours: m.time_window_hours,
        };
      });

      res.json({
        metrics: metricsMap,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Gateway] Performance metrics error:", error);
      res.status(500).json({
        error: "Failed to fetch performance metrics",
        timestamp: new Date().toISOString(),
      });
    }
  },
);

// Get payment-to-delivery latency metrics
app.get("/api/v1/monitoring/latency", async (req: Request, res: Response) => {
  try {
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
    const metrics = await monitoringService.getLatencyMetrics(hours);

    const summary: Record<string, any> = {};
    const hourly: any[] = [];

    metrics.forEach((m) => {
      if (m.breakdown_hour) {
        hourly.push({
          hour: m.breakdown_hour,
          latency_ms: m.metric_value,
          samples: m.sample_count,
        });
      } else {
        summary[m.metric_name] = {
          value: m.metric_value,
          unit: m.measurement_unit,
          samples: m.sample_count,
        };
      }
    });

    res.json({
      time_window_hours: hours,
      summary,
      hourly_breakdown: hourly,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Gateway] Latency metrics error:", error);
    res.status(500).json({
      error: "Failed to fetch latency metrics",
      timestamp: new Date().toISOString(),
    });
  }
});

// Get comprehensive monitoring dashboard
app.get("/api/v1/monitoring/dashboard", async (req: Request, res: Response) => {
  try {
    const restaurantId = req.query.restaurantId as string | undefined;
    const dashboard = await monitoringService.getDashboardSummary(restaurantId);

    res.json(dashboard);
  } catch (error) {
    console.error("[Gateway] Dashboard error:", error);
    res.status(500).json({
      error: "Failed to fetch monitoring dashboard",
      timestamp: new Date().toISOString(),
    });
  }
});

// =============================================================================
// Payment Integration Endpoints (Day 6 Phase 2)
// =============================================================================

// Create SumUp checkout (payment initiation)
app.post(
  "/api/v1/payment/sumup/checkout",
  async (req: Request, res: Response) => {
    try {
      const {
        order_id,
        amount,
        currency,
        description,
        merchant_code,
        return_url,
      } = req.body || {};

      if (!order_id || typeof order_id !== "string") {
        return res.status(400).json({
          error: "Missing required field: order_id",
        });
      }

      if (
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          error: "Missing or invalid required field: amount",
        });
      }

      const checkout = await createSumUpCheckout({
        amount,
        checkoutReference: order_id,
        currency: typeof currency === "string" ? currency : "EUR",
        merchantCode:
          typeof merchant_code === "string" ? merchant_code : undefined,
        description: typeof description === "string" ? description : undefined,
        returnUrl: typeof return_url === "string" ? return_url : undefined,
      });

      res.status(201).json({
        provider: "sumup",
        checkout_id: checkout.id,
        checkout_reference: checkout.checkout_reference || order_id,
        status: checkout.status,
        amount: checkout.amount,
        currency: checkout.currency,
        raw: checkout,
      });
    } catch (error) {
      console.error("[PaymentIntegration] SumUp checkout error:", error);
      res.status(500).json({
        error: "Failed to create SumUp checkout",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  },
);

// Create PIX checkout for Brazil (payment initiation)
app.post(
  "/api/v1/payment/pix/br/checkout",
  async (req: Request, res: Response) => {
    try {
      const { order_id, amount, description, merchant_code, return_url } =
        req.body || {};

      if (!order_id || typeof order_id !== "string") {
        return res.status(400).json({
          error: "Missing required field: order_id",
        });
      }

      if (
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          error: "Missing or invalid required field: amount",
        });
      }

      const checkout = await createSumUpPixCheckout({
        amount,
        checkoutReference: order_id,
        merchantCode:
          typeof merchant_code === "string" ? merchant_code : undefined,
        description: typeof description === "string" ? description : undefined,
        returnUrl: typeof return_url === "string" ? return_url : undefined,
      });

      res.status(201).json({
        provider: "sumup",
        payment_method: "pix",
        country: "BR",
        checkout_id: checkout.id,
        checkout_reference: checkout.checkout_reference || order_id,
        status: checkout.status,
        amount: checkout.amount,
        currency: checkout.currency,
        raw: checkout,
      });
    } catch (error) {
      console.error("[PaymentIntegration] SumUp PIX checkout error:", error);
      res.status(500).json({
        error: "Failed to create PIX checkout",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  },
);

// Get SumUp checkout status by id
app.get(
  "/api/v1/payment/sumup/checkout/:checkoutId",
  async (req: Request, res: Response) => {
    try {
      const { checkoutId } = req.params;

      if (!checkoutId || typeof checkoutId !== "string") {
        return res.status(400).json({
          error: "Missing required param: checkoutId",
        });
      }

      const checkout = await getSumUpCheckout(checkoutId);

      res.json({
        provider: "sumup",
        checkout_id: checkout.id,
        status: checkout.status,
        amount: checkout.amount,
        currency: checkout.currency,
        raw: checkout,
      });
    } catch (error) {
      console.error("[PaymentIntegration] SumUp checkout status error:", error);
      res.status(500).json({
        error: "Failed to fetch SumUp checkout status",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  },
);

// Resolve merchant code to restaurant
app.get(
  "/api/v1/payment/resolve-merchant/:merchantCode",
  async (req: Request, res: Response) => {
    try {
      const { merchantCode } = req.params;
      const provider = (req.query.provider as string) || "stripe";
      const result = await paymentIntegrationService.resolveMerchantCode(
        merchantCode,
        provider,
      );

      if (!result) {
        return res.status(404).json({
          error: "Merchant code not found",
          merchant_code: merchantCode,
          provider: provider,
        });
      }

      res.json(result);
    } catch (error) {
      console.error("[PaymentIntegration] Resolve merchant error:", error);
      res.status(500).json({
        error: "Failed to resolve merchant code",
        timestamp: new Date().toISOString(),
      });
    }
  },
);

// Get pending payments for a restaurant
app.get(
  "/api/v1/payment/pending/:restaurantId",
  async (req: Request, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const maxAge = req.query.maxAgeMinutes
        ? parseInt(req.query.maxAgeMinutes as string)
        : 60;
      const payments = await paymentIntegrationService.getPendingPayments(
        restaurantId,
        maxAge,
      );

      res.json({
        restaurant_id: restaurantId,
        pending_count: payments.length,
        payments: payments,
        max_age_minutes: maxAge,
      });
    } catch (error) {
      console.error("[PaymentIntegration] Get pending error:", error);
      res.status(500).json({
        error: "Failed to fetch pending payments",
        timestamp: new Date().toISOString(),
      });
    }
  },
);

// Get merchant code mappings for a restaurant
app.get(
  "/api/v1/payment/merchants/:restaurantId",
  async (req: Request, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const mappings = await paymentIntegrationService.getMerchantMappings(
        restaurantId,
      );

      res.json({
        restaurant_id: restaurantId,
        mapping_count: mappings.length,
        mappings: mappings,
      });
    } catch (error) {
      console.error("[PaymentIntegration] Get merchants error:", error);
      res.status(500).json({
        error: "Failed to fetch merchant mappings",
        timestamp: new Date().toISOString(),
      });
    }
  },
);

// Create/update merchant code mapping
app.post("/api/v1/payment/merchants", async (req: Request, res: Response) => {
  try {
    const { restaurant_id, provider, merchant_code, merchant_name } = req.body;

    if (!restaurant_id || !provider || !merchant_code) {
      return res.status(400).json({
        error:
          "Missing required fields: restaurant_id, provider, merchant_code",
      });
    }

    const result = await paymentIntegrationService.createMerchantMapping(
      restaurant_id,
      provider,
      merchant_code,
      merchant_name || "",
    );

    if (!result) {
      return res.status(400).json({
        error: "Failed to create merchant mapping",
      });
    }

    res.json(result);
  } catch (error) {
    console.error("[PaymentIntegration] Create merchant error:", error);
    res.status(500).json({
      error: "Failed to create merchant mapping",
      timestamp: new Date().toISOString(),
    });
  }
});

// Get payment summary for a restaurant
app.get(
  "/api/v1/payment/summary/:restaurantId",
  async (req: Request, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const summary = await paymentIntegrationService.getPaymentSummary(
        restaurantId,
      );

      res.json({
        restaurant_id: restaurantId,
        summary: summary,
      });
    } catch (error) {
      console.error("[PaymentIntegration] Summary error:", error);
      res.status(500).json({
        error: "Failed to fetch payment summary",
        timestamp: new Date().toISOString(),
      });
    }
  },
);

// Link a payment webhook event to an order
app.post("/api/v1/payment/link-order", async (req: Request, res: Response) => {
  try {
    const { order_id, webhook_event_id, payment_status, payment_amount } =
      req.body;

    if (!order_id || !webhook_event_id || !payment_status) {
      return res.status(400).json({
        error:
          "Missing required fields: order_id, webhook_event_id, payment_status",
      });
    }

    const result = await paymentIntegrationService.linkPaymentToOrder(
      order_id,
      webhook_event_id,
      payment_status,
      payment_amount || 0,
    );

    if (!result) {
      return res.status(400).json({
        error: "Failed to link payment to order",
      });
    }

    res.json(result);
  } catch (error) {
    console.error("[PaymentIntegration] Link order error:", error);
    res.status(500).json({
      error: "Failed to link payment to order",
      timestamp: new Date().toISOString(),
    });
  }
});

// Update order from payment webhook event (main integration)
app.post(
  "/api/v1/payment/update-from-event",
  async (req: Request, res: Response) => {
    try {
      const { webhook_event_id, payment_status, payment_amount } = req.body;

      if (!webhook_event_id || !payment_status) {
        return res.status(400).json({
          error: "Missing required fields: webhook_event_id, payment_status",
        });
      }

      const result =
        await paymentIntegrationService.updateOrderFromPaymentEvent(
          webhook_event_id,
          payment_status,
          payment_amount || 0,
        );

      if (!result) {
        return res.status(400).json({
          error: "Failed to update order from payment event",
        });
      }

      res.json(result);
    } catch (error) {
      console.error("[PaymentIntegration] Update from event error:", error);
      res.status(500).json({
        error: "Failed to update order from payment event",
        timestamp: new Date().toISOString(),
      });
    }
  },
);

app.post(
  "/api/v1/webhooks/process-deliveries",
  async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const result = await outboundService.processPendingDeliveries(limit);

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        processed: result,
      });
    } catch (error) {
      console.error("Delivery processing error:", error);
      res.status(500).json({
        error: "Failed to process deliveries",
        timestamp: new Date().toISOString(),
      });
    }
  },
);

// =============================================================================
// Outbound Webhook Background Worker
// =============================================================================
// Periodically processes pending webhook deliveries with exponential backoff
// Restarts every 30 seconds to handle timing-sensitive retries

let workerIsRunning = false;

async function startOutboundWebhookWorker() {
  if (workerIsRunning) return;
  workerIsRunning = true;

  console.log(
    "[Worker] Starting outbound webhook delivery worker (30s interval)",
  );

  const processDeliveries = async () => {
    try {
      const result = await outboundService.processPendingDeliveries(50);
      if (result.total > 0) {
        console.log(
          `[Worker] Processed ${result.total} deliveries (${result.successful} success, ${result.failed} will retry)`,
        );
      }
    } catch (error) {
      console.error(
        "[Worker] Error processing deliveries:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }

    // Schedule next run
    setTimeout(processDeliveries, 30000); // 30 second interval
  };

  // Start processing
  processDeliveries();
}

// =============================================================================
// Start Server
// =============================================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          Integration Gateway - Webhook Receiver           ║
╚════════════════════════════════════════════════════════════╝

✓ Server running on port ${PORT}
✓ Health check: GET /health
✓ SumUp webhook: POST /api/v1/webhook/sumup
✓ Stripe webhook: POST /api/v1/webhook/stripe
✓ Custom webhook: POST /api/v1/webhook/custom
✓ Metrics: GET /api/v1/metrics
✓ Manual delivery process: POST /api/v1/webhooks/process-deliveries

Environment:
  - Supabase URL: ${supabaseUrl}
  - Port: ${PORT}
  - SumUp API Key: ${
    process.env.SUMUP_API_KEY ? "✓ Configured" : "⚠ Not configured"
  }

Ready to accept webhooks!
  `);

  // Start background worker for outbound webhook delivery
  startOutboundWebhookWorker();
});

// =============================================================================
// Error Handling
// =============================================================================

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

export default app;
