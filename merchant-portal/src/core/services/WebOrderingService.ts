/**
 * WEB ORDERING SERVICE
 *
 * Handles public web orders with smart routing:
 * - If restaurant has auto_accept_web_orders = true → Direct to gm_orders
 * - Otherwise → Airlock queue (gm_order_requests) for manual approval
 *
 * Security layers:
 * - Idempotency: Prevents duplicate orders from double-clicks or network retries
 * - Rate limiting: Prevents spam/flood attacks
 *
 * Reliability layers:
 * - Retry with exponential backoff: 3 attempts (1s → 2s → 4s)
 * - Progress callbacks: UI feedback during submission
 * - Uncertainty state: Clear messaging when outcome is unknown
 *
 * @constitutional This service is the bridge between public web and sovereign order system.
 */

// LEGACY / LAB — order creation via CoreOrdersApi; supabase for protection/airlock when not Docker
import { createOrderAtomic } from "../infra/CoreOrdersApi";
import { supabase } from "../supabase";
import { checkOrderProtection, recordOrderSubmission } from "./OrderProtection";

// ─────────────────────────────────────────────────────────────────────────────
// RETRY CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY_MS: 1000, // 1s → 2s → 4s (exponential)
  TIMEOUT_MS: 15000, // 15s per attempt
  TOTAL_TIMEOUT_MS: 30000, // 30s max total
};

export interface SubmissionProgress {
  attempt: number;
  maxAttempts: number;
  phase:
    | "SENDING"
    | "WAITING"
    | "RETRYING"
    | "SUCCESS"
    | "FAILED"
    | "UNCERTAIN";
  message: string;
}

export interface WebOrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price_cents: number;
  notes?: string;
}

export interface WebOrderInput {
  restaurant_id: string;
  items: WebOrderItem[];
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  table_number?: number;
  notes?: string;
  // Payment Details
  payment_status?: "pending" | "paid";
  payment_method?: "cash" | "card" | "online";
  transaction_id?: string;
}

export interface WebOrderResult {
  success: boolean;
  order_id?: string;
  request_id?: string;
  status:
    | "ACCEPTED"
    | "PENDING_APPROVAL"
    | "REJECTED"
    | "BLOCKED"
    | "UNCERTAIN";
  message: string;
  /** If blocked by protection, includes reason */
  blockReason?: "DUPLICATE" | "RATE_LIMITED";
  /** Seconds to wait before retry (rate limit) */
  retryAfterSeconds?: number;
  /** If uncertain, suggests next action */
  nextAction?: "WAIT_AND_CHECK" | "CONTACT_RESTAURANT";
}

export interface RestaurantWebConfig {
  restaurant_id: string;
  tenant_id: string;
  name: string;
  slug: string;
  web_ordering_enabled: boolean;
  auto_accept_web_orders: boolean;
}

/**
 * WebOrderingService - Public Order Gateway
 */
