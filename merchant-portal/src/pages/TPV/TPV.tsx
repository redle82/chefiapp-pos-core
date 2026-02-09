/**
 * TPV — Ponto de venda (fluxo real: mesa → pedido → pagar).
 *
 * FLUXO PRINCIPAL
 * 1. Operador desbloqueia (TPVLockScreen) → start_turn RPC → restaurante/turno ativo.
 * 2. Navegação: menu | tables | orders | reservations | delivery | warmap (ContextView).
 * 3. Criar pedido: só ao adicionar primeiro item (handleAddItem) ou via mapa (handleCreateOrderViaMap); nunca pedido vazio.
 * 4. Pedido ativo: activeOrderId + StreamTunnel (lista) + OrderSummaryPanel (ticket) + OrderItemEditor; ações via performOrderAction.
 * 5. Pagamento: handleAction("pay") abre PaymentModal → handlePayment → performOrderAction("pay") → fiscal emit se total pago.
 *
 * GUARDS CRÍTICOS (ordem de bloqueio)
 * - useOperationalReadiness("TPV"): bootstrap/tenant; redireciona ou BlockingScreen se não pronto.
 * - isLocked: TPVLockScreen até start_turn sucesso (sessão + RPC).
 * - cashRegisterOpen: criar venda exige caixa aberto (handleCreateOrder, handleCreateOrderViaMap, handleAddItem implícito via createOrder).
 * - guards.canCreateOrder: bootstrap.publishStatus === "publicado" (evita 409 em gm_order_items).
 * - guards.actionsEnabled: healthStatus UP/DEGRADED ou isDemoData ou isOnline; bloqueia pay/prepare/ready/cancel se Core down (exceto demo).
 * - role: fechar/abrir caixa só gerente (useCommonTPVShortcuts).
 *
 * DEPENDÊNCIAS REAIS
 * - OrderProvider (OrderContextReal): useOrders → createOrder, addItemToOrder, performOrderAction, getOpenCashRegister, openCashRegister, closeCashRegister (CoreOrdersApi / PaymentEngine).
 * - TableProvider: useTables (mesas do Core).
 * - useDynamicMenu(restaurantId, mode: "tpv"): menu para QuickMenuPanel; coreReachable = bootstrap.coreStatus === "online".
 * - useCoreHealth: healthStatus para guards.actionsEnabled.
 * - useShift: refreshShiftStatus após abrir/fechar caixa.
 * - Bootstrap: publishStatus, operationMode, coreStatus (exploração vs operação real).
 */
// Auth only — temporary until Core Auth (getSession for start_turn)
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { getTableHealth } from "../../core/domain/TableHealthUtils";
import {
  getErrorMessage,
  getErrorSuggestion,
} from "../../core/errors/ErrorMessages";
import { LoyaltyProvider } from "../../core/loyalty/LoyaltyContext";
import {
  getTabIsolated,
  removeTabIsolated,
  setTabIsolated,
} from "../../core/storage/TabIsolatedStorage";
import { AppShell } from "../../ui/design-system/AppShell";
import {
  OfflineOrderProvider,
  useOfflineOrder,
} from "./context/OfflineOrderContext";
import { OrderProvider, useOrders } from "./context/OrderContextReal";
import { TableProvider } from "./context/TableContext";

import { SyncStatusIndicator } from "../../components/SyncStatusIndicator";
import { dockerCoreClient } from "../../core-boundary/docker-core/connection";

import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import {
  MSG_CASH_ALREADY_CLOSED,
  MSG_CASH_REGISTER_CLOSED_CREATE,
  MSG_MANAGER_ONLY_CLOSE_CASH,
  MSG_MANAGER_ONLY_OPEN_CASH,
  MSG_OPEN_CASH_BEFORE_CREATE,
  MSG_SYSTEM_UNAVAILABLE_ACTION,
  MSG_SYSTEM_UNAVAILABLE_PAYMENT,
  MSG_VERIFY_CASH_ERROR,
} from "../../core/guards/GuardMessages";
import { useCoreHealth } from "../../core/health/useCoreHealth";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity"; // Visual Polish
import { BlockingScreen, useOperationalReadiness } from "../../core/readiness";
import { useShift } from "../../core/shift/ShiftContext";
import { useBootstrapState } from "../../hooks/useBootstrapState";

import { OfflineBanner } from "../../components/OfflineBanner";
import { CashRegisterAlert } from "./components/CashRegisterAlert";
import { DeliveryNotificationManager } from "./components/DeliveryNotificationManager";
import { FiscalConfigAlert } from "./components/FiscalConfigAlert";

/* UDS Implementation (Sealed) */
import { ToastContainer, useToast } from "../../ui/design-system";
import { Button } from "../../ui/design-system/Button";
import { Card } from "../../ui/design-system/Card";
import { GlobalLoadingView } from "../../ui/design-system/components";
import { CommandPanel } from "../../ui/design-system/domain/CommandPanel";
import { QuickMenuPanel } from "../../ui/design-system/domain/QuickMenuPanel";
import { StreamTunnel } from "../../ui/design-system/domain/StreamTunnel";
import { TableMapPanel } from "../../ui/design-system/domain/TableMapPanel";
import { TPVHeader } from "../../ui/design-system/domain/TPVHeader";
import { TPVLayoutSplit } from "../../ui/design-system/layouts/TPVLayoutSplit";
import { Text } from "../../ui/design-system/primitives/Text";
import { colors } from "../../ui/design-system/tokens/colors";
import { spacing } from "../../ui/design-system/tokens/spacing";
import { GroupSelector } from "./components/GroupSelector";
import { IncomingRequests } from "./components/IncomingRequests";
import { OrderHeader } from "./components/OrderHeader";
import { OrderSummaryPanel } from "./components/OrderSummaryPanel";
import { TPVNavigation } from "./components/TPVNavigation";
import { useTables } from "./context/TableContext";
import { useConsumptionGroups } from "./hooks/useConsumptionGroups";
// FASE 5: Lazy loading de componentes pesados (modais e componentes não sempre visíveis)
const PaymentModal = lazy(() =>
  import("./components/PaymentModal").then((m) => ({
    default: m.PaymentModal,
  })),
);
const SplitBillModalWrapper = lazy(() =>
  import("./components/SplitBillModalWrapper").then((m) => ({
    default: m.SplitBillModalWrapper,
  })),
);
const OpenCashRegisterModal = lazy(() =>
  import("./components/OpenCashRegisterModal").then((m) => ({
    default: m.OpenCashRegisterModal,
  })),
);
const CloseCashRegisterModal = lazy(() =>
  import("./components/CloseCashRegisterModal").then((m) => ({
    default: m.CloseCashRegisterModal,
  })),
);
const OrderItemEditor = lazy(() =>
  import("./components/OrderItemEditor").then((m) => ({
    default: m.OrderItemEditor,
  })),
);
const CreateGroupModal = lazy(() =>
  import("./components/CreateGroupModal").then((m) => ({
    default: m.CreateGroupModal,
  })),
);

import { useCurrency } from "../../core/currency/useCurrency"; // P5-5
import { TPVInstallPrompt } from "./components/TPVInstallPrompt"; // Added Install Prompt
import { useCommonTPVShortcuts } from "./hooks/useTPVShortcuts";

const QuickProductModal = lazy(() =>
  import("./components/QuickProductModal").then((m) => ({
    default: m.QuickProductModal,
  })),
);

import { useOperationalCortex } from "../../intelligence/nervous-system/OperationalCortex";
import { InsightTicker } from "./components/InsightTicker";
import { TPVLockScreen, type Operator } from "./components/TPVLockScreen";
import { useTPVVoiceControl } from "./hooks/useTPVVoiceControl";
const ReservationBoard = lazy(() => import("./reservations/ReservationBoard"));
const TPVSettingsModal = lazy(() => import("./components/TPVSettingsModal"));

import { ContextEngineProvider, useContextEngine } from "../../core/context";
import { useDynamicMenu } from "../../core/menu/DynamicMenu/hooks/useDynamicMenu";
import { OperationalModeIndicator } from "./components/OperationalModeIndicator";
import { TPVExceptionPanel } from "./components/TPVExceptionPanel";
import { TPVWarMap } from "./components/TPVWarMap";

import { useCatalogStore } from "../../core/catalog/catalogStore";
import {
  ModifierSelectorModal,
  type SelectedModifier,
} from "./components/ModifierSelectorModal";
import { ReceiptShareModal, type ReceiptShareOrder } from "./ReceiptShareModal";
import { TableActionsModal } from "./components/TableActionsModal";

type ContextView =
  | "menu"
  | "tables"
  | "orders"
  | "reservations"
  | "delivery"
  | "warmap";

/** Pure: deriva guards operacionais (sem side-effects). */
function computeGuards(params: {
  isLocked: boolean;
  cashRegisterOpen: boolean;
  publishStatus: string;
  healthStatus: string;
  isDemoData: boolean;
  isOnline: boolean;
}) {
  const canCreateOrder = params.publishStatus === "publicado";
  const actionsEnabled =
    params.healthStatus === "UP" ||
    params.healthStatus === "DEGRADED" ||
    params.isDemoData ||
    params.isOnline;
  return {
    isLocked: params.isLocked,
    cashRegisterOpen: params.cashRegisterOpen,
    canCreateOrder,
    actionsEnabled,
  };
}

/** Render do ecrã de bloqueio (TPVLockScreen). Sem hooks. */
function renderLockedState(props: {
  onUnlock: (
    op: Operator,
    mode: "command" | "rush" | "training",
  ) => Promise<void>;
}) {
  return (
    <AppShell>
      <OfflineBanner />
      <TPVLockScreen onUnlock={props.onUnlock} />
    </AppShell>
  );
}

class DebugErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any; errorInfo: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 20,
            background: "#330000",
            color: "white",
            overflow: "auto",
            height: "100vh",
            zIndex: 9999,
            position: "relative",
          }}
        >
          <h1>💥 TPV Crashed</h1>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.errorInfo?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const TPVContent = () => {
  /* FASE 5: Toast para feedback visual */
  const { success, error, toasts, dismiss } = useToast();
  const navigate = useNavigate();
  const runtimeContext = useRestaurantRuntime();
  const bootstrap = useBootstrapState();
  const shift = useShift();

  // RITUAL: Operator Gate State
  // HOOKS REFACTORING COMPLETE - Lock screen now active in all modes
  const [isLocked, setIsLocked] = useState(true);
  const [activeOperator, setActiveOperator] = useState<Operator | null>(null);
  const [activeMode, setActiveMode] = useState<
    "command" | "rush" | "training" | null
  >(null);

  // FIX: Reactive Restaurant ID Resolution
  // PITCH: Prioritize URL param > LocalStorage
  const { restaurantId: urlRestaurantId } = useParams();
  const [restaurantId, setRestaurantId] = useState<string | null>(() => {
    return urlRestaurantId || getTabIsolated("chefiapp_restaurant_id");
  });

  // Sync Logic: If URL changes, update state and storage
  useEffect(() => {
    if (urlRestaurantId && urlRestaurantId !== restaurantId) {
      console.log("[TPV] Syncing Restaurant ID from URL:", urlRestaurantId);
      setRestaurantId(urlRestaurantId);
      setTabIsolated("chefiapp_restaurant_id", urlRestaurantId);
    }
  }, [urlRestaurantId]);

  // FASE 2: Detectar exploração da URL (?demo=)
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isDemoMode =
    searchParams.get("demo") === "true" || location.state?.demo === true;

  // Persistir estado de exploração no localStorage
  useEffect(() => {
    if (isDemoMode) {
      setTabIsolated("chefiapp_tpv_demo_mode", "true");
    } else {
      removeTabIsolated("chefiapp_tpv_demo_mode");
    }
  }, [isDemoMode]);

  // Visual Polish: Get Restaurant Identity
  const { identity } = useRestaurantIdentity();

  // Polling check for external changes (Tab Isolation)
  useEffect(() => {
    const checkId = () => {
      const current = getTabIsolated("chefiapp_restaurant_id");
      // Only update if URL param is missing (URL is source of truth)
      if (!urlRestaurantId && current && current !== restaurantId) {
        console.log("[TPV] Resolved Restaurant ID from Storage:", current);
        setRestaurantId(current);
      }
    };
    const interval = setInterval(checkId, 500);
    return () => clearInterval(interval);
  }, [restaurantId, urlRestaurantId]);

  // State declarations (moved from inside handleSelectTable - React hooks must be at top level)
  const [dailyTotalCents, setDailyTotalCents] = useState<number>(0);
  const [cashRegisterOpen, setCashRegisterOpen] = useState<boolean>(false);
  const [paymentModalOrderId, setPaymentModalOrderId] = useState<string | null>(
    null,
  );
  const [splitBillModalOrderId, setSplitBillModalOrderId] = useState<
    string | null
  >(null);
  const [showOpenCashModal, setShowOpenCashModal] = useState<boolean>(false);
  const [showCloseCashModal, setShowCloseCashModal] = useState<boolean>(false);
  const [openingBalanceCents, setOpeningBalanceCents] = useState<number>(0);
  // Group selector state (for split bill functionality)
  const [showGroupSelector, setShowGroupSelector] = useState<boolean>(false);
  const [pendingItem, setPendingItem] = useState<{
    id: string;
    name: string;
    price: number;
    category: string;
  } | null>(null);
  const [showCreateGroupModal, setShowCreateGroupModal] =
    useState<boolean>(false);
  const [showQuickProductModal, setShowQuickProductModal] =
    useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Gap #10: Table actions modal (Transfer / Merge / Split)
  const [tableActionsTargetId, setTableActionsTargetId] = useState<
    string | null
  >(null);

  const {
    orders,
    createOrder,
    performOrderAction,
    addItemToOrder,
    removeItemFromOrder,
    updateItemQuantity,
    getDailyTotal,
    getOpenCashRegister,
    openCashRegister,
    closeCashRegister,
    getActiveOrders,
    isOrderConfirmed,
    loading: ordersLoading,
    error: ordersError,
  } = useOrders();

  // FASE 1 — Rascunho em memória até confirmação. Ver FLUXO_DE_PEDIDO_OPERACIONAL.md
  const [draftItems, setDraftItems] = useState<
    Array<{
      id: string;
      productId: string;
      name: string;
      price: number;
      quantity: number;
      category?: string;
      modifiers?: SelectedModifier[];
      course?: number;
    }>
  >([]);

  // --- Active course (ronda) for new items ---
  const [activeCourse, setActiveCourse] = useState<number>(1);

  // --- Modifier selector state ---
  const {
    products: catalogProducts,
    modifierGroups: catalogModifierGroups,
    modifiers: catalogModifiers,
    loadAll: loadCatalog,
  } = useCatalogStore();

  const [modifierModalItem, setModifierModalItem] = useState<{
    id: string;
    name: string;
    price: number;
    category: string;
    modifierGroupIds: string[];
    groupId?: string | null;
  } | null>(null);

  // Gap #8: Receipt share modal state
  const [receiptShareOrder, setReceiptShareOrder] =
    useState<ReceiptShareOrder | null>(null);

  // Load catalog (modifier groups) on mount
  useEffect(() => {
    loadCatalog().catch(() => {});
  }, [loadCatalog]);

  // P4-6 FIX: Use Dynamic Menu (Intelligence + Sponsorships)
  const {
    menu,
    loading: menuLoading,
    error: menuError,
    refresh: refreshMenu,
  } = useDynamicMenu({
    restaurantId: restaurantId || "",
    mode: "tpv",
    autoRefresh: true,
    coreReachable: bootstrap.coreStatus === "online",
  });

  // Adapter: Convert DynamicMenuResponse to flat MenuItem[] for QuickMenuPanel
  const menuItems = useMemo(() => {
    if (!menu) return [];

    const items: any[] = [];

    // 1. Contextual Items (High priority)
    if (menu.contextual && menu.contextual.length > 0) {
      console.log(
        "[TPV] Raw Contextual Item 0:",
        JSON.stringify(menu.contextual[0], null, 2),
      );
      menu.contextual.forEach((item) => {
        const catProduct = catalogProducts.find((p) => p.id === item.id);
        items.push({
          id: item.id,
          name: item.name, // Keep existing naming
          price: (item.price_cents || 0) / 100, // Safety check
          category: "✨ Sugestões Inteligentes",
          trackStock: true, // Assuming default true for now or map from item
          stockQuantity: 100, // Mock infinite for now or map
          modifierGroupIds:
            catProduct?.modifierGroupIds ?? item.modifierGroupIds ?? [],
        });
      });
    }

    // 2. Full Catalog
    menu.fullCatalog.forEach((cat) => {
      cat.products.forEach((item, index) => {
        // DEBUG: Inspect first item of first category
        if (index === 0 && items.length < 5) {
          console.log("[TPV] Raw Catalog Item:", JSON.stringify(item, null, 2));
        }

        const finalPrice = Number(item.price_cents || 0) / 100;

        const catProduct = catalogProducts.find((p) => p.id === item.id);
        items.push({
          id: item.id,
          name: item.name,
          price: isNaN(finalPrice) ? 0 : finalPrice,
          category: cat.name,
          trackStock: true, // Mock
          stockQuantity: 100, // Mock
          modifierGroupIds:
            catProduct?.modifierGroupIds ?? item.modifierGroupIds ?? [],
        });
      });
    });

    return items;
  }, [menu, catalogProducts]);

  const { tables, updateTablePosition } = useTables();

  // RADAR OPERACIONAL: Calculate Table Health
  // This combines static table data with live order data to predict "emotions"
  const tablesWithHealth = useMemo(() => {
    return tables.map((table) => {
      const activeOrder = orders.find(
        (o) =>
          o.tableId === table.id &&
          o.status !== "paid" &&
          o.status !== "cancelled",
      );

      const lastActivityTime = activeOrder
        ? new Date(activeOrder.createdAt)
        : null;
      // If order has items, use the latest item as last activity
      if (activeOrder && activeOrder.items.length > 0) {
        // Assuming items are roughly ordered or just take current time for interaction
        // Real impl: Use `updated_at` of order or max created_at of items
        // For demo/prototype without extensive backend changes:
        // If status is 'ready' or 'served', activity is recent.
      }

      const health = getTableHealth(
        table.status as any,
        lastActivityTime,
        lastActivityTime, // seated time roughly same as order creation for now
        false, // No "Call Waiter" signal yet
      );

      // Calculate wait minutes for display
      const now = new Date();
      const waitMinutes = lastActivityTime
        ? (now.getTime() - lastActivityTime.getTime()) / 60000
        : 0;

      return {
        ...table,
        health,
        waitMinutes,
        // Integrate order info for the map to display totals
        orderInfo: activeOrder
          ? {
              id: activeOrder.id,
              status: activeOrder.status,
              total: activeOrder.total,
            }
          : undefined,
      };
    });
  }, [tables, orders]);

  // BRAIN: Engage the AI Sub-Chef
  const { topInsight } = useOperationalCortex(tablesWithHealth);

  // P1-1 FIX: Health monitoring para habilitar/desabilitar ações
  const { status: healthStatus } = useCoreHealth({
    autoStart: true,
    pollInterval: 30000,
    downPollInterval: 10000,
  });

  // Online/Offline status (must be declared before use)
  const { isOffline } = useOfflineOrder();
  const isOnline = !isOffline;

  // P1-1 FIX: Determinar se ações devem estar habilitadas
  // Ações offline (criar pedido, adicionar item) sempre permitidas
  // Ações críticas (pagamento) respeitam health status
  // FASE 2: Detectar exploração da URL (?demo=)
  // FASE 2: Detectar se é modo tutorial
  const isTutorialMode =
    location.state?.tutorial === true ||
    searchParams.get("tutorial") === "true";

  // Bootstrap: decisão de exploração vem do estado canónico
  const isDemoData = bootstrap.operationMode === "exploracao";

  // Guards operacionais (agrupados por intenção)
  const guards = useMemo(
    () =>
      computeGuards({
        isLocked,
        cashRegisterOpen,
        publishStatus: bootstrap.publishStatus,
        healthStatus,
        isDemoData,
        isOnline,
      }),
    [
      isLocked,
      cashRegisterOpen,
      bootstrap.publishStatus,
      healthStatus,
      isDemoData,
      isOnline,
    ],
  );
  const { intention, role } = useContextEngine();

  const [contextView, setContextView] = useState<ContextView>(() => {
    // "One App" Logic: Waiters start at Tables, Others at Menu
    return intention === "execute" ? "tables" : "menu";
  });
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => {
    // HARD RULE 4: Recuperar pedido ativo ao carregar (Tab-Isolated)
    return getTabIsolated("chefiapp_active_order_id");
  });
  const [dailyTotal, setDailyTotal] = useState<string>("€0,00");

  // SEMANA 2 - Tarefa 3.2: Integrar useConsumptionGroups
  const { groups, fetchGroups, createGroup } =
    useConsumptionGroups(activeOrderId);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const { formatAmount } = useCurrency();

  // FASE 5: Toast removido daqui (já declarado acima)

  // FASE 2: Pré-preencher dados de exemplo (só quando publicado, para evitar 409)
  useEffect(() => {
    if (
      isDemoData &&
      guards.canCreateOrder &&
      restaurantId &&
      menuItems.length > 0 &&
      tables.length > 0 &&
      !activeOrderId
    ) {
      // Aguardar um pouco para garantir que tudo está carregado
      const timer = setTimeout(() => {
        // Selecionar primeira mesa
        const firstTable = tables[0];
        if (firstTable) {
          setSelectedTableId(firstTable.id);

          // Adicionar 2-3 itens do menu ao carrinho
          const itemsToAdd = menuItems.slice(0, Math.min(3, menuItems.length));

          if (itemsToAdd.length > 0) {
            // Criar pedido com itens pré-preenchidos
            createOrder({
              status: "new",
              items: itemsToAdd.map((item) => ({
                id: item.id,
                productId: item.id,
                name: item.name,
                price: Math.round(item.price * 100),
                quantity: 1,
                categoryName: item.category,
              })),
              total: itemsToAdd.reduce(
                (sum, item) => sum + Math.round(item.price * 100),
                0,
              ),
              tableNumber: firstTable.number,
              tableId: firstTable.id,
            })
              .then((order) => {
                setActiveOrderId(order.id);
                setTabIsolated("chefiapp_active_order_id", order.id);
                success("Pedido criado com itens de exemplo");
              })
              .catch((err: any) => {
                console.error("[TPV] Error creating demo order:", err);
                const errorMsg = getErrorMessage(err, {
                  code: err.code,
                  message: err.message,
                  tableId: firstTable.id,
                  tableNumber: firstTable.number,
                });
                error(errorMsg);
              });
          }
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [
    isDemoData,
    guards.canCreateOrder,
    restaurantId,
    menuItems,
    tables,
    activeOrderId,
    createOrder,
    success,
  ]);

  const handleSelectTable = async (tableId: string) => {
    setSelectedTableId(tableId);

    // UX: Verificar se mesa já tem pedido ativo
    const table = tables.find((t) => t.id === tableId);
    if (table) {
      const existingOrder = orders.find(
        (o) =>
          o.tableId === tableId &&
          o.status !== "paid" &&
          o.status !== "cancelled",
      ); // Use 'orders' instead of 'activeOrders' if undefined
      if (existingOrder) {
        // Abrir pedido existente automaticamente
        setActiveOrderId(existingOrder.id);
        setTabIsolated("chefiapp_active_order_id", existingOrder.id);
        success(`Pedido da mesa ${table.number} aberto`);
      }
    }
  };

  // Agile Product Creation Handler
  const handleCreateQuickProduct = async (name: string, price: number) => {
    try {
      // Generate a temporary ID for the ad-hoc product
      const tempId = crypto.randomUUID();

      if (activeOrderId) {
        if (isOrderConfirmed(activeOrderId)) {
          error(
            "Pedido já confirmado. Inicie um novo pedido para adicionar itens.",
          );
          return;
        }
        await addItemToOrder(activeOrderId, {
          productId: tempId,
          name: name,
          priceCents: Math.round(price * 100),
          quantity: 1,
          categoryName: "⚡ Agile Created",
        });
        success(`Produto "${name}" adicionado!`);
      } else {
        if (!guards.canCreateOrder) {
          error("Publique o menu para criar pedidos reais.");
          return;
        }
        setDraftItems((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            productId: tempId,
            name: name,
            price: Math.round(price * 100),
            quantity: 1,
            category: "⚡ Agile Created",
          },
        ]);
        success(`Produto "${name}" adicionado ao rascunho`);
      }
    } catch (err: any) {
      console.error("Quick product failed:", err);
      const errorMsg = getErrorMessage(err, {
        code: err.code,
        message: err.message,
        tableId: selectedTableId || undefined,
        tableNumber: selectedTableId
          ? tables.find((t) => t.id === selectedTableId)?.number
          : undefined,
        itemName: name,
      });
      error(errorMsg);

      const suggestion = getErrorSuggestion(err, {
        code: err.code,
        tableId: selectedTableId || undefined,
      });
      if (suggestion) {
        setTimeout(() => {
          error(suggestion);
        }, 2000);
      }
    }
  };

  // Filter active orders (not delivered/cancelled) - MOVED BEFORE GUARD
  const activeOrders = useMemo(() => {
    // HARD RULE: Pedidos pagos são 'preparing' ou 'ready' (ainda ativos na cozinha/tela)
    // Apenas 'delivered' e 'canceled' saem do túnel
    return orders.filter(
      (o) => o.status !== "paid" && o.status !== "cancelled",
    );
  }, [orders]);

  // --------------------------------------------------------------------------------
  // BRAIN: VOICE CONTROL (SUB-CHEF EARS) - Must be before isLocked guard to avoid hooks violation
  // --------------------------------------------------------------------------------
  const { isListening, isAvailable, startListening, stopListening } =
    useTPVVoiceControl({
      tables,
      orders,
      onSelectTable: handleSelectTable,
      onSwitchView: setContextView,
      onCloseCash: () => {
        if (cashRegisterOpen) setShowCloseCashModal(true);
        else error(MSG_CASH_ALREADY_CLOSED);
      },
      onOpenPayment: () => {
        if (activeOrderId) setPaymentModalOrderId(activeOrderId);
        else error("Nenhum pedido ativo para pagar");
      },
    });

  // Auto-start listening if available (System default behavior)
  useEffect(() => {
    if (isAvailable && !isListening) {
      startListening();
    }
  }, [isAvailable, isListening, startListening]);

  // FASE 2 + P3-3: Keyboard shortcuts - Must be before isLocked guard
  useCommonTPVShortcuts({
    onCreateOrder: () => {
      if (cashRegisterOpen) {
        handleCreateOrder();
      } else {
        error(MSG_OPEN_CASH_BEFORE_CREATE);
        setShowOpenCashModal(true);
      }
    },
    onCloseOrder: () => {
      if (activeOrderId) {
        const order = orders.find((o) => o.id === activeOrderId);
        if (order && order.status !== "paid") {
          setPaymentModalOrderId(activeOrderId);
        }
      }
    },
    onSearchTable: () => {
      setContextView("tables");
    },
    onOpenCash: () => {
      if (role === "waiter") {
        error(MSG_MANAGER_ONLY_OPEN_CASH);
        return;
      }
      if (!cashRegisterOpen) {
        setShowOpenCashModal(true);
      }
    },
    onCloseCash: () => {
      if (role === "waiter") {
        error(MSG_MANAGER_ONLY_CLOSE_CASH);
        return;
      }
      if (cashRegisterOpen) {
        if (activeOrders.length > 0) {
          error(
            `Impossível fechar caixa: Existem ${activeOrders.length} pedidos em aberto. Finalize ou cancele-os antes.`,
          );
          return;
        }
        setShowCloseCashModal(true);
      }
    },
    onPayment: () => {
      if (activeOrderId) {
        const order = orders.find((o) => o.id === activeOrderId);
        if (order && order.status !== "paid") {
          setPaymentModalOrderId(activeOrderId);
        }
      }
    },
    onCancel: () => {
      // Close any open modals
      setShowOpenCashModal(false);
      setShowCloseCashModal(false);
      setPaymentModalOrderId(null);
    },
  });

  // BUG-023 FIX: Detect offline/online status - MOVED BEFORE GUARD
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // DEBUG: TPV State - MOVED BEFORE GUARD
  useEffect(() => {
    console.log("[TPV] Render State:", {
      activeOrderId,
      activeOrdersCount: activeOrders.length,
      contextView,
      loading: ordersLoading,
      ordersstate: orders.length,
      menuItemsCount: menuItems.length,
    });
  }, [
    activeOrderId,
    activeOrders,
    contextView,
    ordersLoading,
    orders,
    menuItems,
  ]);

  // Load daily total and check cash register - MOVED BEFORE GUARD
  useEffect(() => {
    // Only load financial data if allowed
    if (role === "waiter") return;

    const loadData = async () => {
      try {
        const totalCents = await getDailyTotal();
        setDailyTotalCents(totalCents);
        setDailyTotal(formatAmount(totalCents));

        const register = await getOpenCashRegister();
        const isOpen = !!register;
        setCashRegisterOpen(isOpen);
        if (register) {
          setOpeningBalanceCents(register.openingBalanceCents);
        }

        if (!isOpen && !showOpenCashModal && activeOrders.length === 0) {
          // UX hint only
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [
    getDailyTotal,
    getOpenCashRegister,
    showOpenCashModal,
    activeOrders.length,
  ]);

  const getDeviceId = () => {
    let deviceId = localStorage.getItem("chefiapp_device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("chefiapp_device_id", deviceId);
    }
    return deviceId;
  };

  const handleUnlock = useCallback(
    async (op: Operator, mode: "command" | "rush" | "training") => {
      const dbMode = mode === "command" ? "tower" : mode;
      const permissionRole = op.role === "manager" ? "manager" : "waiter";
      const { DEFAULT_PERMISSIONS } = await import(
        "../../core/context/ContextTypes"
      );
      const permissionsSnapshot = DEFAULT_PERMISSIONS[permissionRole] || {};

      try {
        if (!restaurantId) {
          console.error("[TPV] Cannot start turn: Missing Restaurant ID");
          error("Erro crítico: Restaurant ID não identificado.");
          return;
        }

        console.log("[TPV] invoking start_turn RPC with:", {
          mode: dbMode,
          role: op.role,
          perms: permissionsSnapshot,
        });

        const { supabase } = await import("../../core/supabase");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          const { isDevStableMode } = await import(
            "../../core/runtime/devStableMode"
          );
          if (isDemoData || isDevStableMode()) {
            console.log(
              "[TPV] Demo/DEV_STABLE Mode: Simulating start_turn success",
            );
            setActiveOperator(op);
            setIsLocked(false);
            success(`Comando Assumido (Demo): ${op.name}`);
            return;
          }
          throw new Error("SESSION_EXPIRED");
        }

        const { data: rpcData, error: rpcError } = await import(
          "../../core/infra/coreRpc"
        ).then((m) =>
          m.invokeRpc<{
            success?: boolean;
            error?: string;
            session_id?: string;
          }>("start_turn", {
            p_restaurant_id: restaurantId,
            p_operational_mode: dbMode,
            p_device_id: getDeviceId(),
            p_device_name: "TPV Browser",
            p_role_at_turn: op.role,
            p_permissions_snapshot: permissionsSnapshot,
          }),
        );

        if (rpcError) throw new Error(rpcError.message);
        if (rpcData && rpcData.success === false) {
          throw new Error(rpcData.error);
        }

        setActiveOperator(op);
        setActiveMode(mode);
        setIsLocked(false);
        if (rpcData?.session_id) {
          localStorage.setItem("chefiapp_turn_session_id", rpcData.session_id);
        }
        success(`Comando Assumido: ${op.name}`);
      } catch (err: any) {
        console.error("Start Turn Failed:", err);
        const msg =
          err.message === "TOWER_MODE_FORBIDDEN"
            ? "Acesso Negado: Apenas Gerentes podem acessar a Torre de Controle."
            : "Erro ao iniciar turno. Verifique conexão.";
        error(msg);
      }
    },
    [
      restaurantId,
      isDemoData,
      error,
      success,
      setActiveOperator,
      setActiveMode,
      setIsLocked,
    ],
  );

  // --------------------------------------------------------------------------------
  // RITUAL: THE GATEKEEPER
  // --------------------------------------------------------------------------------
  if (isLocked) return renderLockedState({ onUnlock: handleUnlock });
  // --------------------------------------------------------------------------------
  // END GUARD
  // --------------------------------------------------------------------------------

  console.log("[TPV] BODY RENDER. menuItems:", menuItems?.length);
  if (menuItems?.length > 0) {
    const debugPrices = menuItems
      .map((i) => `${i.name}: ${i.price} (${typeof i.price})`)
      .join(", ");
    console.log("[TPV] All Menu Items Prices:", debugPrices);
  }

  // SANITIZATION LAYER: Ensure no bad data reaches UI
  const safeMenuItems = (menuItems || []).map((item) => ({
    ...item,
    price:
      typeof item.price === "number" && !isNaN(item.price) ? item.price : 0,
  }));

  // FLOW: Transições de estado (prepare/ready/serve/pay/cancel) — performOrderAction → Core.
  const handleAction = async (orderId: string, action: string) => {
    // P1-1 FIX: Bloquear ações críticas se sistema down (exceto demo)
    const criticalActions = ["pay", "prepare", "ready", "cancel"];
    if (
      criticalActions.includes(action) &&
      !guards.actionsEnabled &&
      !isDemoData
    ) {
      error(MSG_SYSTEM_UNAVAILABLE_ACTION);
      return;
    }

    // P1-4 FIX: Truth-First - Não atualizar UI antes do Core confirmar
    // A UI mostrará status da queue (pending/syncing/applied) via StreamTunnel
    // Não fazemos optimistic updates aqui - aguardamos confirmação do Core

    try {
      // HARD RULE 2: 'pay' abre modal de pagamento
      if (action === "pay") {
        setPaymentModalOrderId(orderId);
        return;
      }

      // Context Guard: Cancel requires manager (unless configured otherwise)
      if (action === "cancel" && role === "waiter") {
        // For now, simpler error. Future: Manager Override Modal
        error("Cancelamento requer autorização de gerente");
        return;
      }

      // P1-4 FIX: Executar ação e aguardar confirmação antes de atualizar UI
      await performOrderAction(orderId, action);

      // P1-4 FIX: Aguardar refresh completo antes de mostrar sucesso
      // Isso garante que a UI mostra apenas o que o Core confirmou
      console.log("[TPV] Syncing orders after action...");
      await getActiveOrders();

      // Apenas após getActiveOrders() completar, a UI será atualizada
      // O StreamTunnel mostrará o status correto baseado nos dados do Core
    } catch (err: any) {
      console.error("Failed to perform action:", err);

      const errorMsg = getErrorMessage(err, {
        code: err.code,
        message: err.message,
        orderId: orderId,
      });

      error(errorMsg);

      // P1-4 FIX: Em caso de erro, refresh para garantir UI sincronizada
      await getActiveOrders();
    }
  };

  // Handler de desconto inline (chamado pelo TicketCard via StreamTunnel)
  const handleDiscount = async (orderId: string, discountCents: number) => {
    if (!orderId || discountCents <= 0) return;
    try {
      await dockerCoreClient
        .from("gm_orders")
        .update({ discount_cents: discountCents })
        .eq("id", orderId);
      await getActiveOrders();
      success(`Desconto de €${(discountCents / 100).toFixed(2)} aplicado`);
    } catch (err: any) {
      console.error("Discount failed:", err);
      error(err?.message || "Erro ao aplicar desconto");
    }
  };

  // Handler de pagamento (chamado pelo modal)
  const handlePayment = async (
    method: string,
    intentId?: string,
    tipCents?: number,
  ) => {
    if (!paymentModalOrderId) return;

    // FASE 2: Simular pagamento (exploração) — decisão do bootstrap
    if (isDemoData) {
      // Simular sucesso de pagamento
      success("🎉 Pagamento processado com sucesso!");

      // Fechar modal
      setPaymentModalOrderId(null);

      // Se for tutorial, redirecionar para dashboard após 2 segundos
      if (isTutorialMode) {
        setTimeout(() => {
          success(
            "Parabéns! Você completou sua primeira venda. Agora você pode usar o TPV normalmente.",
          );
          setTimeout(() => {
            navigate("/app/dashboard", {
              state: { firstSaleCompleted: true },
            });
          }, 2000);
        }, 2000);
      }

      return;
    }

    // P1-1 FIX: Bloquear pagamento se sistema down e não for demo
    if (!guards.actionsEnabled && !isDemoData) {
      error(MSG_SYSTEM_UNAVAILABLE_PAYMENT);
      return;
    }

    // SEMANA 1 - Tarefa 1.3: Validação de saldo antes de fechar conta
    const order = activeOrders.find((o) => o.id === paymentModalOrderId);
    if (!order) {
      error("Pedido não encontrado");
      return;
    }

    // Validar que pedido tem itens
    if (!order.items || order.items.length === 0) {
      error(
        "Não é possível fechar conta sem itens. Adicione itens ao pedido primeiro.",
      );
      return;
    }

    // INV-006: UI uses Domain's total, never calculates independently
    const totalCents = order.total;
    if (totalCents <= 0) {
      error(
        "Não é possível fechar conta com total zero. Adicione itens ao pedido primeiro.",
      );
      return;
    }

    // Validar que pedido não está totalmente pago
    if (order.status === "paid") {
      error("Este pedido já foi totalmente pago.");
      return;
    }

    // SEMANA 2: Se está parcialmente pago (partially_paid), permitir continuar pagamento (split bill)
    // Não bloquear aqui, apenas validar no backend

    // SEMANA 2: Aqui adicionaremos validação de saldo parcial (split bill)
    // Por enquanto, assumimos que se chegou aqui, o saldo está completo

    try {
      // Para pagamentos Stripe (card), passar intentId no metadata
      const payload: any = { method };
      if (method === "card" && intentId) {
        payload.stripe_intent_id = intentId;
      }
      if (tipCents && tipCents > 0) {
        payload.tip_cents = tipCents;
      }

      await performOrderAction(paymentModalOrderId, "pay", payload);

      // SPRINT 1 - Tarefa 1.1: Emissão Fiscal no Backend
      // SPRINT 1 - Tarefa 1.4: Emitir fiscal apenas quando totalmente pago
      // Aguardar atualização do pedido para verificar status
      await getActiveOrders();

      // Verificar se pedido está totalmente pago antes de emitir fiscal
      const updatedOrder = activeOrders.find(
        (o) => o.id === paymentModalOrderId,
      );
      if (updatedOrder && restaurantId) {
        // Buscar pagamentos para calcular total pago
        try {
          const { PaymentEngine } = await import(
            "../../core/tpv/PaymentEngine"
          );
          const payments = await PaymentEngine.getPaymentsByOrder(
            paymentModalOrderId,
          );
          const totalPaid = payments
            .filter((p) => p.status === "PAID")
            .reduce((sum, p) => sum + p.amountCents, 0);

          const orderTotal = updatedOrder.total;

          // SPRINT 1 - Tarefa 1.4: Só emitir fiscal se totalmente pago
          if (totalPaid >= orderTotal && updatedOrder.status === "paid") {
            // Chamar endpoint do backend para adicionar à fila fiscal
            try {
              const apiUrl =
                process.env.REACT_APP_API_URL || "http://localhost:4320";
              const sessionToken =
                localStorage.getItem("chefiapp_session_token") ||
                getTabIsolated("chefiapp_session_token");

              const response = await fetch(`${apiUrl}/api/fiscal/emit`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-chefiapp-token": sessionToken || "",
                },
                body: JSON.stringify({
                  orderId: paymentModalOrderId,
                  restaurantId: restaurantId,
                  paymentMethod: method,
                  amountCents: orderTotal,
                  paymentId: intentId,
                  idempotencyKey: `fiscal:${paymentModalOrderId}:${Date.now()}`,
                }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                if (errorData.error === "ORDER_NOT_FULLY_PAID") {
                  // Pedido não está totalmente pago ainda (split bill em progresso)
                  console.log(
                    "[TPV] Fiscal not emitted - order not fully paid yet",
                  );
                } else {
                  console.warn(
                    "[TPV] Fiscal emission failed (non-blocking):",
                    errorData,
                  );
                }
              } else {
                const fiscalEmitResult = await response.json();
                console.log(
                  "[TPV] Fiscal emission queued:",
                  fiscalEmitResult.queue_id,
                );
              }
            } catch (fiscalError) {
              // Log mas não bloqueia pagamento
              console.warn(
                "[TPV] Fiscal emission request failed (non-blocking):",
                fiscalError,
              );
            }
          } else {
            // Pedido parcialmente pago - não emitir fiscal ainda
            console.log("[TPV] Fiscal not emitted - order partially paid", {
              totalPaid,
              orderTotal,
              status: updatedOrder.status,
            });
          }
        } catch (fiscalError) {
          // Log mas não bloqueia pagamento
          console.warn(
            "[TPV] Fiscal emission check failed (non-blocking):",
            fiscalError,
          );
        }
      }

      setPaymentModalOrderId(null);

      // Gap #8: Prepare receipt share data before clearing order
      const tableForOrder = tables.find((t) => t.id === order.tableId);
      setReceiptShareOrder({
        id: order.id,
        tableNumber: tableForOrder?.number,
        totalCents: order.total,
        items: (order.items || []).map((it: any) => ({
          name: it.name || it.product_name || "Item",
          quantity: it.quantity ?? 1,
          priceCents: it.price ?? it.unit_price ?? 0,
        })),
        paymentMethod: method,
        tipCents: tipCents ?? 0,
        discountCents: (order as any).discount_cents ?? 0,
        restaurantName: identity?.name || "Restaurante",
        paidAt: new Date().toISOString(),
      });

      // Limpar pedido ativo após pagamento
      if (activeOrderId === paymentModalOrderId) {
        setActiveOrderId(null);
        removeTabIsolated("chefiapp_active_order_id");
      }

      success("Pedido pago com sucesso");
    } catch (err: any) {
      console.error("Payment failed:", err);

      const errorMsg = getErrorMessage(err, {
        code: err.code,
        message: err.message,
        orderId: paymentModalOrderId,
      });

      error(errorMsg);
      // Não relançar erro - PaymentModal já trata visualmente via setResult('error')
    }
  };

  // SEMANA 2 - Tarefa 3.3: Handler de pagamento parcial (split bill)
  const handlePartialPayment = async (
    amountCents: number,
    method: "cash" | "card" | "pix",
  ) => {
    if (!splitBillModalOrderId) return;

    // P1-1 FIX: Bloquear pagamento se sistema down e não for demo
    if (!guards.actionsEnabled && !isDemoData) {
      error(MSG_SYSTEM_UNAVAILABLE_PAYMENT);
      return;
    }

    const order = activeOrders.find((o) => o.id === splitBillModalOrderId);
    if (!order) {
      error("Pedido não encontrado");
      return;
    }

    // Validar que amount não é maior que o total restante
    // (vamos buscar pagamentos para calcular quanto já foi pago)
    try {
      const { PaymentEngine } = await import("../../core/tpv/PaymentEngine");
      const payments = await PaymentEngine.getPaymentsByOrder(
        splitBillModalOrderId,
      );
      const paidAmount = payments
        .filter((p) => p.status === "PAID")
        .reduce((sum, p) => sum + p.amountCents, 0);

      const remainingAmount = order.total - paidAmount;

      if (amountCents > remainingAmount) {
        error(
          `Valor excede o saldo restante de ${formatAmount(remainingAmount)}`,
        );
        return;
      }

      // Processar pagamento parcial usando performOrderAction
      // Passar amount no payload para o backend processar como parcial
      await performOrderAction(splitBillModalOrderId, "pay", {
        method,
        amountCents, // Valor parcial
        isPartial: true, // Flag indicando que é pagamento parcial
      });

      // Atualizar lista de pedidos
      await getActiveOrders();

      success(`Pagamento de ${formatAmount(amountCents)} registrado`);

      // Se saldo zerou, fechar modal
      const newPaidAmount = paidAmount + amountCents;
      if (newPaidAmount >= order.total) {
        setSplitBillModalOrderId(null);
        // Limpar pedido ativo se foi totalmente pago
        if (activeOrderId === splitBillModalOrderId) {
          setActiveOrderId(null);
          removeTabIsolated("chefiapp_active_order_id");
        }
      }
    } catch (err: any) {
      console.error("Partial payment failed:", err);
      error(err.message || "Erro ao processar pagamento parcial");
    }
  };

  const handleCreateOrder = async () => {
    // HARD-BLOCK 1: Verificar caixa antes de qualquer ação (UI)
    if (!cashRegisterOpen) {
      error(MSG_OPEN_CASH_BEFORE_CREATE);
      setShowOpenCashModal(true);
      return;
    }

    // HARD-BLOCK 2: Verificar caixa no backend também (double-check)
    try {
      const register = await getOpenCashRegister();
      if (!register) {
        error(MSG_CASH_REGISTER_CLOSED_CREATE);
        setCashRegisterOpen(false);
        setShowOpenCashModal(true);
        return;
      }
    } catch {
      error(MSG_VERIFY_CASH_ERROR);
      setShowOpenCashModal(true);
      return;
    }

    // NOTA: handleCreateOrder não deve criar pedido vazio
    // O fluxo correto é: adicionar item do menu → cria pedido automaticamente
    // Este handler só existe para casos especiais (ex: pedido sem mesa)
    // Por enquanto, redireciona para o menu
    setContextView("menu");
    error("Adicione itens do menu para criar um pedido");
  };

  // FLOW: Nascimento do pedido (via mapa de mesas) — createOrder vazio; primeiro item vem do menu.
  const handleCreateOrderViaMap = async (tableId: string) => {
    // Check if table already has an order
    const existingOrder = orders.find(
      (o) =>
        o.tableId === tableId &&
        o.status !== "paid" &&
        o.status !== "cancelled",
    );
    if (existingOrder) {
      setActiveOrderId(existingOrder.id);
      setContextView("menu");
      return;
    }

    // Check cash register
    if (!cashRegisterOpen) {
      error(MSG_OPEN_CASH_BEFORE_CREATE);
      setShowOpenCashModal(true);
      return;
    }

    // Guardrail FK: criar pedido só com menu publicado
    if (!guards.canCreateOrder) {
      error("Publique o menu para criar pedidos reais.");
      return;
    }

    // Create new order for this table
    try {
      const table = tables.find((t) => t.id === tableId);
      const tableNumber = table?.number || 0;
      const newOrder = await createOrder({ items: [], tableNumber, tableId });
      if (newOrder?.id) {
        setActiveOrderId(newOrder.id);
        setSelectedTableId(tableId);
        setContextView("menu");
        success(`Pedido criado para mesa ${tableNumber}`);
      }
    } catch (err: any) {
      console.error("Failed to create order:", err);
      const errorMsg = getErrorMessage(err, {
        code: err.code,
        message: err.message,
        tableId: tableId,
        tableNumber: tables.find((t) => t.id === tableId)?.number,
      });
      error(errorMsg);

      const suggestion = getErrorSuggestion(err, {
        code: err.code,
        tableId: tableId,
      });
      if (suggestion) {
        setTimeout(() => {
          error(suggestion);
        }, 2000);
      }

      // Auto-handle TABLE_HAS_ACTIVE_ORDER: open existing order
      if (
        err.code === "23505" ||
        err.code === "TABLE_HAS_ACTIVE_ORDER" ||
        err.message?.includes("idx_one_open_order_per_table")
      ) {
        const existingOrder = activeOrders.find((o) => o.tableId === tableId);
        if (existingOrder) {
          setActiveOrderId(existingOrder.id);
          setTabIsolated("chefiapp_active_order_id", existingOrder.id);
        }
      }
    }
  };

  // FLOW: FASE 1 — Rascunho em memória; createOrder só ao clicar Confirmar. Ver FLUXO_DE_PEDIDO_OPERACIONAL.md
  const handleAddItem = async (
    item: {
      id: string;
      name: string;
      price: number;
      category: string;
      modifierGroupIds?: string[];
    },
    groupId?: string | null,
    selectedModifiers?: SelectedModifier[],
  ) => {
    console.log(
      "[TPV] handleAddItem called for:",
      item.name,
      item.id,
      "group:",
      groupId,
    );

    // --- Modifier interception: if product has modifier groups and none selected yet, show modal ---
    const mGroupIds = item.modifierGroupIds ?? [];
    if (mGroupIds.length > 0 && !selectedModifiers) {
      const linkedGroups = catalogModifierGroups.filter((g) =>
        mGroupIds.includes(g.id),
      );
      if (linkedGroups.length > 0) {
        setModifierModalItem({
          id: item.id,
          name: item.name,
          price: item.price,
          category: item.category,
          modifierGroupIds: mGroupIds,
          groupId,
        });
        return; // wait for modal confirmation
      }
    }

    try {
      // FASE 1: Sem pedido ativo → adicionar ao rascunho (nenhum write no Core)
      if (!activeOrderId) {
        if (!guards.canCreateOrder) {
          error("Publique o menu para criar pedidos reais.");
          return;
        }
        setDraftItems((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            productId: item.id,
            name: item.name,
            price: Math.round(item.price * 100),
            quantity: 1,
            category: item.category,
            modifiers: selectedModifiers,
            course: activeCourse,
          },
        ]);
        success(`${item.name} adicionado ao rascunho (Ronda ${activeCourse})`);
        return;
      }

      // FASE 1: Pedido já confirmado → imutável
      if (isOrderConfirmed(activeOrderId)) {
        error(
          "Pedido já confirmado. Inicie um novo pedido para adicionar itens.",
        );
        return;
      }

      // Calculate modifier price delta
      const modDelta = (selectedModifiers ?? []).reduce(
        (s, m) => s + m.priceDeltaCents,
        0,
      );

      // Pedido ativo ainda editável (legacy path, ex.: mapa de mesas)
      await addItemToOrder(activeOrderId, {
        productId: item.id,
        name: item.name,
        priceCents: Math.round(item.price * 100) + modDelta,
        quantity: 1,
        categoryName: item.category,
        consumptionGroupId: groupId || undefined,
        modifiers: selectedModifiers ?? [],
        course: activeCourse,
      });

      success(`${item.name} adicionado`);
    } catch (err: any) {
      console.error("Failed to add item:", err);

      const errorMsg = getErrorMessage(err, {
        code: err.code,
        message: err.message,
        tableId: selectedTableId || undefined,
        tableNumber: selectedTableId
          ? tables.find((t) => t.id === selectedTableId)?.number
          : undefined,
        itemName: item.name,
      });

      error(errorMsg);

      const suggestion = getErrorSuggestion(err, {
        code: err.code,
        tableId: selectedTableId || undefined,
      });
      if (suggestion) {
        setTimeout(() => {
          error(suggestion);
        }, 2000);
      }

      // Auto-handle TABLE_HAS_ACTIVE_ORDER: open existing order
      if (
        err.code === "TABLE_HAS_ACTIVE_ORDER" ||
        err.message?.includes("TABLE_HAS_ACTIVE_ORDER")
      ) {
        const existingOrder = activeOrders.find(
          (o) => o.tableId === selectedTableId,
        );
        if (existingOrder) {
          setActiveOrderId(existingOrder.id);
          setTabIsolated("chefiapp_active_order_id", existingOrder.id);
        }
      }
    }
  };

  // FASE 1 — Confirmar rascunho: única escrita no Core (create_order_atomic). Ver FLUXO_DE_PEDIDO_OPERACIONAL.md
  const handleConfirmDraft = async () => {
    if (draftItems.length === 0) return;
    if (!guards.canCreateOrder) {
      error("Publique o menu para criar pedidos reais.");
      return;
    }
    try {
      const newOrder = await createOrder({
        status: "new",
        items: draftItems.map((i) => ({
          id: i.id,
          productId: i.productId,
          name: i.name,
          price: i.price / 100,
          quantity: i.quantity,
          categoryName: i.category,
          modifiers: i.modifiers ?? [],
          course: i.course ?? 1,
        })),
        total: draftItems.reduce((s, i) => s + i.price * i.quantity, 0),
        tableNumber: selectedTableId
          ? tables.find((t) => t.id === selectedTableId)?.number
          : undefined,
        tableId: selectedTableId || undefined,
      });
      setActiveOrderId(newOrder.id);
      setTabIsolated("chefiapp_active_order_id", newOrder.id);
      setDraftItems([]);
      setTimeout(() => fetchGroups(), 500);
      success("Pedido confirmado");
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, {
        code: err.code,
        message: err.message,
        tableId: selectedTableId || undefined,
        tableNumber: selectedTableId
          ? tables.find((t) => t.id === selectedTableId)?.number
          : undefined,
      });
      error(errorMsg);
    }
  };

  return (
    <AppShell operationalMode={true}>
      <OfflineBanner />
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Contingency Mode Banner */}
        {bootstrap.coreStatus === "offline-erro" && (
          <div
            style={{
              background: "#262626",
              color: "#a3a3a3",
              padding: "12px 24px",
              textAlign: "center",
              fontWeight: 500,
              fontSize: "14px",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              borderBottom: "1px solid #404040",
            }}
          >
            <span>
              {bootstrap.operationMode === "exploracao"
                ? "Dados ilustrativos. Publique o menu para operar em tempo real."
                : "Core indisponível. Pode usar com dados de exemplo."}
            </span>
            <button
              onClick={() => runtimeContext?.refresh()}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                padding: "4px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* BRAIN: Operational Ticker (The Sub-Chef's Voice) */}
        {activeMode !== "rush" && <InsightTicker insight={topInsight} />}

        <OfflineBanner />
        <DeliveryNotificationManager />
        <FiscalConfigAlert restaurantId={restaurantId} />
        <CashRegisterAlert
          isOpen={cashRegisterOpen}
          onOpenCash={() => setShowOpenCashModal(true)}
        />
        <TPVInstallPrompt />

        {/* FASE 5: Toast Container para feedback visual */}
        <ToastContainer toasts={toasts} onDismiss={dismiss} />

        {/* FASE 5: Lazy loading de modais */}
        {showSettingsModal && (
          <Suspense
            fallback={
              <div style={{ padding: 16, textAlign: "center" }}>
                Carregando...
              </div>
            }
          >
            <TPVSettingsModal
              operatorName={activeOperator?.name}
              onClose={() => setShowSettingsModal(false)}
              onAdvancedSettings={() => {
                // Navigate to /app/settings
                window.location.href = "/app/settings";
              }}
              onLogout={() => {
                setIsLocked(true);
                setActiveOperator(null);
              }}
            />
          </Suspense>
        )}

        <TPVLayoutSplit
          navigation={
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <TPVNavigation
                currentView={contextView}
                onChangeView={(view) => setContextView(view)}
                onSettings={() => setShowSettingsModal(true)}
                cashStatus={cashRegisterOpen ? "open" : "closed"}
              />
              <div style={{ padding: spacing[2], marginTop: "auto" }}>
                <SyncStatusIndicator />
              </div>
            </div>
          }
          workspace={
            <>
              {/* NEW: Operational Context Indicator */}
              {activeOperator && activeMode && (
                <OperationalModeIndicator
                  session={{
                    id: "current-session",
                    restaurant_id: restaurantId || "",
                    user_id: activeOperator.id,
                    device_id: getDeviceId(),
                    started_at: new Date().toISOString(),
                    status: "active",
                    operational_mode:
                      activeMode === "command" ? "tower" : activeMode,
                    role_at_turn: activeOperator.role,
                    permissions_snapshot: {
                      canViewFinancials: true,
                      canModifyMenu: true,
                      canmanageStaff: true,
                      canVoidOrders: true,
                      canCloseRegister: true,
                    },
                  }}
                  onLock={() => {
                    setIsLocked(true);
                    setActiveOperator(null);
                    setActiveMode(null);
                  }}
                />
              )}

              {/* Central Exception Panel - Always Visible */}
              {activeOperator && (
                <div style={{ marginBottom: spacing[4] }}>
                  <TPVExceptionPanel
                    operatorId={activeOperator.id || "op-1"}
                    operatorName={activeOperator.name || "Chef"}
                  />
                </div>
              )}

              {contextView === "menu" && (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Optional Header inside Workspace given lack of top bar */}
                  <div style={{ marginBottom: spacing[4] }}>
                    <TPVHeader
                      operatorName={activeOperator?.name || "Chef"}
                      terminalId="TERM-01"
                      isOnline={isOnline}
                      restaurantName={identity?.name || "ChefIApp"}
                      voiceControl={{
                        isListening,
                        isAvailable,
                        onToggle: isListening ? stopListening : startListening,
                      }}
                    />
                  </div>
                  <QuickMenuPanel
                    items={[
                      {
                        id: "QUICK_ADD_ACTION",
                        name: "+ Novo Produto",
                        price: 0,
                        category: "⚡ Ações",
                        trackStock: false,
                      },
                      ...safeMenuItems.map((item) => {
                        // Visual Polish: Inject demo images based on name
                        const lowerName = item.name.toLowerCase();
                        let imageUrl = undefined;

                        if (
                          lowerName.includes("coca") ||
                          lowerName.includes("refrigerante")
                        ) {
                          imageUrl = "/assets/products/coke.png";
                        } else if (
                          lowerName.includes("burger") ||
                          lowerName.includes("hamb")
                        ) {
                          imageUrl = "/assets/products/burger.png";
                        } else if (
                          lowerName.includes("frita") ||
                          lowerName.includes("batata")
                        ) {
                          imageUrl = "/assets/products/fries.png";
                        }

                        return {
                          ...item,
                          imageUrl,
                        };
                      }),
                    ]}
                    currentOrderItems={
                      activeOrderId
                        ? (
                            activeOrders.find((o) => o.id === activeOrderId)
                              ?.items || []
                          ).map((i) => ({
                            productId: i.productId || i.id,
                            quantity: i.quantity,
                          }))
                        : []
                    }
                    onAddItem={(item) => {
                      // Intercept Quick Add Action
                      if (item.id === "QUICK_ADD_ACTION") {
                        setShowQuickProductModal(true);
                        return;
                      }

                      // Se há grupos ativos, mostrar seletor
                      if (activeOrderId && groups.length > 0) {
                        setPendingItem(item);
                        setShowGroupSelector(true);
                      } else {
                        // Sem grupos ou pedido novo, adicionar direto
                        handleAddItem(item, null);
                      }
                    }}
                    loading={menuLoading}
                    error={menuError}
                    onRetry={refreshMenu}
                  />
                </div>
              )}

              {contextView === "tables" && (
                <TableMapPanel
                  tables={tablesWithHealth}
                  onSelectTable={(tableId) => {
                    setSelectedTableId(tableId);
                    const order = orders.find(
                      (o) =>
                        o.tableId === tableId &&
                        o.status !== "paid" &&
                        o.status !== "cancelled",
                    );
                    if (order) {
                      setActiveOrderId(order.id);
                      setContextView("orders");
                    }
                  }}
                  onCreateOrder={handleCreateOrderViaMap}
                  onUpdatePosition={updateTablePosition}
                  onTableAction={(tableId) => setTableActionsTargetId(tableId)}
                />
              )}

              {contextView === "orders" && (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: spacing[4],
                  }}
                >
                  <IncomingRequests
                    restaurantId={restaurantId}
                    onOrderAccepted={() => getActiveOrders()}
                  />
                  <div style={{ flex: 1, position: "relative" }}>
                    <StreamTunnel
                      orders={activeOrders}
                      onAction={handleAction}
                      onDiscount={handleDiscount}
                      activeOrderId={activeOrderId}
                      loading={ordersLoading}
                      error={ordersError}
                      onRetry={() => getActiveOrders()}
                    />
                  </div>
                </div>
              )}

              {contextView === "reservations" && (
                <div style={{ height: "100%", overflow: "hidden" }}>
                  <Suspense
                    fallback={
                      <div style={{ padding: 16, textAlign: "center" }}>
                        Carregando reservas...
                      </div>
                    }
                  >
                    <ReservationBoard restaurantId={restaurantId || ""} />
                  </Suspense>
                </div>
              )}

              {contextView === "delivery" && (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: spacing[4],
                  }}
                >
                  <div
                    style={{
                      padding: spacing[4],
                      borderBottom: `1px solid ${colors.border.subtle}`,
                    }}
                  >
                    <Text size="xl" weight="bold" color="primary">
                      🚚 Central de Delivery
                    </Text>
                    <Text size="sm" color="secondary">
                      Gestão de pedidos Uber Eats, Glovo e Web
                    </Text>
                  </div>
                  <IncomingRequests
                    restaurantId={restaurantId}
                    onOrderAccepted={() => getActiveOrders()}
                  />
                  <div
                    style={{ flex: 1, overflow: "auto", padding: spacing[4] }}
                  >
                    <StreamTunnel
                      orders={activeOrders.filter(
                        (o) =>
                          (o as any).source && (o as any).source !== "local",
                      )}
                      onAction={handleAction}
                      onDiscount={handleDiscount}
                      activeOrderId={activeOrderId}
                    />
                  </div>
                </div>
              )}

              {contextView === "warmap" && (
                <TPVWarMap
                  tables={tablesWithHealth.map((t) => ({
                    id: t.id,
                    number: t.number,
                    status:
                      (t.health as any) === "red"
                        ? "alert"
                        : (t.status as
                            | "free"
                            | "occupied"
                            | "reserved"
                            | "alert"),
                  }))}
                  orders={activeOrders.map((o) => ({
                    id: o.id,
                    status: o.status,
                    tableNumber: o.tableNumber,
                    isDelayed:
                      o.status === "new" &&
                      o.createdAt &&
                      Date.now() - new Date(o.createdAt).getTime() >
                        15 * 60 * 1000, // > 15 min
                    createdAt: o.createdAt ? new Date(o.createdAt) : undefined,
                  }))}
                  kitchenPressure={
                    activeOrders.filter((o) => o.status === "preparing")
                      .length > 10
                      ? "high"
                      : activeOrders.filter((o) => o.status === "preparing")
                          .length > 5
                      ? "medium"
                      : "low"
                  }
                  deliveryQueueCount={
                    activeOrders.filter(
                      (o) => (o as any).source && (o as any).source !== "local",
                    ).length
                  }
                  onSectorClick={(sector: any) => {
                    if (sector === "mesas") setContextView("tables");
                    else if (sector === "cozinha") setContextView("orders");
                    else if (sector === "delivery") setContextView("delivery");
                    // alertas stays on warmap for now
                  }}
                />
              )}
            </>
          }
          ticket={
            (activeOrderId &&
              activeOrders.find((o) => o.id === activeOrderId)) ||
            draftItems.length > 0 ? (
              // FASE 1: Mostrar rascunho ou pedido ativo. Rascunho = só em memória até Confirmar.
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  gap: spacing[3],
                  padding: spacing[4],
                }}
              >
                {draftItems.length > 0 && !activeOrderId ? (
                  <>
                    <OrderHeader
                      order={{
                        id: "draft",
                        status: "new",
                        items: draftItems.map((i) => ({
                          id: i.id,
                          name: i.name,
                          quantity: i.quantity,
                          price: i.price,
                        })),
                        total: draftItems.reduce(
                          (s, i) => s + i.price * i.quantity,
                          0,
                        ),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      }}
                      tableName={
                        selectedTableId
                          ? tables
                              .find((t) => t.id === selectedTableId)
                              ?.number?.toString() || ""
                          : "Rascunho"
                      }
                      customerName={""}
                    />
                    {/* Course / Ronda selector */}
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-xs font-medium text-gray-500">
                        Ronda:
                      </span>
                      {[1, 2, 3, 4].map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                            activeCourse === c
                              ? "bg-violet-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          onClick={() => setActiveCourse(c)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <Suspense
                        fallback={
                          <div style={{ padding: 16, textAlign: "center" }}>
                            Carregando...
                          </div>
                        }
                      >
                        <OrderItemEditor
                          order={{
                            id: "draft",
                            status: "new",
                            items: draftItems.map((i) => ({
                              id: i.id,
                              productId: i.productId,
                              name: i.name,
                              quantity: i.quantity,
                              price: i.price,
                            })),
                            total: draftItems.reduce(
                              (s, i) => s + i.price * i.quantity,
                              0,
                            ),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                          }}
                          onUpdateQuantity={(
                            itemId: string,
                            quantity: number,
                          ) => {
                            setDraftItems((prev) =>
                              prev.map((i) =>
                                i.id === itemId ? { ...i, quantity } : i,
                              ),
                            );
                          }}
                          onRemoveItem={(itemId: string) => {
                            setDraftItems((prev) =>
                              prev.filter((i) => i.id !== itemId),
                            );
                          }}
                          onBackToMenu={() => setDraftItems([])}
                          loading={false}
                        />
                      </Suspense>
                    </div>
                    <OrderSummaryPanel
                      order={{
                        id: "draft",
                        status: "new",
                        items: draftItems.map((i) => ({
                          id: i.id,
                          name: i.name,
                          quantity: i.quantity,
                          price: i.price,
                        })),
                        total: draftItems.reduce(
                          (s, i) => s + i.price * i.quantity,
                          0,
                        ),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      }}
                      onConfirm={handleConfirmDraft}
                      loading={ordersLoading}
                    />
                  </>
                ) : (
                  <>
                    <OrderHeader
                      order={activeOrders.find((o) => o.id === activeOrderId)}
                      tableName={
                        activeOrders
                          .find((o) => o.id === activeOrderId)
                          ?.tableNumber?.toString() || ""
                      }
                      customerName={""}
                    />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <Suspense
                        fallback={
                          <div style={{ padding: 16, textAlign: "center" }}>
                            Carregando editor...
                          </div>
                        }
                      >
                        <OrderItemEditor
                          order={
                            activeOrders.find((o) => o.id === activeOrderId) ||
                            null
                          }
                          onUpdateQuantity={async (
                            itemId: string,
                            quantity: number,
                          ) => {
                            if (!activeOrderId) return;
                            try {
                              await updateItemQuantity(
                                activeOrderId,
                                itemId,
                                quantity,
                              );
                              success("Quantidade atualizada");
                            } catch (err: any) {
                              error(
                                err.message || "Erro ao atualizar quantidade",
                              );
                            }
                          }}
                          onRemoveItem={async (itemId: string) => {
                            if (!activeOrderId) return;
                            try {
                              await removeItemFromOrder(activeOrderId, itemId);
                              success("Item removido");
                            } catch (err: any) {
                              error(err.message || "Erro ao remover item");
                            }
                          }}
                          onBackToMenu={() => {
                            setActiveOrderId(null);
                            removeTabIsolated("chefiapp_active_order_id");
                          }}
                          loading={ordersLoading}
                        />
                      </Suspense>
                    </div>
                    <OrderSummaryPanel
                      order={
                        activeOrders.find((o) => o.id === activeOrderId) || null
                      }
                      onSplitBill={() => {
                        if (activeOrderId) {
                          setSplitBillModalOrderId(activeOrderId);
                        }
                      }}
                      onPay={() => {
                        const order = activeOrders.find(
                          (o) => o.id === activeOrderId,
                        );
                        if (order && order.status !== "paid") {
                          setPaymentModalOrderId(activeOrderId);
                        }
                      }}
                      loading={ordersLoading}
                    />
                  </>
                )}
              </div>
            ) : (
              // EMPTY STATE / GENERIC TICKET
              <CommandPanel
                onCreateOrder={handleCreateOrder}
                onOpenTables={() => setContextView("tables")}
                dailyTotal={dailyTotal}
                cashRegisterOpen={cashRegisterOpen}
                onOpenCashRegister={() => setShowOpenCashModal(true)}
                onCloseCashRegister={() => {
                  if (activeOrders.length > 0) {
                    error(
                      `Impossível fechar caixa: Existem ${activeOrders.length} pedidos em aberto.`,
                    );
                    return;
                  }
                  setShowCloseCashModal(true);
                }}
              />
            )
          }
        />

        {/* Quick Product Modal */}
        {showQuickProductModal && (
          <Suspense
            fallback={
              <div style={{ padding: 16, textAlign: "center" }}>
                Carregando...
              </div>
            }
          >
            <QuickProductModal
              onClose={() => setShowQuickProductModal(false)}
              onCreate={handleCreateQuickProduct}
            />
          </Suspense>
        )}

        {/* Modifier Selector Modal */}
        {modifierModalItem && (
          <ModifierSelectorModal
            productName={modifierModalItem.name}
            groups={catalogModifierGroups.filter((g) =>
              modifierModalItem.modifierGroupIds.includes(g.id),
            )}
            modifiers={catalogModifiers.filter((m) =>
              modifierModalItem.modifierGroupIds.includes(m.groupId),
            )}
            onConfirm={(selected) => {
              const item = modifierModalItem;
              setModifierModalItem(null);
              handleAddItem(
                {
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  category: item.category,
                  modifierGroupIds: item.modifierGroupIds,
                },
                item.groupId,
                selected,
              );
            }}
            onCancel={() => setModifierModalItem(null)}
          />
        )}

        {/* Gap #8: Receipt Share Modal — shown after successful payment */}
        {receiptShareOrder && (
          <ReceiptShareModal
            order={receiptShareOrder}
            onClose={() => setReceiptShareOrder(null)}
          />
        )}

        {/* Gap #10: Table Actions Modal — Transfer / Merge / Split */}
        {tableActionsTargetId &&
          (() => {
            const sourceTable = tables.find(
              (t) => t.id === tableActionsTargetId,
            );
            if (!sourceTable) return null;
            return (
              <TableActionsModal
                sourceTable={sourceTable}
                tables={tables}
                orders={orders}
                onComplete={() => getActiveOrders()}
                onClose={() => setTableActionsTargetId(null)}
              />
            );
          })()}

        {/* Group Selector Modal */}
        {showGroupSelector && pendingItem && activeOrderId && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <Card padding="lg" style={{ maxWidth: 500, width: "90%" }}>
              <Text
                size="lg"
                weight="bold"
                color="primary"
                style={{ marginBottom: spacing[4] }}
              >
                Adicionar {pendingItem.name} a qual grupo?
              </Text>

              <GroupSelector
                groups={groups}
                selectedGroupId={selectedGroupId}
                onSelect={(groupId) => {
                  setSelectedGroupId(groupId);
                  handleAddItem(pendingItem, groupId);
                  setShowGroupSelector(false);
                  setPendingItem(null);
                }}
                onCreateNew={() => {
                  setShowGroupSelector(false);
                  setShowCreateGroupModal(true);
                }}
              />

              <div
                style={{
                  marginTop: spacing[4],
                  display: "flex",
                  gap: spacing[2],
                }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setShowGroupSelector(false);
                    setPendingItem(null);
                  }}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModalOrderId &&
        (() => {
          const order = activeOrders.find((o) => o.id === paymentModalOrderId);
          if (!order) return null;
          return (
            <Suspense
              fallback={
                <div style={{ padding: 16, textAlign: "center" }}>
                  Carregando modal de pagamento...
                </div>
              }
            >
              <PaymentModal
                orderId={order.id}
                restaurantId={restaurantId || ""}
                orderTotal={order.total}
                onPay={handlePayment}
                onCancel={() => setPaymentModalOrderId(null)}
                isDemoMode={isDemoData}
              />
            </Suspense>
          );
        })()}

      {/* Split Bill Modal */}
      {splitBillModalOrderId &&
        (() => {
          const order = activeOrders.find(
            (o) => o.id === splitBillModalOrderId,
          );
          if (!order) return null;
          return (
            <Suspense
              fallback={
                <div style={{ padding: 16, textAlign: "center" }}>
                  Carregando modal de divisão...
                </div>
              }
            >
              <SplitBillModalWrapper
                orderId={order.id}
                restaurantId={restaurantId || ""}
                orderTotal={order.total}
                onPayPartial={handlePartialPayment}
                onCancel={() => setSplitBillModalOrderId(null)}
                loading={ordersLoading}
              />
            </Suspense>
          );
        })()}

      {/* Open Cash Register Modal */}
      {showOpenCashModal && (
        <Suspense
          fallback={
            <div style={{ padding: 16, textAlign: "center" }}>
              Carregando modal de abertura...
            </div>
          }
        >
          <OpenCashRegisterModal
            onOpen={async (openingBalanceCents) => {
              try {
                await openCashRegister(openingBalanceCents);
                setShowOpenCashModal(false);
                setCashRegisterOpen(true);
                success("Caixa aberto com sucesso");
                // Lei do Turno: notificar fonte única para Dashboard/KDS não mostrarem "turno fechado"
                await shift?.refreshShiftStatus?.();

                // Recarregar dados
                const totalCents = await getDailyTotal();
                setDailyTotalCents(totalCents);
                setDailyTotal(formatAmount(totalCents));
              } catch (err: any) {
                const msg = err.message || "Erro ao abrir caixa";
                const fc = err.failureClass;
                if (fc === "degradation") {
                  error("Problema de rede. Tente novamente em instantes.");
                } else if (fc === "acceptable") {
                  error(msg + " Pode tentar novamente.");
                } else {
                  error(msg);
                }
              }
            }}
            onCancel={() => setShowOpenCashModal(false)}
          />
        </Suspense>
      )}

      {/* Close Cash Register Modal */}
      {showCloseCashModal && (
        <Suspense
          fallback={
            <div style={{ padding: 16, textAlign: "center" }}>
              Carregando modal de fechamento...
            </div>
          }
        >
          <CloseCashRegisterModal
            dailyTotalCents={dailyTotalCents}
            openingBalanceCents={openingBalanceCents}
            restaurantId={restaurantId}
            operatorName="GOLDMONKEY" // TODO: Get from auth context
            terminalId="CAIXA-01" // TODO: Get from device settings
            onClose={async (closingBalanceCents) => {
              try {
                await closeCashRegister(closingBalanceCents);
                // setShowCloseCashModal(false); // CHANGED: Don't close immediately, let modal show success state
                setCashRegisterOpen(false);
                success("Caixa fechado com sucesso");

                // Recarregar dados
                const totalCents = await getDailyTotal();
                setDailyTotalCents(totalCents);
                setDailyTotal(formatAmount(totalCents));
              } catch (err: any) {
                const msg = err.message || "Erro ao fechar caixa";
                const fc = err.failureClass;
                if (fc === "degradation") {
                  error("Problema de rede. Tente novamente em instantes.");
                } else if (fc === "acceptable") {
                  error(msg + " Pode tentar novamente.");
                } else {
                  error(msg);
                }
              }
            }}
            onCancel={() => setShowCloseCashModal(false)}
            onDismiss={() => setShowCloseCashModal(false)}
          />
        </Suspense>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && activeOrderId && (
        <Suspense
          fallback={
            <div style={{ padding: 16, textAlign: "center" }}>
              Carregando modal de grupo...
            </div>
          }
        >
          <CreateGroupModal
            onClose={() => setShowCreateGroupModal(false)}
            onCreate={async (label, color) => {
              await createGroup({
                order_id: activeOrderId,
                label,
                color,
              });
              // Auto-select new group (will be selected in useEffect)
              await fetchGroups();
              setShowCreateGroupModal(false);
              // Re-open group selector if there was a pending item
              if (pendingItem) {
                setShowGroupSelector(true);
              }
            }}
          />
        </Suspense>
      )}
    </AppShell>
  );
};

