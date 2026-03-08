import { classifyFailure } from "../errors/FailureClassifier"; // CORE_FAILURE_MODEL: critical → dead_letter
import { DbWriteGate } from "../governance/DbWriteGate";
import { createOrderAtomic } from "../infra/CoreOrdersApi";
import { BackendType, getBackendType } from "../infra/backendAdapter";
import { Logger } from "../logger";
import { PaymentEngine } from "../tpv/PaymentEngine";
import { ConflictResolver } from "./ConflictResolver";
import {
  ConnectivityService,
  type ConnectivityStatus,
} from "./ConnectivityService";
import { IndexedDBQueue } from "./IndexedDBQueue";
import { calculateNextRetry, MAX_RETRIES } from "./RetryStrategy";
import type {
  OfflineQueueItem,
  OrderCreateSyncItem,
  OrderCreateSyncPayload,
  OrderPaySyncPayload,
  OrderUpdateSyncPayload,
} from "./types";

/** Re-export for consumers that import from SyncEngine */
export type { ConnectivityStatus } from "./ConnectivityService";

/**
 * SyncEngine - The Core Worker
 *
 * Responsibilities:
 * 1. Consumes ConnectivityService (fonte única: online/offline/degraded)
 * 2. Process Offline Queue (when connectivity !== 'offline')
 * 3. Handles Retries with Backoff
 * 4. Ensures Idempotency via RPCs
 * 5. Notifies UI of state changes
 */

export type SyncEngineState = {
  isProcessing: boolean;
  networkStatus: "online" | "offline";
  connectivity: ConnectivityStatus;
  pendingCount: number;
};

export type SyncListener = (state: SyncEngineState) => void;

class SyncEngineClass {
  private isProcessing = false;
  private pendingCount = 0;
  private listeners: SyncListener[] = [];
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private readonly HEARTBEAT_MS = 10000; // Check every 10s for retries
  private unsubscribeConnectivity: (() => void) | null = null;

  constructor() {
    this.updatePendingCount();
    if (typeof window !== "undefined") {
      this.unsubscribeConnectivity = ConnectivityService.subscribe(
        (_status) => {
          this.notifyListeners();
          if (ConnectivityService.getConnectivity() !== "offline") {
            this.processQueue();
          }
        },
      );
    }
  }

  private async updatePendingCount() {
    try {
      const pending = await IndexedDBQueue.getPending();
      this.pendingCount = pending.length;
      this.notifyListeners();
    } catch (e) {
      // Ignore error on counting
    }
    this.manageHeartbeat();
  }

  private notifyListeners() {
    const connectivity = ConnectivityService.getConnectivity();
    const state: SyncEngineState = {
      isProcessing: this.isProcessing,
      networkStatus: connectivity === "online" ? "online" : "offline",
      connectivity,
      pendingCount: this.pendingCount,
    };
    this.listeners.forEach((l) => l(state));
  }