export const WebOrderingService = {
  /**
   * Get restaurant web configuration
   */
  async getWebConfig(slug: string): Promise<RestaurantWebConfig | null> {
    const { data, error } = await (supabase as any)
      .from("gm_restaurants")
      .select("id, name, slug, web_ordering_enabled, auto_accept_web_orders")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      console.error("[WebOrderingService] Config fetch failed:", error);
      return null;
    }

    return {
      restaurant_id: data.id,
      tenant_id: data.id, // ID is the tenant_id in Sovereign Architecture
      name: data.name,
      slug: data.slug,
      web_ordering_enabled: data.web_ordering_enabled ?? true,
      auto_accept_web_orders: data.auto_accept_web_orders ?? false,
    };
  },

  /**
   * Submit order with automatic retry and progress callbacks
   *
   * This is the PRIMARY method for submitting orders.
   * Includes exponential backoff retry (1s → 2s → 4s).
   *
   * @param input Order data
   * @param onProgress Optional callback for UI progress updates
   * @param origin Optional origin override (default: 'WEB_PUBLIC')
   * @param tableId Optional table_id UUID (for QR_MESA orders)
   */
  async submitOrderWithRetry(
    input: WebOrderInput,
    onProgress?: (progress: SubmissionProgress) => void,
    origin: string = "WEB_PUBLIC",
    tableId?: string
  ): Promise<WebOrderResult> {
    const notify = (progress: SubmissionProgress) => {
      console.log(
        `[WebOrderingService] ${progress.phase}: ${progress.message}`
      );
      onProgress?.(progress);
    };

    // 🛡️ PROTECTION CHECK FIRST (no retry needed for these)
    const protection = checkOrderProtection(
      input.restaurant_id,
      input.items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
      })),
      input.table_number
    );

    if (!protection.allowed) {
      console.warn("[WebOrderingService] Order blocked:", protection.reason);

      if (protection.reason === "DUPLICATE") {
        notify({
          attempt: 1,
          maxAttempts: 1,
          phase: "FAILED",
          message: "Este pedido já foi enviado",
        });
        return {
          success: false,
          status: "BLOCKED",
          message: "Este pedido já foi enviado. Verifique o status abaixo.",
          blockReason: "DUPLICATE",
          order_id: protection.existingOrderId,
          request_id: protection.existingRequestId,
        };
      }

      notify({
        attempt: 1,
        maxAttempts: 1,
        phase: "FAILED",
        message: `Aguarde ${protection.retryAfterSeconds}s para tentar novamente`,
      });
      return {
        success: false,
        status: "BLOCKED",
        message: "Muitos pedidos. Aguarde um momento.",
        blockReason: "RATE_LIMITED",
        retryAfterSeconds: protection.retryAfterSeconds,
      };
    }

    // RETRY LOOP
    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= RETRY_CONFIG.MAX_ATTEMPTS; attempt++) {
      // Check total timeout
      if (Date.now() - startTime > RETRY_CONFIG.TOTAL_TIMEOUT_MS) {
        break;
      }

      // Progress: Starting attempt
      notify({
        attempt,
        maxAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
        phase: attempt === 1 ? "SENDING" : "RETRYING",
        message:
          attempt === 1
            ? "Enviando seu pedido..."
            : `Reconectando... (tentativa ${attempt}/${RETRY_CONFIG.MAX_ATTEMPTS})`,
      });

      try {
        // Actual submission with timeout
        const result = await Promise.race([
          this._submitOrderInternal(input, origin, tableId),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("TIMEOUT")),
              RETRY_CONFIG.TIMEOUT_MS
            )
          ),
        ]);

        // SUCCESS!
        notify({
          attempt,
          maxAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
          phase: "SUCCESS",
          message:
            result.status === "ACCEPTED"
              ? "Pedido confirmado!"
              : "Pedido enviado! Aguardando confirmação.",
        });

        return result;
      } catch (err: any) {
        lastError = err;
        console.warn(
          `[WebOrderingService] Attempt ${attempt} failed:`,
          err.message
        );

        // If not last attempt, wait before retry
        if (attempt < RETRY_CONFIG.MAX_ATTEMPTS) {
          const delay = RETRY_CONFIG.BASE_DELAY_MS * Math.pow(2, attempt - 1);
          notify({
            attempt,
            maxAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
            phase: "WAITING",
            message: `Problemas de conexão. Tentando novamente em ${
              delay / 1000
            }s...`,
          });
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    // ALL ATTEMPTS FAILED - UNCERTAIN STATE
    // The order MIGHT have been received (network could have failed after server processed)
    notify({
      attempt: RETRY_CONFIG.MAX_ATTEMPTS,
      maxAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
      phase: "UNCERTAIN",
      message: "Não foi possível confirmar. Seu pedido pode ter sido recebido.",
    });

    // Record as potential submission (for idempotency - prevents spam retry)
    recordOrderSubmission(
      input.restaurant_id,
      input.items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
      })),
      input.table_number,
      undefined,
      undefined
    );

    return {
      success: false,
      status: "UNCERTAIN",
      message:
        "Não foi possível confirmar o pedido. Ele pode ter sido recebido pelo restaurante.",
      nextAction: "WAIT_AND_CHECK",
    };
  },

  /**
   * Internal submission (no retry) - called by submitOrderWithRetry
   */
  async _submitOrderInternal(
    input: WebOrderInput,
    origin: string = "WEB_PUBLIC",
    tableId?: string
  ): Promise<WebOrderResult> {
    console.log(
      "[WebOrderingService] _submitOrderInternal:",
      input.restaurant_id
    );

    // 1. Fetch restaurant config
    const { data: restaurant, error: configError } = await (supabase as any)
      .from("gm_restaurants")
      .select("id, auto_accept_web_orders, web_ordering_enabled")
      .eq("id", input.restaurant_id)
      .single();

    if (configError || !restaurant) {
      console.error("[WebOrderingService] Restaurant not found:", configError);
      return {
        success: false,
        status: "REJECTED",
        message: "Restaurante não encontrado",
      };
    }

    // 2. Check if web ordering is enabled
    if (!restaurant.web_ordering_enabled) {
      return {
        success: false,
        status: "REJECTED",
        message: "Pedidos online desativados temporariamente",
      };
    }

    // 3. Calculate totals
    const total_cents = input.items.reduce(
      (sum, item) => sum + item.price_cents * item.quantity,
      0
    );

    // 4. Route based on auto_accept setting
    if (restaurant.auto_accept_web_orders) {
      return this.createDirectOrder(
        input,
        restaurant.id,
        total_cents,
        origin,
        tableId
      ); // Use ID as tenant_id
    } else {
      return this.createAirlockRequest(
        input,
        restaurant.id,
        total_cents,
        origin
      ); // Use ID as tenant_id
    }
  },

  /**
   * DEPRECATED: Use submitOrderWithRetry for better UX
   * Kept for backward compatibility
   */
  async submitOrder(input: WebOrderInput): Promise<WebOrderResult> {
    return this.submitOrderWithRetry(input);
  },

  /**
   * Create order directly in gm_orders (auto-accept path)
   *
   * IMPORTANT: Uses create_order_atomic RPC to respect Core constraints
   * (e.g., idx_one_open_order_per_table)
   */
  async createDirectOrder(
    input: WebOrderInput,
    tenant_id: string,
    total_cents: number,
    origin: string = "WEB_PUBLIC",
    tableId?: string
  ): Promise<WebOrderResult> {
    try {
      // Prepare RPC payload
      const rpcItems = input.items.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price_cents,
      }));

      // Prepare sync_metadata with origin and table info
      const syncMetadata: any = {
        origin: origin,
        userAgent: navigator.userAgent,
        transaction_id: input.transaction_id,
      };

      if (tableId) {
        syncMetadata.table_id = tableId;
      }

      if (input.table_number) {
        syncMetadata.table_number = input.table_number;
      }

      // Core Orders API: Docker Core quando ativo; Supabase transicional (FINANCIAL_CORE_VIOLATION_AUDIT remediated)
      const { data, error } = await createOrderAtomic({
        p_restaurant_id: input.restaurant_id,
        p_items: rpcItems,
        p_payment_method: input.payment_method || "cash",
        p_sync_metadata: syncMetadata,
      });

      if (error) {
        // Check if it's a constraint violation (one_open_order_per_table)
        if (
          error.code === "23505" ||
          error.message?.includes("unique") ||
          error.message?.includes("idx_one_open_order_per_table") ||
          error.message?.includes("TABLE_HAS_ACTIVE_ORDER")
        ) {
          return {
            success: false,
            status: "REJECTED",
            message:
              "Já existe um pedido ativo para esta mesa. Aguarde a finalização.",
          };
        }

        throw new Error(error.message);
      }

      const orderId = data?.id;

      if (!orderId) {
        throw new Error("RPC returned no order ID");
      }

      console.log(
        "[WebOrderingService] Direct order created via RPC:",
        orderId
      );

      // 🛡️ Record successful submission for protection
      recordOrderSubmission(
        input.restaurant_id,
        input.items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        input.table_number,
        orderId,
        undefined
      );

      return {
        success: true,
        order_id: orderId,
        status: "ACCEPTED",
        message: "Pedido recebido! Preparando...",
      };
    } catch (err: any) {
      console.error("[WebOrderingService] Direct order failed:", err);

      // Handle constraint violations gracefully
      if (
        err.code === "23505" ||
        err.message?.includes("unique") ||
        err.message?.includes("idx_one_open_order_per_table")
      ) {
        return {
          success: false,
          status: "REJECTED",
          message:
            "Já existe um pedido ativo para esta mesa. Aguarde a finalização.",
        };
      }

      return {
        success: false,
        status: "REJECTED",
        message: "Erro ao criar pedido. Tente novamente.",
      };
    }
  },

  /**
   * Create request in airlock queue (manual approval path)
   */
  async createAirlockRequest(
    input: WebOrderInput,
    tenant_id: string,
    total_cents: number,
    origin: string = "WEB_PUBLIC"
  ): Promise<WebOrderResult> {
    try {
      const requestId = crypto.randomUUID();

      // 5. Construct generic payload for Airlock/Requests table
      // Schema: id, tenant_id, status, payload (jsonb), source, metadata
      const requestPayload = {
        id: requestId,
        tenant_id,
        status: "PENDING",
        source: origin,
        payload: {
          restaurant_id: input.restaurant_id,
          items: input.items.map((i) => ({
            product_id: i.product_id,
            name: i.name,
            quantity: i.quantity,
            price_cents: i.price_cents,
            notes: i.notes,
          })),
          total_cents,
          customer_contact: {
            name: input.customer_name || "Cliente Web",
            phone: input.customer_phone,
            email: input.customer_email,
          },
          table_number: input.table_number,
          request_source: origin,
        },
      };

      // 6. Insert into gm_order_requests
      // BYPASS DBWriteGate.insert because it uses .select() which fails RLS for anon users
      // We generate ID client-side, so we don't need to read it back.
      const { error } = await (supabase as any)
        .from("gm_order_requests")
        .insert(requestPayload);

      if (error) throw error;

      console.log("[WebOrderingService] Airlock request created:", requestId);

      // 🛡️ Record successful submission for protection
      recordOrderSubmission(
        input.restaurant_id,
        input.items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        input.table_number,
        undefined,
        requestId
      );

      return {
        success: true,
        request_id: requestId,
        status: "PENDING_APPROVAL",
        message: "Pedido enviado! Aguardando confirmação do restaurante.",
      };
    } catch (err: any) {
      console.error("[WebOrderingService] Airlock request failed:", err);
      return {
        success: false,
        status: "REJECTED",
        message: "Erro ao enviar pedido. Tente novamente.",
      };
    }
  },

  /**
   * Initiate a public payment intent (for Stripe Modal)
   */
  async initiatePublicPayment(
    restaurantId: string,
    amountCents: number
  ): Promise<{ clientSecret: string; id: string } | null> {
    try {
      const { data, error } = await (supabase as any).functions.invoke(
        "stripe-payment",
        {
          body: {
            action: "create-public-payment-intent",
            restaurant_id: restaurantId,
            amount: amountCents,
            currency: "EUR",
          },
        }
      );

      if (error) {
        console.error("[WebOrderingService] Payment init failed:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("[WebOrderingService] Payment init exception:", err);
      return null;
    }
  },

  /**
   * Check order/request status (for polling)
   */
  async checkStatus(
    orderId?: string,
    requestId?: string
  ): Promise<{
    status: string;
    message: string;
  }> {
    if (orderId) {
      const { data } = await (supabase as any)
        .from("gm_orders")
        .select("status")
        .eq("id", orderId)
        .single();

      if (data) {
        const statusMap: Record<string, string> = {
          new: "Pedido recebido",
          OPEN: "Preparando",
          IN_PREP: "Em preparo na cozinha",
          READY: "Pronto para retirada!",
          PAID: "Finalizado",
          CANCELLED: "Cancelado",
        };
        return {
          status: data.status,
          message: statusMap[data.status] || data.status,
        };
      }
    }

    if (requestId) {
      const { data } = await (supabase as any)
        .from("gm_order_requests")
        .select("status, sovereign_order_id")
        .eq("id", requestId)
        .single();

      if (data) {
        if (data.status === "ACCEPTED" && data.sovereign_order_id) {
          return this.checkStatus(data.sovereign_order_id);
        }
        const statusMap: Record<string, string> = {
          PENDING: "Aguardando confirmação...",
          ACCEPTED: "Pedido confirmado!",
          REJECTED: "Pedido não aceito",
        };
        return {
          status: data.status,
          message: statusMap[data.status] || data.status,
        };
      }
    }

    return { status: "UNKNOWN", message: "Status não disponível" };
  },
};
