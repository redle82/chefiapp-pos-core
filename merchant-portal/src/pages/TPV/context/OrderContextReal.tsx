/**
 * OrderContext Real - Usando OrderEngine
 *
 * Substitui o mock por implementação real com persistência.
 * REALTIME-RELIABLE: Implementa Throttling, Polling Defensivo e Auto-Heal na reconexão.
 * ONLINE-ONLY: Modo offline apenas notifica visualmente. Operações de escrita requerem conexão.
 */

import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { InventoryEngine } from "../../../core/inventory/InventoryEngine";
import {
  CashRegisterEngine,
  type CashRegister,
} from "../../../core/tpv/CashRegister";
import {
  OrderEngine,
  type OrderItemInput,
  type PaymentMethod,
  type Order as RealOrder,
} from "../../../core/tpv/OrderEngine";
import { PaymentEngine } from "../../../core/tpv/PaymentEngine";
// DOCKER CORE: Usar dockerCoreClient em vez de supabase genérico
import { formatCents } from "../../../core/currency/CurrencyService";
import { updateOrderStatus as coreUpdateOrderStatus } from "../../../core/infra/CoreOrdersApi";
import {
  tpvEventBus,
  type DecisionMadePayload,
  type OrderExceptionPayload,
} from "../../../core/tpv/TPVCentralEvents";
import { dockerCoreClient } from "../../../infra/docker-core/connection";

import { v4 as uuidv4 } from "uuid";
import type { Order, OrderItem } from "../../../core/contracts";
import { classifyFailure } from "../../../core/errors/FailureClassifier";
import {
  MSG_CASH_REGISTER_CLOSED_CREATE,
  MSG_CASH_REGISTER_CLOSED_PAY,
  MSG_CASH_UNKNOWN_OFFLINE,
} from "../../../core/guards/GuardMessages";
import { Logger } from "../../../core/logger"; // Opus 6.0 Logger
import { ReconnectManager } from "../../../core/realtime/ReconnectManager";
import {
  getTabIsolated,
  removeTabIsolated,
  setTabIsolated,
} from "../../../core/storage/TabIsolatedStorage";
import { eventTaskGenerator } from "../../../core/tasks/EventTaskGenerator";
import { useOfflineOrder } from "./OfflineOrderContext";
import { OrderContext, type OrderCreateInput } from "./OrderContextToken"; // FASE 3.4: Token isolado
// DOCKER CORE: All writes go through PostgREST RPCs (see ARCHITECTURE_DECISION.md)
import { isDevStableMode } from "../../../core/runtime/devStableMode";

// REMOVE LOCAL CONTEXT CREATION
// export const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Mapear status do OrderEngine para Order local
// Mapear Order do Engine (backend) para Order local (frontend)
// CRÍTICO: Alinhar estados frontend ↔ backend
// Backend usa: status='CLOSED' (DB canonical) + payment_status='PAID'
// Frontend usa: status='paid' (lowercase, via mapStatusToLocal)
function mapRealOrderToLocalOrder(realOrder: RealOrder): Order {
  return {
    id: realOrder.id,
    tableNumber: realOrder.tableNumber,
    tableId: realOrder.tableId,
    // CRÍTICO: Verificar payment_status primeiro (fonte soberana)
    status: mapStatusToLocal(realOrder.status, realOrder.paymentStatus),
    items: realOrder.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.nameSnapshot,
      price: item.priceSnapshot, // já em centavos
      quantity: item.quantity,
      notes: item.notes,
    })),
    total: realOrder.totalCents, // já em centavos
    createdAt: realOrder.createdAt,
    updatedAt: realOrder.updatedAt,
    customerId: (realOrder as any).customer_id, // Sprint 12
  };
}

// Mapear status considerando payment_status (fonte soberana)
function mapStatusToLocal(
  status: string,
  paymentStatus?: string,
): Order["status"] {
  // PRIORIDADE 1: Se payment_status = 'PAID', order está pago
  if (paymentStatus === "PAID") {
    return "paid";
  }

  // SEMANA 2: Se payment_status = 'PARTIALLY_PAID', order está parcialmente pago
  if (paymentStatus === "PARTIALLY_PAID") {
    return "partially_paid";
  }

  // PRIORIDADE 2: Se status = 'CLOSED', order está pago (DB canonical)
  // Backward compat: 'PAID' also maps to 'paid'
  if (status === "CLOSED" || status === "PAID") {
    return "paid";
  }

  // PRIORIDADE 3: Mapear outros status
  switch (status) {
    case "OPEN":
      return "new";
    case "PREPARING":
    case "IN_PREP":
      return "preparing";
    case "READY":
      return "ready";
    case "CANCELLED":
      return "cancelled";
    default:
      return "new";
  }
}