  public subscribe(listener: SyncListener) {
    this.listeners.push(listener);
    const connectivity = ConnectivityService.getConnectivity();
    listener({
      isProcessing: this.isProcessing,
      networkStatus: connectivity === "online" ? "online" : "offline",
      connectivity,
      pendingCount: this.pendingCount,
    });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public simulateOffline(enabled: boolean) {
    ConnectivityService.simulateOffline(enabled);
  }

  public getNetworkStatus(): "online" | "offline" {
    return ConnectivityService.getConnectivity() === "online"
      ? "online"
      : "offline";
  }

  public getConnectivity(): ConnectivityStatus {
    return ConnectivityService.getConnectivity();
  }

  /** Force immediate queue processing (bypass heartbeat wait) */
  public forceSync() {
    if (ConnectivityService.getConnectivity() === "offline") return;
    this.processQueue();
  }

  private manageHeartbeat() {
    if (
      this.pendingCount > 0 &&
      ConnectivityService.getConnectivity() !== "offline"
    ) {
      this.startHeartbeat();
    } else {
      this.stopHeartbeat();
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) return;
    Logger.info("[SyncEngine] Starting Heartbeat");
    this.heartbeatInterval = setInterval(() => {
      if (
        !this.isProcessing &&
        ConnectivityService.getConnectivity() !== "offline"
      ) {
        this.processQueue();
      }
    }, this.HEARTBEAT_MS);
  }

  private stopHeartbeat() {
    if (!this.heartbeatInterval) return;
    Logger.info("[SyncEngine] Stopping Heartbeat 💤");
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = null;
  }

  /**
   * Main Processing Loop. Runs when online or degraded (writes enfileirados; retries when Core volta).
   */
  public async processQueue() {
    if (this.isProcessing) return;
    if (ConnectivityService.getConnectivity() === "offline") return;

    this.isProcessing = true;
    this.notifyListeners();
    Logger.info("[SyncEngine] Starting queue processing...");

    try {
      const pendingItems = await IndexedDBQueue.getPending();

      if (pendingItems.length === 0) {
        Logger.info("[SyncEngine] No pending items.");
        this.isProcessing = false;
        this.notifyListeners();
        return;
      }

      Logger.info(`[SyncEngine] Found ${pendingItems.length} pending items.`);

      for (const item of pendingItems) {
        if (ConnectivityService.getConnectivity() === "offline") break;
        await this.processItem(item);
      }
    } catch (err) {
      Logger.error("[SyncEngine] Critical error in processing loop", err);
    } finally {
      this.isProcessing = false;
      await this.updatePendingCount(); // Ensure count uses DB truth
      this.notifyListeners();
      this.manageHeartbeat();
      if (ConnectivityService.getConnectivity() !== "offline") {
        try {
          const { processPrintQueue } = await import(
            "../print/PrintQueueProcessor"
          );
          await processPrintQueue();
        } catch (e) {
          Logger.warn("[SyncEngine] Print queue processing failed", e);
        }
      }
    }
  }

  /**
   * Process Individual Item
   */
  private async processItem(item: OfflineQueueItem) {
    try {
      // Mark as syncing
      await IndexedDBQueue.updateStatus(item.id, "syncing");
      this.notifyListeners(); // Update syncing status UI

      // Dispatch to Processor
      await this.dispatch(item);

      // Mark as applied
      await IndexedDBQueue.updateStatus(item.id, "applied");
      Logger.info(`[SyncEngine] Item ${item.id} applied successfully.`);
    } catch (err: unknown) {
      const currentAttempts = (item.attempts || 0) + 1;
      const errMessage = err instanceof Error ? err.message : String(err);
      const { class: failureClass } = classifyFailure(err);

      // CORE_FAILURE_MODEL: critical → dead_letter (no infinite retry); acceptable/degradation → retry with backoff
      if (failureClass === "critical") {
        Logger.error(
          `[SyncEngine] Item ${item.id} classified CRITICAL. Moving to Dead Letter. Error: ${errMessage}`,
        );
        await IndexedDBQueue.updateStatus(
          item.id,
          "dead_letter",
          errMessage || "Critical failure",
        );
        return;
      }

      if (currentAttempts > MAX_RETRIES) {
        Logger.error(
          `[SyncEngine] Item ${item.id} reached max retries (${MAX_RETRIES}). Moving to Dead Letter. Error: ${errMessage}`,
        );
        await IndexedDBQueue.updateStatus(
          item.id,
          "dead_letter",
          errMessage || "Max retries exceeded",
        );
        return;
      }

      const nextRetry = Date.now() + calculateNextRetry(item.attempts || 0);
      await IndexedDBQueue.updateStatus(
        item.id,
        "failed",
        errMessage || "Unknown error",
        nextRetry,
      );
      Logger.warn(
        `[SyncEngine] Item ${item.id} failed (${failureClass}). Retrying in ${
          (nextRetry - Date.now()) / 1000
        }s`,
        err,
      );
    }
  }

  /**
   * Dispatcher - Routes to appropriate RPC/Mutation.
   * Cada item deve ter idempotency_key estável; Core APIs devem ser idempotentes por essa key.
   */
  private async dispatch(item: OfflineQueueItem) {
    switch (item.type) {
      case "ORDER_CREATE":
        await this.syncOrderCreate(
          item.payload as OrderCreateSyncPayload,
          item.idempotency_key ?? item.id,
        );
        break;
      case "ORDER_UPDATE":
        await this.syncOrderUpdate(
          item.payload as OrderUpdateSyncPayload,
          item.createdAt,
        );
        break;
      case "ORDER_PAY":
        await this.syncOrderPay(
          item.payload as OrderPaySyncPayload,
          item.idempotency_key ?? item.id,
        );
        break;
      // Legacy/Mapping support
      case "ORDER_ADD_ITEM":
      case "ORDER_UPDATE_ITEM_QTY":
      case "ORDER_REMOVE_ITEM":
      case "ORDER_CANCEL":
        // Remap legacy types to generic update if needed aimed at same endpoint?
        // For now, assume payload has enough info or map carefully.
        // Better to throw if not supported yet to avoid data corruption.
        await this.syncOrderUpdate(
          {
            ...(item.payload as OrderUpdateSyncPayload),
            action: this.mapLegacyTypeToAction(item.type),
          },
          item.createdAt,
        );
        break;
      default:
        throw new Error(`Unknown item type: ${item.type}`);
    }
  }

  private mapLegacyTypeToAction(type: string): string {
    if (type === "ORDER_ADD_ITEM") return "add_item";
    if (type === "ORDER_UPDATE_ITEM_QTY") return "update_quantity";
    if (type === "ORDER_REMOVE_ITEM") return "remove_item";
    if (type === "ORDER_CANCEL") return "cancel";
    return "update";
  }

  /**
   * Handler: ORDER_CREATE
   * Core Orders API — Docker Core quando ativo; totais calculados pelo Core.
   * idempotencyKey: estável por item (ex.: order-create-{localId}) para evitar duplicados em retry.
   */
  private async syncOrderCreate(
    payload: OrderCreateSyncPayload,
    idempotencyKey?: string,
  ) {
    if (!payload.items || payload.items.length === 0) {
      throw new Error("Order has no items");
    }

    const restaurantId = payload.restaurant_id ?? payload.restaurantId;
    if (!restaurantId) throw new Error("Order payload missing restaurant_id");

    // unit_price in cents: TPV usually sends cents (integer); if small decimal (e.g. 10.5) treat as euros
    const rpcItems = (payload.items || []).map((item: OrderCreateSyncItem) => {
      const rawPrice = Number(item.unit_price ?? item.price ?? 0);
      const looksLikeEuros =
        rawPrice > 0 && rawPrice < 100 && !Number.isInteger(rawPrice);
      const unitPriceCents = looksLikeEuros
        ? Math.round(rawPrice * 100)
        : Math.round(rawPrice);
      return {
        product_id: item.product_id ?? item.id ?? null,
        name: item.name ?? "",
        quantity: Number(item.quantity) || 1,
        unit_price: unitPriceCents,
      };
    });

    const { data, error } = await createOrderAtomic({
      p_restaurant_id: restaurantId,
      p_items: rpcItems,
      p_payment_method: payload.payment_method ?? "cash",
      p_sync_metadata: {
        localId: payload.localId ?? payload.id,
        syncedAt: new Date().toISOString(),
        origin: payload.source || "offline_sync",
        table_number: payload.table_number ?? payload.tableNumber,
        table_id: payload.table_id ?? payload.tableId,
      },
      p_idempotency_key:
        idempotencyKey ??
        payload.idempotencyKey ??
        payload.localId ??
        payload.id,
      table_id: (payload.table_id ?? payload.tableId) || null,
    });

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Handler: ORDER_PAY
   * idempotencyKey do item da fila (estável) evita duplicar pagamento em retry; Core já é idempotente por key.
   */
  private async syncOrderPay(
    payload: OrderPaySyncPayload,
    idempotencyKey?: string,
  ) {
    // Ensure required fields
    if (
      !payload.orderId ||
      !payload.restaurantId ||
      !payload.amountCents ||
      !payload.method ||
      !payload.cashRegisterId
    ) {
      throw new Error("Missing required fields for payment sync");
    }

    const input = {
      orderId: payload.orderId,
      restaurantId: payload.restaurantId,
      cashRegisterId: payload.cashRegisterId,
      amountCents: payload.amountCents,
      method: payload.method,
      metadata: { operatorId: payload.operatorId, ...payload.metadata },
      idempotencyKey:
        idempotencyKey ??
        payload.idempotencyKey ??
        `offline-pay-${payload.orderId}-${payload.amountCents}`,
    };

    if (payload.isPartial) {
      await PaymentEngine.processSplitPayment(input);
    } else {
      await PaymentEngine.processPayment(input);
    }
  }

  /**
   * Handler: ORDER_UPDATE
   * Uses LWW + optimistic version locking for conflict safety.
   */
  private async syncOrderUpdate(
    payload: OrderUpdateSyncPayload,
    timestamp: number,
  ) {
    const { orderId, action, restaurantId } = payload;

    if (!orderId || !restaurantId)
      throw new Error("Missing orderId or restaurantId for update");

    // Conflict Resolution (LWW) - Skip if stale
    const shouldApply = await ConflictResolver.shouldApplyUpdate(
      "gm_orders",
      orderId,
      timestamp,
    );
    if (!shouldApply) {
      Logger.info(
        `[SyncEngine] Dropping stale update for order ${orderId} (Action: ${action})`,
      );
      return;
    }

    // Optimistic version lock: get current version before writing
    const currentVersion = await ConflictResolver.getVersion(
      "gm_orders",
      orderId,
    );
    const versionFilter =
      currentVersion != null
        ? { id: orderId, version: currentVersion }
        : { id: orderId };

    Logger.info(
      `[SyncEngine] Syncing update: ${action} for ${orderId} (version: ${
        currentVersion ?? "unknown"
      })`,
    );

    if (action === "add_item" && payload.items) {
      await DbWriteGate.insert(
        "SyncEngine",
        "gm_order_items",
        payload.items.map((item: any) => ({
          order_id: orderId,
          product_id: item.id || item.product_id,
          name_snapshot: item.name,
          price_snapshot: Math.round(item.price * 100),
          quantity: item.quantity,
          subtotal_cents: Math.round(item.price * item.quantity * 100),
        })),
        { tenantId: restaurantId },
      );

      // CORE_FINANCIAL_SOVEREIGNTY: Em modo Docker não atualizamos total_cents a partir do cliente.
      if (
        payload.total !== undefined &&
        getBackendType() !== BackendType.docker
      ) {
        const result = await DbWriteGate.update(
          "SyncEngine",
          "gm_orders",
          {
            total_cents: Math.round(payload.total * 100),
            updated_at: new Date().toISOString(),
          },
          versionFilter,
          { tenantId: restaurantId },
        );

        if (result.data && result.data.length === 0 && currentVersion != null) {
          throw new Error(
            `VERSION_CONFLICT: order ${orderId} version mismatch (expected ${currentVersion})`,
          );
        }
      }
    } else if (action === "cancel") {
      const result = await DbWriteGate.update(
        "SyncEngine",
        "gm_orders",
        {
          status: "canceled",
          updated_at: new Date().toISOString(),
        },
        versionFilter,
        { tenantId: restaurantId },
      );

      if (result.data && result.data.length === 0 && currentVersion != null) {
        throw new Error(
          `VERSION_CONFLICT: order ${orderId} version mismatch (expected ${currentVersion})`,
        );
      }
    } else if (action === "send" || action === "serve" || action === "close") {
      let status = "preparing";
      if (action === "serve" || action === "close") status = "delivered";

      const result = await DbWriteGate.update(
        "SyncEngine",
        "gm_orders",
        {
          status,
          updated_at: new Date().toISOString(),
        },
        versionFilter,
        { tenantId: restaurantId },
      );

      if (result.data && result.data.length === 0 && currentVersion != null) {
        throw new Error(
          `VERSION_CONFLICT: order ${orderId} version mismatch (expected ${currentVersion})`,
        );
      }
    } else {
      // Generic update fallback
      const result = await DbWriteGate.update(
        "SyncEngine",
        "gm_orders",
        {
          updated_at: new Date().toISOString(),
          ...payload.updates, // specific field updates
        },
        versionFilter,
        { tenantId: restaurantId },
      );

      if (result.data && result.data.length === 0 && currentVersion != null) {
        throw new Error(
          `VERSION_CONFLICT: order ${orderId} version mismatch (expected ${currentVersion})`,
        );
      }
    }
  }
}

export const SyncEngine = new SyncEngineClass();