// Wrap in TableProvider and OrderProvider
// TPV wrapper
// DOCKER CORE: Providers agora são adicionados diretamente aqui, já que App.tsx não usa AppDomainWrapper
const TPV = () => {
  const readiness = useOperationalReadiness("TPV");
  const { toasts, dismiss } = useToast();

  // Staff-style browser tab title for isolated tool context
  useEffect(() => {
    document.title = "ChefIApp POS — TPV";
    return () => {
      document.title = "ChefIApp POS";
    };
  }, []);

  // DOCKER CORE: Restaurant ID fixo para desenvolvimento
  // Em produção, isso viria de autenticação ou seleção
  const { restaurantId: urlRestaurantId } = useParams();
  const restaurantId =
    urlRestaurantId ||
    getTabIsolated("chefiapp_restaurant_id") ||
    "00000000-0000-0000-0000-000000000100";

  if (readiness.loading) {
    return (
      <GlobalLoadingView
        message="Verificando estado operacional..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }
  if (!readiness.ready && readiness.uiDirective === "SHOW_BLOCKING_SCREEN") {
    return (
      <BlockingScreen
        reason={readiness.blockingReason}
        redirectTo={readiness.redirectTo}
      />
    );
  }
  if (
    !readiness.ready &&
    readiness.uiDirective === "REDIRECT" &&
    readiness.redirectTo
  ) {
    return <Navigate to={readiness.redirectTo} replace />;
  }

  return (
    <ContextEngineProvider userRole="waiter" hasTPV={true}>
      <OfflineOrderProvider>
        <OrderProvider restaurantId={restaurantId}>
          <TableProvider restaurantId={restaurantId}>
            <LoyaltyProvider>
              <DebugErrorBoundary>
                <TPVContent />
              </DebugErrorBoundary>
              {/* FASE 5: Toast Container para feedback visual */}

              <ToastContainer toasts={toasts} onDismiss={dismiss} />
            </LoyaltyProvider>
          </TableProvider>
        </OrderProvider>
      </OfflineOrderProvider>
    </ContextEngineProvider>
  );
};

export default TPV;