export function OrderProvider({
  children,
  restaurantId: propRestaurantId,
}: {
  children: ReactNode;
  restaurantId?: string;
}) {
  // Writes go through PostgREST RPCs — no kernel dependency
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // SOVEREIGN: restaurantId comes from Gate layer (TenantContext -> AppDomainWrapper)
  const [restaurantId, setRestaurantId] = useState<string | null>(
    propRestaurantId || null,
  );
  const [operatorId] = useState<string | null>(null);
  const [cashRegisterId, setCashRegisterId] = useState<string | null>(null);
  const [pendingExceptions, setPendingExceptions] = useState<
    (OrderExceptionPayload & { eventId: string })[]
  >([]);

  // Sync with prop changes (e.g., tenant switch)
  useEffect(() => {
    if (propRestaurantId && propRestaurantId !== restaurantId) {
      setRestaurantId(propRestaurantId);
    }
  }, [propRestaurantId]);

  // === KDS HARDENING: Estado do Realtime ===
  // MOTIVO: KDS precisa saber se está "cego" (sem eventos realtime)
  const [realtimeStatus, setRealtimeStatus] = useState<string>("SUBSCRIBING");
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState<Date | null>(null);
  const wasDisconnectedRef = useRef(false); // Para detectar reconexão

  // Network status hook
  // const { isOnline, isOffline } = useNetworkStatus(); // Replacing with OfflineContext
  const {
    isOffline,
    addToQueue,
    updateOfflineOrder,
    queue: _offlineQueue,
    pendingCount: pendingSync,
  } = useOfflineOrder();
  const isOnline = !isOffline;

  // SAFETY: Chaves de idempotência persistentes por sessão
  const idempotencyKeys = useRef<Map<string, string>>(new Map());

  // FASE 1 — Fluxo de Pedido Operacional: pedidos confirmados são imutáveis (sem add/remove item).
  // Ver docs/contracts/FLUXO_DE_PEDIDO_OPERACIONAL.md
  const confirmedOrderIdsRef = useRef<Set<string>>(new Set());
  const isOrderConfirmed = useCallback((orderId: string) => {
    return confirmedOrderIdsRef.current.has(orderId);
  }, []);

  // === KDS HARDENING: Refetch Strategy (Debounce + Polling) ===
  const fetchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // === REALTIME RECONNECT: Exponential Backoff ===
  const reconnectManagerRef = useRef(new ReconnectManager());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  // Initial fetch - SOVEREIGN: Use prop from Gate layer, no storage fallback
  useEffect(() => {
    // STEP 7: Não fazer throw no mount/setup
    // DOCKER CORE: Não usa auth, então operatorId pode ser null ou usar um ID fixo para desenvolvimento
    // Em produção, isso viria de um sistema de autenticação externo
    // Por enquanto, deixamos null e o sistema funcionará sem operatorId
    // setOperatorId(null); // Docker Core não requer auth

    // Fetch open cash register if we have a restaurant ID
    if (propRestaurantId) {
      CashRegisterEngine.getOpenCashRegister(propRestaurantId)
        .then((register) => {
          if (register) setCashRegisterId(register.id);
        })
        .catch(() => {
          // STEP 7: Fail-closed - não quebra se falhar
        });
    }
  }, [propRestaurantId]);

  // DOCKER CORE: Sem Kernel, não precisa dessa verificação

  // Core Fetch Logic
  const getActiveOrdersInternal = async (
    restId: string,
    isBackground = false,
  ) => {
    // Only show loading on explicit big actions, not on background syncs
    if (!isBackground) {
      setLoading(true);
      setError(null);
    }
    try {
      const realOrders = await OrderEngine.getActiveOrders(restId);
      setOrders(realOrders.map(mapRealOrderToLocalOrder));
      if (!isBackground) setError(null);
    } catch (err: any) {
      Logger.error("Failed to load orders", err, {
        context: "OrderContext",
        tenantId: restId,
      });
      if (!isBackground) setError(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const getActiveOrders = async (isBackground = false) => {
    if (!restaurantId) return;
    await getActiveOrdersInternal(restaurantId, isBackground);
  };

  // Setup Realtime Subscription (extracted for reuse)
  const setupRealtimeSubscription = useCallback(() => {
    if (!restaurantId) return null;

    Logger.info("Setting up Realtime subscription", {
      context: "OrderContext",
      tenantId: restaurantId,
    });

    // DOCKER CORE: Usar dockerCoreClient para Realtime
    const channel = dockerCoreClient
      .channel(`orders_realtime_${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gm_orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          Logger.info("Realtime event received", {
            context: "OrderContext",
            eventType: payload.eventType,
            tenantId: restaurantId,
          });
          setLastRealtimeEvent(new Date());

          // DEBOUNCE: Avoid refetch storm on bursts
          if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
          fetchDebounceRef.current = setTimeout(() => {
            getActiveOrders(true); // Background fetch
          }, 500);
        },
      )
      .subscribe((status) => {
        setRealtimeStatus(String(status));
        if (status === "SUBSCRIBED") {
          // Reset reconnect manager on success
          reconnectManagerRef.current.reset();
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }

          if (wasDisconnectedRef.current) {
            Logger.info("🔄 RECONNECTED - Syncing", {
              context: "OrderContext",
              tenantId: restaurantId,
            });
            getActiveOrders(true);
            wasDisconnectedRef.current = false;
          }
        } else if (
          status === "CLOSED" ||
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT"
        ) {
          wasDisconnectedRef.current = true;
        }
      });

    channelRef.current = channel;
    return channel;
  }, [restaurantId]);

  // Subscription & Polling
  useEffect(() => {
    if (!restaurantId) return;

    // DEV_STABLE_MODE: do not start realtime/polling while stabilizing Gate/Auth/Tenant.
    if (isDevStableMode()) {
      // Still do an initial load so UI can render deterministically.
      getActiveOrders(false);
      return;
    }

    Logger.info("Setting up Realtime & Polling", {
      context: "OrderContext",
      tenantId: restaurantId,
    });
    getActiveOrders(false); // Initial load (with spinner)

    // 1. SAFETY NET: Defensive Polling (30s)
    // 🔴 RISK: Se Supabase Realtime falhar silenciosamente, este é o único fallback.
    // Intervalo de 30s é um trade-off entre carga no servidor e latência máxima de pedidos.
    // TODO: Considerar reduzir para 15s em horário de pico se necessário.
    pollingRef.current = setInterval(() => {
      Logger.info("🛡️ Defensive Polling (30s interval)", {
        context: "OrderContext",
        tenantId: restaurantId,
      });
      getActiveOrders(true);
    }, 30000);

    // 2. REALTIME SUBSCRIPTION
    const channel = setupRealtimeSubscription();

    return () => {
      Logger.info("Cleanup OrderContext subscriptions", {
        context: "OrderContext",
        tenantId: restaurantId,
      });
      try {
        if (channel) {
          dockerCoreClient.removeChannel(channel);
        }
      } catch {
        // no-op: channel may already be removed
      }
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
    };
  }, [restaurantId]); // CRITICAL: Remove setupRealtimeSubscription from deps to prevent loop

  // === Exception Persistence (Verification & Robustness) ===
  useEffect(() => {
    // Listen for new exceptions
    const unsubscribeException = tpvEventBus.on<OrderExceptionPayload>(
      "order.exception",
      (event) => {
        Logger.info("caught_order_exception", {
          payload: event.payload,
          context: "OrderContext",
        });
        setPendingExceptions((prev) => {
          // Check if already exists by eventId or orderId+type
          if (prev.some((e) => e.eventId === event.id)) return prev;
          return [...prev, { ...event.payload, eventId: event.id }];
        });
      },
    );

    // Listen for decisions to clear exceptions
    const unsubscribeDecision = tpvEventBus.on<DecisionMadePayload>(
      "order.decision_made",
      (event) => {
        Logger.info("caught_decision_made", {
          payload: event.payload,
          context: "OrderContext",
        });
        setPendingExceptions((prev) =>
          prev.filter(
            (e) =>
              // Remove exception if it matches the decision's orderId
              e.orderId !== event.payload.orderId,
          ),
        );
      },
    );

    return () => {
      unsubscribeException();
      unsubscribeDecision();
    };
  }, []);

  // Auto-Reconnect Logic (exponential backoff)
  useEffect(() => {
    if (!restaurantId) return;

    // STEP 6: DEV_STABLE_MODE - no auto-reconnect attempts
    if (isDevStableMode()) return;

    // Detect disconnection and trigger reconnect
    if (
      realtimeStatus === "CLOSED" ||
      realtimeStatus === "CHANNEL_ERROR" ||
      realtimeStatus === "TIMED_OUT"
    ) {
      if (reconnectManagerRef.current.shouldRetry()) {
        const delay = reconnectManagerRef.current.getDelay();
        const attempts = reconnectManagerRef.current.getAttempts() + 1;

        Logger.warn(
          `[Realtime] Connection lost. Reconnecting in ${reconnectManagerRef.current.getDelayFormatted()} (attempt ${attempts})`,
          {
            context: "OrderContext",
            tenantId: restaurantId,
            status: realtimeStatus,
          },
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectManagerRef.current.increment();

          // Unsubscribe old channel
          if (channelRef.current) {
            dockerCoreClient.removeChannel(channelRef.current);
            channelRef.current = null;
          }

          // Re-subscribe
          setupRealtimeSubscription();
        }, delay);
      } else {
        Logger.error(
          "[Realtime] Max reconnection attempts reached. Using polling fallback only.",
          {
            context: "OrderContext",
            tenantId: restaurantId,
          },
        );
      }
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [realtimeStatus, restaurantId, setupRealtimeSubscription]);

  // -------------------------------------------------------------------------
  // FLOW: Nascimento do pedido (TPV → Core). Autoridade: create_order_atomic.
  // -------------------------------------------------------------------------
  const createOrder = async (orderInput: OrderCreateInput): Promise<Order> => {
    if (!restaurantId) throw new Error("Restaurant ID not set");

    // DOCKER CORE: Verificar apenas offline real (sem status FROZEN do Kernel)
    if (isOffline) {
      Logger.warn("⚠️ Offline Mode detected. Creating local order.", {
        context: "OrderContext",
        tenantId: restaurantId,
      });

      // 1. Get cash register ID if available
      let cashRegisterId: string | undefined;
      try {
        const openRegister = await CashRegisterEngine.getOpenCashRegister(
          restaurantId,
        );
        cashRegisterId = openRegister?.id;
      } catch (e) {
        Logger.warn("Could not get cash register for offline order", {
          error: e,
        });
      }

      // 2. Create Local Payload (Format for OrderEngine)
      const localId = uuidv4();
      const now = new Date();

      const payload = {
        restaurant_id: restaurantId,
        table_number: orderInput.tableNumber,
        table_id: orderInput.tableId,
        operator_id: operatorId,
        cash_register_id: cashRegisterId,
        items: (orderInput.items || []).map((item) => ({
          product_id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes,
        })),
        id: localId, // Critical for ID Mapping in Sync
      };

      // 3. Add to Offline Queue (IndexedDB)
      await addToQueue(payload);

      // 4. Optimistic UI Update
      const totalCents = (orderInput.items || []).reduce(
        (sum, i) => sum + i.price * i.quantity,
        0,
      );
      const localOrder: Order = {
        id: localId,
        tableNumber: orderInput.tableNumber,
        tableId: orderInput.tableId,
        status: "new",
        items: (orderInput.items || []).map((item) => ({
          id: uuidv4(), // Temp ID
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes,
        })),
        total: totalCents,
        createdAt: now,
        updatedAt: now,
      };

      setOrders((prev) => [...prev, localOrder]);

      // Persist active order (Tab-Isolated)
      const { setTabIsolated } = await import(
        "../../../core/storage/TabIsolatedStorage"
      );
      setTabIsolated("chefiapp_active_order_id", localOrder.id);

      Logger.info("Local order created (offline)", {
        localId,
        tableNumber: orderInput.tableNumber,
      });
      return localOrder;
    }

    // ONLINE MODE: Fluxo normal
    // Verificar caixa aberto (gatekeeper)
    if (!cashRegisterId) {
      const openRegister = await CashRegisterEngine.getOpenCashRegister(
        restaurantId,
      );
      if (!openRegister) {
        throw new Error(MSG_CASH_REGISTER_CLOSED_CREATE);
      }
      setCashRegisterId(openRegister.id);
    }

    // Verificar se mesa já tem pedido ativo
    if (orderInput.tableId) {
      try {
        const existingOrder = await OrderEngine.getActiveOrderByTable(
          restaurantId,
          orderInput.tableId,
        );
        if (existingOrder) {
          const localOrder = mapRealOrderToLocalOrder(existingOrder);
          // Salvar como pedido ativo
          setTabIsolated("chefiapp_active_order_id", localOrder.id);
          await getActiveOrders();
          return localOrder;
        }
      } catch {
        // Se não encontrar, continua criando novo
      }
    }

    // Criar novo pedido (já valida caixa e mesa no OrderEngine)
    // DOCKER CORE: Validação mínima - apenas restaurante necessário
    if (!restaurantId) {
      throw new Error("Restaurante não selecionado");
    }

    // FLOW: Única escrita de criação — RPC create_order_atomic (Core soberano).
    // FASE 1: Na Fase 1, gm_orders.status = 'OPEN' é tratado como equivalente a CONFIRMED do contrato.
    // Ver docs/contracts/FLUXO_DE_PEDIDO_OPERACIONAL.md
    // Incluir autoria em cada item para divisão de conta
    const rpcItems = (orderInput.items || []).map((item: any) => ({
      product_id: item.productId,
      name: item.name,
      quantity: item.quantity,
      unit_price: Math.round(item.price * 100), // Converter para centavos
      // Autoria do item (para divisão de conta)
      created_by_user_id: item.created_by_user_id || null,
      created_by_role: item.created_by_role || null,
      device_id: item.device_id || null,
    }));

    const syncMetadata: any = {
      origin: (orderInput as any).syncMetadata?.origin || "CAIXA",
      ...(orderInput as any).syncMetadata,
    };

    if (orderInput.tableId) {
      syncMetadata.table_id = orderInput.tableId;
    }

    if (orderInput.tableNumber) {
      syncMetadata.table_number = orderInput.tableNumber;
    }

    // DOCKER CORE: Usar dockerCoreClient para garantir conexão correta
    const { data: orderResult, error: createError } =
      await dockerCoreClient.rpc("create_order_atomic", {
        p_restaurant_id: restaurantId,
        p_items: rpcItems,
        p_payment_method: "cash",
        p_sync_metadata: syncMetadata,
      });

    if (createError) {
      // Preserve error details from RPC (especially constraint codes)
      const error = createError as any;
      if (error && error.code) {
        // Preserve constraint error codes (e.g., 23505 for idx_one_open_order_per_table)
        const dbError = new Error(
          error.message || `RPC_EXECUTION_FAILED: ${createError.message}`,
        );
        (dbError as any).code = error.code;
        (dbError as any).constraint = error.constraint;
        (dbError as any).tableId = orderInput.tableId;
        (dbError as any).tableNumber = orderInput.tableNumber;
        throw dbError;
      }
      throw createError;
    }

    const orderData = orderResult as { id?: string } | null;
    const orderId = orderData?.id || uuidv4();

    // Fetch the projected order (Active Record pattern for now)
    // This ensures we get the DB-generated short_id
    const realOrder = await OrderEngine.getOrderById(orderId);

    const localOrder = mapRealOrderToLocalOrder(realOrder);

    // Cada pedido que aparece é uma tarefa (CONTRATO_DE_ATIVIDADE_OPERACIONAL)
    const realOrderAny = realOrder as { number?: number; short_id?: string };
    eventTaskGenerator
      .generateFromEvent(restaurantId, "order_created", {
        orderId: localOrder.id,
        orderNumber:
          realOrderAny.number ?? realOrderAny.short_id ?? localOrder.id,
        tableNumber: localOrder.tableNumber ?? orderInput.tableNumber ?? null,
      })
      .catch((err) =>
        console.warn("[OrderContextReal] Tarefa por pedido não criada:", err),
      );

    // HARD RULE 4: Persistir pedido ativo (Tab-Isolated)
    setTabIsolated("chefiapp_active_order_id", localOrder.id);

    // FASE 1: Marcar como confirmado — imutável (sem add/remove item). Ver FLUXO_DE_PEDIDO_OPERACIONAL.md
    confirmedOrderIdsRef.current.add(localOrder.id);

    await getActiveOrders(); // Refresh
    return localOrder;
  };

  // Adicionar item
  const addItemToOrder = async (
    orderId: string,
    item: OrderItemInput,
  ): Promise<void> => {
    if (!restaurantId) throw new Error("Restaurant ID not set");
    // FASE 1: Pedido confirmado é imutável. Ver FLUXO_DE_PEDIDO_OPERACIONAL.md
    if (confirmedOrderIdsRef.current.has(orderId)) return;

    if (isOffline) {
      // ... (keep offline logic)
      Logger.info("Offline Mode: Adding item locally", { orderId, item });
      await updateOfflineOrder(orderId, "ADD_ITEM", {
        ...item,
        restaurantId, // Vital for sync
      });

      // Optimistic UI Update (Local Memory)
      // We need to update `orders` state manually since there's no DB fetch.
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id === orderId) {
            const newItem: OrderItem = {
              id: uuidv4(), // Temp local ID
              productId: item.productId,
              name: item.name,
              price: item.priceCents,
              quantity: item.quantity,
              notes: item.notes,
            };
            const updatedItems = [...order.items, newItem];
            const newTotal = updatedItems.reduce(
              (sum, i) => sum + i.price * i.quantity,
              0,
            );
            return {
              ...order,
              items: updatedItems,
              total: newTotal,
              updatedAt: new Date(),
            };
          }
          return order;
        }),
      );
      return;
    }

    // STEP 7: Fail-closed - não assume Kernel
    // DOCKER CORE: Adicionar item diretamente via PostgREST
    const { error: addError } = await dockerCoreClient
      .from("gm_order_items")
      .insert({
        order_id: orderId,
        product_id: item.productId,
        name_snapshot: item.name,
        price_snapshot: item.priceCents || (item as any).price,
        quantity: item.quantity,
        subtotal_cents:
          (item.priceCents || (item as any).price) * item.quantity,
        modifiers:
          item.modifiers && item.modifiers.length > 0
            ? JSON.stringify(item.modifiers)
            : "[]",
        course: item.course ?? 1,
      });

    if (addError) throw addError;

    // Atualizar total do pedido
    const order = orders.find((o) => o.id === orderId);
    const currentTotal = order?.total || 0;
    const itemTotal = (item.priceCents || (item as any).price) * item.quantity;
    const newTotal = currentTotal + itemTotal;

    const { error: updateTotalError } = await dockerCoreClient
      .from("gm_orders")
      .update({
        total_cents: newTotal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateTotalError) throw updateTotalError;

    await getActiveOrders(); // Refresh
  };

  // Remover item
  const removeItemFromOrder = async (
    orderId: string,
    itemId: string,
  ): Promise<void> => {
    if (!restaurantId) throw new Error("Restaurant ID not set");
    // FASE 1: Pedido confirmado é imutável. Ver FLUXO_DE_PEDIDO_OPERACIONAL.md
    if (confirmedOrderIdsRef.current.has(orderId)) return;

    if (isOffline) {
      // ... (keep offline logic)
      Logger.info("Offline Mode: Removing item locally", { orderId, itemId });
      await updateOfflineOrder(orderId, "REMOVE_ITEM", {
        itemId,
        restaurantId,
      });

      // Optimistic UI Update
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id === orderId) {
            const updatedItems = order.items.filter((i) => i.id !== itemId);
            const newTotal = updatedItems.reduce(
              (sum, i) => sum + i.price * i.quantity,
              0,
            );
            return {
              ...order,
              items: updatedItems,
              total: newTotal,
              updatedAt: new Date(),
            };
          }
          return order;
        }),
      );
      return;
    }

    // STEP 7: Fail-closed - não assume Kernel
    // DOCKER CORE: Remover item diretamente via PostgREST
    const item = orders
      .find((o) => o.id === orderId)
      ?.items.find((i) => i.id === itemId);
    const itemTotal = item ? item.price * item.quantity : 0;

    const { error: deleteError } = await dockerCoreClient
      .from("gm_order_items")
      .delete()
      .eq("id", itemId)
      .eq("order_id", orderId);

    if (deleteError) throw deleteError;

    // Atualizar total do pedido
    const order = orders.find((o) => o.id === orderId);
    const currentTotal = order?.total || 0;
    const newTotal = Math.max(0, currentTotal - itemTotal);

    const { error: updateTotalError } = await dockerCoreClient
      .from("gm_orders")
      .update({
        total_cents: newTotal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateTotalError) throw updateTotalError;

    await getActiveOrders(); // Refresh
  };

  // Atualizar quantidade
  const updateItemQuantity = async (
    orderId: string,
    itemId: string,
    quantity: number,
  ): Promise<void> => {
    if (!restaurantId) throw new Error("Restaurant ID not set");
    // FASE 1: Pedido confirmado é imutável. Ver FLUXO_DE_PEDIDO_OPERACIONAL.md
    if (confirmedOrderIdsRef.current.has(orderId)) return;

    if (isOffline) {
      // ... (keep offline logic)
      Logger.info("Offline Mode: Updating item quantity locally", {
        orderId,
        itemId,
        quantity,
      });
      await updateOfflineOrder(orderId, "UPDATE_QTY", {
        itemId,
        quantity,
        restaurantId,
      });

      // Optimistic UI Update
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id === orderId) {
            const updatedItems = order.items.map((i) => {
              if (i.id === itemId) return { ...i, quantity };
              return i;
            });
            const newTotal = updatedItems.reduce(
              (sum, i) => sum + i.price * i.quantity,
              0,
            );
            return {
              ...order,
              items: updatedItems,
              total: newTotal,
              updatedAt: new Date(),
            };
          }
          return order;
        }),
      );
      return;
    }

    // DOCKER CORE: Validação mínima - apenas restaurante necessário
    if (!restaurantId) {
      throw new Error("Restaurante não selecionado");
    }

    // Find Unit Price for Total Calculation
    // Use local state (orders) or fetch? Local state is faster.
    const order = orders.find((o) => o.id === orderId);
    const item = order?.items.find((i) => i.id === itemId);
    if (!item) throw new Error("Item não encontrado");
    // DOCKER CORE: Atualizar quantidade diretamente via PostgREST

    const oldSubtotal = item.price * item.quantity;
    const newSubtotal = item.price * quantity;
    const totalDiff = newSubtotal - oldSubtotal;

    const { error: updateItemError } = await dockerCoreClient
      .from("gm_order_items")
      .update({
        quantity,
        subtotal_cents: newSubtotal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("order_id", orderId);

    if (updateItemError) throw updateItemError;

    // Atualizar total do pedido
    // Reutilizar order já declarado acima
    const currentTotal = order?.total || 0;
    const newTotal = currentTotal + totalDiff;

    const { error: updateTotalError } = await dockerCoreClient
      .from("gm_orders")
      .update({
        total_cents: newTotal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateTotalError) throw updateTotalError;
    await getActiveOrders(); // Refresh
  };

  // Sprint 12: Attach Customer
  const attachCustomer = async (
    orderId: string,
    customerId: string,
  ): Promise<void> => {
    if (!restaurantId) throw new Error("Restaurant ID not set");

    const { error } = await dockerCoreClient
      .from("gm_orders")
      .update({ customer_id: customerId })
      .eq("id", orderId)
      .eq("restaurant_id", restaurantId);

    if (error) throw error;
    await getActiveOrders();
  };

  // Cancelar Pedido
  const cancelOrder = async (
    orderId: string,
    _reason: string,
  ): Promise<void> => {
    if (!restaurantId) throw new Error("Restaurant ID not set");

    // DOCKER CORE: Cancelar pedido diretamente via PostgREST, sem Kernel
    const { error: cancelError } = await dockerCoreClient
      .from("gm_orders")
      .update({
        status: "CANCELLED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("restaurant_id", restaurantId);

    if (cancelError) throw cancelError;

    await getActiveOrders();
  };

  // -------------------------------------------------------------------------
  // FLOW: Transições de estado (prepare → IN_PREP, ready → READY, serve → CLOSED, pay → PaymentEngine).
  // Autoridade: Core (gm_orders / PaymentEngine). TPV e KDS são clientes.
  // -------------------------------------------------------------------------
  const performOrderAction = async (
    orderId: string,
    action: string,
    payload?: any,
  ): Promise<void> => {
    if (!restaurantId) throw new Error("Restaurant ID not set");

    try {
      switch (action) {
        case "send":
        case "prepare":
          // FLOW: "Enviado à cozinha" — pedido passa a IN_PREP. FASE 1: única via RPC (auditável). Autoridade canónica para IN_PREP/READY é KDS; TPV pode chamar por compatibilidade.
          const { error: updateError } = await coreUpdateOrderStatus({
            order_id: orderId,
            restaurant_id: restaurantId,
            new_status: "IN_PREP",
            origin: "TPV",
          });
          if (updateError) throw new Error(updateError.message);
          break;

        case "ready":
          // FLOW: Pedido pronto para servir — status READY. FASE 1: única via RPC (auditável).
          const { error: readyErr } = await coreUpdateOrderStatus({
            order_id: orderId,
            restaurant_id: restaurantId,
            new_status: "READY",
            origin: "TPV",
          });
          if (readyErr) throw new Error(readyErr.message);
          break;

        case "serve":
          // FLOW: Pedido servido — status CLOSED. FASE 1: única via RPC (auditável).
          const { error: serveErr } = await coreUpdateOrderStatus({
            order_id: orderId,
            restaurant_id: restaurantId,
            new_status: "CLOSED",
            origin: "TPV",
          });
          if (serveErr) throw new Error(serveErr.message);
          break;

        case "pay":
          // Offline Support: only cash/manual; card/PIX require network (OFFLINE_STRATEGY)
          if (isOffline) {
            const method = (payload?.method || "cash") as string;
            const OFFLINE_ALLOWED_METHODS = ["cash", "manual", "dinheiro"];
            if (!OFFLINE_ALLOWED_METHODS.includes(method.toLowerCase())) {
              throw new Error(
                "Pagamento offline só está disponível para dinheiro. Cartão e PIX exigem ligação à rede.",
              );
            }
            Logger.info("Offline Mode: Processing payment locally", {
              orderId,
            });
            if (!restaurantId) throw new Error("Restaurant ID not set");

            // Use local state for register
            const offlineRegisterId = cashRegisterId;
            if (!offlineRegisterId) {
              throw new Error(MSG_CASH_UNKNOWN_OFFLINE);
            }

            // Get order total from local state
            const localOrder = orders.find((o) => o.id === orderId);
            if (!localOrder) throw new Error("Order not found locally");

            const amountCents =
              payload?.isPartial && payload?.amountCents
                ? payload.amountCents
                : localOrder.total;

            await updateOfflineOrder(orderId, "PAY", {
              amountCents,
              method: payload?.method || "cash",
              restaurantId,
              cashRegisterId: offlineRegisterId,
              isPartial: payload?.isPartial,
              operatorId,
            });

            // Optimistic UI Update
            setOrders((prev) =>
              prev.map((o) => {
                if (o.id === orderId) {
                  // If full payment, mark paid. If partial, status might remain open or 'partially_paid'
                  // For simplicity in offline: if amount >= total, paid.
                  // But split bill logic is complex.
                  // Assuming typical flow:
                  if (!payload?.isPartial) return { ...o, status: "paid" };
                  return o;
                }
                return o;
              }),
            );

            // Remove from active tab if paid fully
            if (!payload?.isPartial) {
              removeTabIsolated("chefiapp_active_order_id");
            }
            return;
          }

          // HARD RULE 2: Pagar = Fechar pedido (TRANSACTION ATOMICA)
          // CRÍTICO: Re-fetch order do DB e recalcular total (nunca confiar no frontend)

          // 1. Re-fetch order do DB (fonte soberana)
          const dbOrder = await OrderEngine.getOrderById(orderId);

          // 2. Recalcular total baseado em items (double-check contra tampering)
          const { data: items, error: itemsError } = await dockerCoreClient
            .from("gm_order_items")
            .select("price_snapshot, quantity")
            .eq("order_id", orderId);

          if (itemsError) {
            throw new Error(
              `Failed to fetch order items: ${itemsError.message} `,
            );
          }

          const itemsList = Array.isArray(items) ? items : [];
          if (itemsList.length === 0) {
            throw new Error("Order has no items");
          }

          const calculatedTotal = itemsList.reduce(
            (sum: number, i: Record<string, any>) =>
              sum + i.price_snapshot * i.quantity,
            0,
          );

          // 3. Validar que total do DB = total calculado (proteção contra tampering)
          if (calculatedTotal !== dbOrder.totalCents) {
            Logger.critical("Total mismatch detected during payment", null, {
              context: "OrderContext",
              dbTotal: dbOrder.totalCents,
              calculatedTotal,
              orderId,
            });
            throw new Error(
              "Total mismatch - possible tampering detected. Please refresh and try again.",
            );
          }

          // IDEMPOTENCY SAFETY: Recuperar key da sessão ou gerar nova
          let key = idempotencyKeys.current.get(orderId);
          if (!key) {
            key = `${orderId}_${Date.now()} _secure`;
            idempotencyKeys.current.set(orderId, key);
          }

          // 0. Enforce Open Cash Register (Sovereign Rule)
          if (!cashRegisterId) {
            // Double check DB
            const openRegister = await CashRegisterEngine.getOpenCashRegister(
              restaurantId,
            );
            if (!openRegister) {
              throw new Error(MSG_CASH_REGISTER_CLOSED_PAY);
            }
            setCashRegisterId(openRegister.id);
            // Use fetched ID for this transaction to avoid state lag
          }
          const activeRegisterId =
            cashRegisterId ||
            (await CashRegisterEngine.getOpenCashRegister(restaurantId))?.id;

          if (!activeRegisterId) {
            throw new Error(MSG_CASH_REGISTER_CLOSED_PAY);
          }

          // 4. Processar pagamento (transação atômica: paga + fecha)
          // SEMANA 2: Suportar pagamento parcial (split bill)
          const isPartial = payload?.isPartial === true;
          const amountCents =
            isPartial && payload?.amountCents
              ? payload.amountCents // Pagamento parcial (split bill)
              : dbOrder.totalCents; // Pagamento total (comportamento padrão)

          // Validar que amount não excede o total
          if (amountCents > dbOrder.totalCents) {
            throw new Error(
              `Valor de pagamento(${amountCents}) excede o total do pedido(${dbOrder.totalCents})`,
            );
          }

          // DOCKER CORE: Validação mínima - apenas restaurante necessário
          if (!restaurantId) {
            throw new Error("Restaurante não selecionado");
          }
          const method = (payload?.method || "cash") as PaymentMethod;

          // PRE-CHECK: Loyalty Balance
          if (method === "loyalty") {
            const orderForCheck = await OrderEngine.getOrderById(orderId);
            const customerId = (orderForCheck as any).customer_id;
            if (!customerId)
              throw new Error(
                "Cliente precisa ser identificado para pagar com pontos.",
              );

            const { data: customerCheck } = await dockerCoreClient
              .from("gm_customers")
              .select("points_balance")
              .eq("id", customerId)
              .single();
            if (!customerCheck)
              throw new Error("Perfil de cliente não encontrado.");

            // 1 Point = 0.10 EUR (10 Cents)
            // AmountCents = 100 (1 EUR) -> Next Points = 10
            const pointsNeeded = Math.ceil(amountCents / 10);

            if ((customerCheck.points_balance || 0) < pointsNeeded) {
              throw new Error(
                `Saldo insuficiente. Necessário: ${pointsNeeded} pts. Disponível: ${
                  customerCheck.points_balance || 0
                } pts.`,
              );
            }
          }

          // DOCKER CORE: Processar pagamento diretamente via RPC, sem Kernel
          const { data: payResult, error: payError } =
            await dockerCoreClient.rpc("process_order_payment", {
              p_restaurant_id: restaurantId,
              p_order_id: orderId,
              p_cash_register_id: activeRegisterId,
              p_operator_id: operatorId || null,
              p_amount_cents: amountCents,
              p_method: method,
              p_idempotency_key: key,
            });

          if (payError) {
            throw new Error(`PAYMENT_RPC_FAILED: ${payError.message}`);
          }

          if (!payResult || !payResult.success) {
            throw new Error(
              `PAYMENT_FAILED: ${payResult?.error || "Erro desconhecido"}`,
            );
          }

          // Persist tip_cents and discount_cents on the order row if provided
          const tipCents = payload?.tip_cents ?? 0;
          const discountCents = payload?.discount_cents ?? 0;
          if (tipCents > 0 || discountCents > 0) {
            const updateFields: Record<string, number> = {};
            if (tipCents > 0) updateFields.tip_cents = tipCents;
            if (discountCents > 0) updateFields.discount_cents = discountCents;
            await dockerCoreClient
              .from("gm_orders")
              .update(updateFields)
              .eq("id", orderId);
          }

          // Cleanup key on success (allows new payment if order re-opened later)
          idempotencyKeys.current.delete(orderId);

          // FASE 3: Integração CRM e Loyalty (não bloqueia pagamento se falhar)
          try {
            const orderForCRM = await OrderEngine.getOrder(
              orderId,
              restaurantId,
            );
            if (orderForCRM && (orderForCRM as any).customer_id) {
              const customerId = (orderForCRM as any).customer_id;

              if (method === "loyalty") {
                // REDIRECCIONAMENTO: QUEIMA DE PONTOS
                const pointsBurned = Math.ceil(amountCents / 10);
                type LoyaltyCustomer = {
                  points_balance?: number;
                  visit_count?: number;
                  total_spend_cents?: number;
                };
                const { data: customer } = await dockerCoreClient
                  .from("gm_customers")
                  .select("points_balance, visit_count")
                  .eq("id", customerId)
                  .single();

                const customerRow = customer as LoyaltyCustomer | null;
                if (customerRow) {
                  await dockerCoreClient
                    .from("gm_customers")
                    .update({
                      points_balance:
                        (customerRow.points_balance || 0) - pointsBurned,
                      // Não incrementa spend nem visits em resgate (decisão de negócio)
                      // Ou incrementa visits? Vamos incrementar visits pois houve transação.
                      visit_count: (customerRow.visit_count || 0) + 1,
                      last_visit_at: new Date().toISOString(),
                    })
                    .eq("id", customerId);

                  await dockerCoreClient.from("gm_loyalty_logs").insert({
                    restaurant_id: restaurantId,
                    customer_id: customerId,
                    order_id: orderId,
                    points_amount: -pointsBurned, // Negativo
                    description: `Resgatou ${pointsBurned} pontos (Desconto de ${formatCents(
                      amountCents,
                    )})`,
                  });
                }
              } else {
                // FLUXO NORMAL: GANHO DE PONTOS
                const spendCents = amountCents;
                const pointsEarned = Math.floor(spendCents / 100);

                const { data: customer } = await dockerCoreClient
                  .from("gm_customers")
                  .select("points_balance, visit_count, total_spend_cents")
                  .eq("id", customerId)
                  .single();

                const customerRow = customer as LoyaltyCustomer | null;
                if (customerRow) {
                  await dockerCoreClient
                    .from("gm_customers")
                    .update({
                      points_balance:
                        (customerRow.points_balance || 0) + pointsEarned,
                      total_spend_cents:
                        (customerRow.total_spend_cents || 0) + spendCents,
                      visit_count: (customerRow.visit_count || 0) + 1,
                      last_visit_at: new Date().toISOString(),
                    })
                    .eq("id", customerId);

                  await dockerCoreClient.from("gm_loyalty_logs").insert({
                    restaurant_id: restaurantId,
                    customer_id: customerId,
                    order_id: orderId,
                    points_amount: pointsEarned,
                    description: `Ganhou ${pointsEarned} pontos (Pedido #${
                      orderForCRM.number || orderForCRM.shortId
                    })`,
                  });
                }
              }
            }
          } catch (crmError) {
            Logger.warn("Failed to update CRM/Loyalty", {
              error: crmError,
              orderId,
            });
          }

          // FASE 4: Inventory Auto-Deductions
          try {
            const paidOrder = await OrderEngine.getOrderById(orderId);
            if (!paidOrder) {
              throw new Error("Paid order not found for inventory processing");
            }
            const localPaidOrder = mapRealOrderToLocalOrder(paidOrder);
            await InventoryEngine.processOrder(localPaidOrder);

            const totalCost = await InventoryEngine.calculateOrderCost(
              localPaidOrder,
            );
            const grossMargin = localPaidOrder.total - totalCost;

            await dockerCoreClient
              .from("gm_orders")
              .update({
                total_cost_cents: totalCost,
                gross_margin_cents: grossMargin,
              })
              .eq("id", orderId);
          } catch (invError) {
            Logger.error("Inventory/Finance Logic Failed", invError, {
              context: "OrderContext",
              orderId,
            });
          }

          // Limpar pedido ativo após pagamento
          const currentActive = getTabIsolated("chefiapp_active_order_id");
          if (currentActive === orderId) {
            removeTabIsolated("chefiapp_active_order_id");
          }
          break;

        case "close":
          // HARD RULE: 'close' foi eliminado
          // Pagamento já fecha o pedido automaticamente (transação atômica)
          // Esta ação não deve mais existir, mas mantemos para compatibilidade
          const orderToClose = await OrderEngine.getOrderById(orderId);
          if (orderToClose.paymentStatus !== "PAID") {
            throw new Error(
              'Pedido deve ser pago antes de fechar. Use "Cobrar" primeiro.',
            );
          }
          // Se já está pago, apenas atualizar status (redundante, mas seguro)
          // REMOVED LEGACY WRITE: kernel.execute('PAY') already sets status to PAID via Effect.
          break;

        case "cancel":
          // DOCKER CORE: Atualizar diretamente via PostgREST, sem Kernel
          const { error: cancelError } = await dockerCoreClient
            .from("gm_orders")
            .update({
              status: "CANCELLED",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          if (cancelError) throw cancelError;

          // Limpar pedido ativo se cancelado
          const currentActiveCancel = getTabIsolated(
            "chefiapp_active_order_id",
          );
          if (currentActiveCancel === orderId) {
            removeTabIsolated("chefiapp_active_order_id");
          }
          break;

        default:
          Logger.warn("Unknown action", {
            context: "OrderContext",
            action,
            orderId,
          });
      }

      await getActiveOrders(); // Refresh
    } catch (err: any) {
      Logger.error("Action failed", err, {
        context: "OrderContext",
        action,
        orderId,
      });
      throw err;
    }
  };

  // Abrir caixa
  const openCashRegister = async (
    openingBalanceCents: number,
  ): Promise<void> => {
    // DOCKER CORE: Não usa auth, então operatorId pode ser null
    // Para desenvolvimento, podemos usar um ID fixo ou null
    // Em produção, isso viria de um sistema de autenticação externo
    const currentOperatorId = operatorId || null; // Docker Core não requer operatorId obrigatório

    if (!restaurantId) {
      Logger.error("Missing Restaurant ID for OpenCashRegister", null, {
        restaurantId,
      });
      throw new Error("Restaurant ID not set");
    }

    // STEP 7: Fail-closed - não assume Kernel
    // DOCKER CORE: Validação mínima - apenas restaurante necessário
    if (!restaurantId) {
      throw new Error("Restaurante não selecionado");
    }

    try {
      // DOCKER CORE: Abrir caixa diretamente via RPC, sem Kernel
      const { data: registerResult, error: openError } =
        await dockerCoreClient.rpc("open_cash_register_atomic", {
          p_restaurant_id: restaurantId,
          p_name: "Caixa Principal",
          p_opened_by: currentOperatorId, // Pode ser null no Docker Core
          p_opening_balance_cents: openingBalanceCents,
        });

      if (openError) {
        if (openError.message.includes("CASH_REGISTER_ALREADY_OPEN")) {
          // Se já está aberto, recuperar o ID
          const existing = await CashRegisterEngine.getOpenCashRegister(
            restaurantId,
          );
          if (existing) {
            setCashRegisterId(existing.id);
            return; // Treat as success
          }
        }
        throw openError;
      }

      const registerData = registerResult as { id?: string } | null;
      if (!registerData?.id) {
        throw new Error("Failed to open cash register: no ID returned");
      }

      setCashRegisterId(registerData.id);

      // Verificar que o registro foi criado corretamente
      const verifyRegister = await CashRegisterEngine.getOpenCashRegister(
        restaurantId,
      );
      if (!verifyRegister) {
        throw new Error("Failed to verify cash register after opening");
      }
    } catch (err: any) {
      // Robustness: If already open, just recover the ID and proceed
      if (
        err.message?.includes("already open") ||
        err.message?.includes("já está aberto")
      ) {
        Logger.warn("Register already open. recovering...", {
          context: "OrderContext",
          tenantId: restaurantId,
        });
        const existing = await CashRegisterEngine.getOpenCashRegister(
          restaurantId,
        );
        if (existing) {
          setCashRegisterId(existing.id);
          return; // Treat as success
        }
      }
      const classified = classifyFailure(err);
      (err as any).failureClass = classified.class;
      (err as any).classifiedReason = classified.reason;
      throw err;
    }
  };

  // Fechar caixa (via close_cash_register_atomic RPC — gera Z-Report + CDC)
  const closeCashRegister = async (
    closingBalanceCents: number,
  ): Promise<void> => {
    if (!restaurantId || !operatorId || !cashRegisterId) {
      const err = new Error("Missing required IDs");
      const classified = classifyFailure(err);
      (err as any).failureClass = classified.class;
      (err as any).classifiedReason = classified.reason;
      throw err;
    }

    try {
      // DOCKER CORE: Fechar caixa via RPC atômico (Z-Report + CDC event)
      const { error: rpcError } = await dockerCoreClient.rpc(
        "close_cash_register_atomic",
        {
          p_cash_register_id: cashRegisterId,
          p_closed_by: operatorId,
          p_declared_closing_cents: closingBalanceCents,
        },
      );

      if (rpcError) throw rpcError;

      setCashRegisterId(null);
    } catch (err: any) {
      const classified = classifyFailure(err);
      (err as any).failureClass = classified.class;
      (err as any).classifiedReason = classified.reason;
      throw err;
    }
  };

  // Buscar caixa aberto
  const getOpenCashRegister = async (): Promise<CashRegister | null> => {
    if (!restaurantId) return null;
    return CashRegisterEngine.getOpenCashRegister(restaurantId);
  };

  // Total do dia
  const getDailyTotal = async (): Promise<number> => {
    if (!restaurantId) return 0;

    const payments = await PaymentEngine.getTodayPayments(restaurantId);
    return payments.reduce((sum, p) => sum + p.amountCents, 0);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        pendingExceptions,
        loading,
        error,
        // === KDS HARDENING: Expor todos os estados de conexão ===
        isConnected: isOnline,
        isOffline,
        pendingSync, // Offline queue count (for OfflineIndicator)
        realtimeStatus, // 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR' | etc
        lastRealtimeEvent, // Timestamp do último evento

        createOrder,
        addOrder: (order: Order) => setOrders((prev) => [...prev, order]),
        updateOrderStatus: (orderId: string, status: Order["status"]) =>
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
          ),
        resetOrders: () => setOrders([]),
        addItemToOrder,
        removeItemFromOrder,
        updateItemQuantity,
        performOrderAction,
        attachCustomer,
        cancelOrder,
        getActiveOrders,
        syncNow: () => getActiveOrders(),
        openCashRegister,
        closeCashRegister,
        getOpenCashRegister,
        getDailyTotal,
        cashRegisterId,
        isOrderConfirmed,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context)
    throw new Error("useOrders must be used within an OrderProvider");
  return context;
}
