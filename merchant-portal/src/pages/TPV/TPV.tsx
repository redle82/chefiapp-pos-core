import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { getErrorMessage, getErrorSuggestion } from '../../core/errors/ErrorMessages';
import { getTableHealth } from '../../core/domain/TableHealthUtils';
import { getTabIsolated, setTabIsolated, removeTabIsolated } from '../../core/storage/TabIsolatedStorage';
import { LoyaltyProvider } from '../../core/loyalty/LoyaltyContext';
import { AppShell } from '../../ui/design-system/AppShell';
import { useOrders } from './context/OrderContextReal';

import { SyncStatusIndicator } from '../../components/SyncStatusIndicator';

import { useCoreHealth } from '../../core/health/useCoreHealth';
import { useRestaurantIdentity } from '../../core/identity/useRestaurantIdentity'; // Visual Polish

import { OfflineBanner } from '../../components/OfflineBanner';
import { DeliveryNotificationManager } from './components/DeliveryNotificationManager';
import { FiscalConfigAlert } from './components/FiscalConfigAlert';
import { CashRegisterAlert } from './components/CashRegisterAlert';



/* UDS Implementation (Sealed) */
import { TPVLayoutSplit } from '../../ui/design-system/layouts/TPVLayoutSplit';
import { TPVNavigation } from './components/TPVNavigation';
import { TPVHeader } from '../../ui/design-system/domain/TPVHeader';
import { CommandPanel } from '../../ui/design-system/domain/CommandPanel';
import { StreamTunnel } from '../../ui/design-system/domain/StreamTunnel';
import { QuickMenuPanel } from '../../ui/design-system/domain/QuickMenuPanel';
import { TableMapPanel } from '../../ui/design-system/domain/TableMapPanel';
import { useToast, ToastContainer } from '../../ui/design-system';
import { Button } from '../../ui/design-system/Button';
import { Card } from '../../ui/design-system/Card';
import { spacing } from '../../ui/design-system/tokens/spacing';
import { colors } from '../../ui/design-system/tokens/colors';
import { Text } from '../../ui/design-system/primitives/Text';
import { useTables } from './context/TableContext';
// FASE 5: Lazy loading de componentes pesados (modais e componentes não sempre visíveis)
const PaymentModal = lazy(() => import('./components/PaymentModal').then(m => ({ default: m.PaymentModal })));
const SplitBillModalWrapper = lazy(() => import('./components/SplitBillModalWrapper').then(m => ({ default: m.SplitBillModalWrapper })));
const OpenCashRegisterModal = lazy(() => import('./components/OpenCashRegisterModal').then(m => ({ default: m.OpenCashRegisterModal })));
const CloseCashRegisterModal = lazy(() => import('./components/CloseCashRegisterModal').then(m => ({ default: m.CloseCashRegisterModal })));
const OrderItemEditor = lazy(() => import('./components/OrderItemEditor').then(m => ({ default: m.OrderItemEditor })));
import { OrderSummaryPanel } from './components/OrderSummaryPanel';
import { OrderHeader } from './components/OrderHeader';
import { IncomingRequests } from './components/IncomingRequests';
import { GroupSelector } from './components/GroupSelector';
const CreateGroupModal = lazy(() => import('./components/CreateGroupModal').then(m => ({ default: m.CreateGroupModal })));
import { useConsumptionGroups } from './hooks/useConsumptionGroups';

import { useCommonTPVShortcuts } from './hooks/useTPVShortcuts';
import { TPVInstallPrompt } from './components/TPVInstallPrompt'; // Added Install Prompt
import { useCurrency } from '../../core/currency/useCurrency'; // P5-5


const QuickProductModal = lazy(() => import('./components/QuickProductModal'));

import { useTPVVoiceControl } from './hooks/useTPVVoiceControl';
const ReservationBoard = lazy(() => import('./reservations/ReservationBoard'));
import { TPVLockScreen, type Operator } from './components/TPVLockScreen';
import { useOperationalCortex } from '../../intelligence/nervous-system/OperationalCortex';
import { InsightTicker } from './components/InsightTicker';
const TPVSettingsModal = lazy(() => import('./components/TPVSettingsModal'));

import { useDynamicMenu } from '../../core/menu/DynamicMenu/hooks/useDynamicMenu';
import { TPVWarMap } from './components/TPVWarMap';
import { TPVExceptionPanel } from './components/TPVExceptionPanel';
import { useContextEngine } from '../../core/context';
import { OperationalModeIndicator } from './components/OperationalModeIndicator';

type ContextView = 'menu' | 'tables' | 'orders' | 'reservations' | 'delivery' | 'warmap';

const TPVContent = () => {
  // FASE 5: Toast para feedback visual (toasts e dismiss serão passados do wrapper)
  const { success, error } = useToast();
  
  // RITUAL: Operator Gate State
  // HOOKS REFACTORING COMPLETE - Lock screen now active in all modes
  const [isLocked, setIsLocked] = useState(true);
  const [activeOperator, setActiveOperator] = useState<Operator | null>(null);
  const [activeMode, setActiveMode] = useState<'command' | 'rush' | 'training' | null>(null);

  // FIX: Reactive Restaurant ID Resolution
  const [restaurantId, setRestaurantId] = useState<string | null>(getTabIsolated('chefiapp_restaurant_id'));

  // FASE 2: Detectar modo demo da URL
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true' || location.state?.demo === true;
  
  // Salvar modo demo no localStorage para persistir
  useEffect(() => {
    if (isDemoMode) {
      setTabIsolated('chefiapp_tpv_demo_mode', 'true');
    } else {
      removeTabIsolated('chefiapp_tpv_demo_mode');
    }
  }, [isDemoMode]);

  // Visual Polish: Get Restaurant Identity
  const { identity } = useRestaurantIdentity();

  useEffect(() => {
    const checkId = () => {
      const current = getTabIsolated('chefiapp_restaurant_id');
      if (current && current !== restaurantId) {
        console.log('[TPV] Resolved Restaurant ID:', current);
        setRestaurantId(current);
      }
    };
    // Immediate check
    checkId();
    // Polling fallback (since localStorage doesn't emit events)
    const interval = setInterval(checkId, 500);
    return () => clearInterval(interval);
  }, [restaurantId]);

  // State declarations (moved from inside handleSelectTable - React hooks must be at top level)
  const [dailyTotalCents, setDailyTotalCents] = useState<number>(0);
  const [cashRegisterOpen, setCashRegisterOpen] = useState<boolean>(false);
  const [paymentModalOrderId, setPaymentModalOrderId] = useState<string | null>(null);
  const [splitBillModalOrderId, setSplitBillModalOrderId] = useState<string | null>(null);
  const [showOpenCashModal, setShowOpenCashModal] = useState<boolean>(false);
  const [showCloseCashModal, setShowCloseCashModal] = useState<boolean>(false);
  const [openingBalanceCents, setOpeningBalanceCents] = useState<number>(0);
  // Group selector state (for split bill functionality)
  const [showGroupSelector, setShowGroupSelector] = useState<boolean>(false);
  const [pendingItem, setPendingItem] = useState<{ id: string; name: string; price: number; category: string } | null>(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState<boolean>(false);
  const [showQuickProductModal, setShowQuickProductModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const { orders, createOrder, performOrderAction, addItemToOrder, removeItemFromOrder, updateItemQuantity, getDailyTotal, getOpenCashRegister, openCashRegister, closeCashRegister, getActiveOrders, loading: ordersLoading } = useOrders();



  // P4-6 FIX: Use Dynamic Menu (Intelligence + Sponsorships)
  const { menu, loading: menuLoading } = useDynamicMenu({
    restaurantId: restaurantId || '',
    mode: 'tpv',
    autoRefresh: true
  });

  // Adapter: Convert DynamicMenuResponse to flat MenuItem[] for QuickMenuPanel
  const menuItems = useMemo(() => {
    if (!menu) return [];

    const items: any[] = [];

    // 1. Contextual Items (High priority)
    if (menu.contextual && menu.contextual.length > 0) {
      console.log('[TPV] Raw Contextual Item 0:', JSON.stringify(menu.contextual[0], null, 2));
      menu.contextual.forEach(item => {
        items.push({
          id: item.id,
          name: item.name, // Keep existing naming
          price: (item.price_cents || 0) / 100, // Safety check
          category: '✨ Sugestões Inteligentes',
          trackStock: true, // Assuming default true for now or map from item
          stockQuantity: 100, // Mock infinite for now or map
          // Add extra metadata if needed by updated components
        });
      });
    }

    // 2. Full Catalog
    menu.fullCatalog.forEach(cat => {
      cat.products.forEach((item, index) => {
        // DEBUG: Inspect first item of first category
        if (index === 0 && items.length < 5) {
          console.log('[TPV] Raw Catalog Item:', JSON.stringify(item, null, 2));
        }

        const finalPrice = (Number(item.price_cents || 0) / 100);

        items.push({
          id: item.id,
          name: item.name,
          price: isNaN(finalPrice) ? 0 : finalPrice,
          category: cat.name,
          trackStock: true, // Mock
          stockQuantity: 100 // Mock
        });
      });
    });

    return items;
  }, [menu]);
  const { success, error, toasts, dismiss } = useToast();
  const { tables } = useTables();

  // RADAR OPERACIONAL: Calculate Table Health
  // This combines static table data with live order data to predict "emotions"
  const tablesWithHealth = useMemo(() => {
    return tables.map(table => {
      const activeOrder = orders.find(o => o.tableId === table.id && o.status !== 'paid' && o.status !== 'cancelled');

      const lastActivityTime = activeOrder ? new Date(activeOrder.createdAt) : null;
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
        false // No "Call Waiter" signal yet
      );

      // Calculate wait minutes for display
      const now = new Date();
      const waitMinutes = lastActivityTime ? (now.getTime() - lastActivityTime.getTime()) / 60000 : 0;

      return {
        ...table,
        health,
        waitMinutes,
        // Integrate order info for the map to display totals
        orderInfo: activeOrder ? {
          id: activeOrder.id,
          status: activeOrder.status,
          total: activeOrder.total
        } : undefined
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // P1-1 FIX: Determinar se ações devem estar habilitadas
  // Ações offline (criar pedido, adicionar item) sempre permitidas
  // Ações críticas (pagamento) respeitam health status
  // FASE 2: Detectar modo demo da URL
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlDemoMode = searchParams.get('demo') === 'true' || location.state?.demo === true;
  const isDemoModeFromStorage = getTabIsolated('chefiapp_tpv_demo_mode') === 'true';
  const isDemoMode = urlDemoMode || isDemoModeFromStorage;
  
  // Salvar modo demo no localStorage para persistir
  useEffect(() => {
    if (isDemoMode) {
      setTabIsolated('chefiapp_tpv_demo_mode', 'true');
    } else {
      removeTabIsolated('chefiapp_tpv_demo_mode');
    }
  }, [isDemoMode]);
  
  // FASE 2: Detectar se é modo tutorial
  const isTutorialMode = location.state?.tutorial === true || searchParams.get('tutorial') === 'true';

  // Demo mode permite ações mesmo com sistema down (para testes)
  const isDemoData = getTabIsolated('chefiapp_demo_mode') === 'true' || isDemoMode;
  const actionsEnabled = healthStatus === 'UP' || healthStatus === 'DEGRADED' || isDemoData || isOnline;
  const { intention, role } = useContextEngine();

  const [contextView, setContextView] = useState<ContextView>(() => {
    // "One App" Logic: Waiters start at Tables, Others at Menu
    return intention === 'execute' ? 'tables' : 'menu';
  });
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => {
    // HARD RULE 4: Recuperar pedido ativo ao carregar (Tab-Isolated)
    return getTabIsolated('chefiapp_active_order_id');
  });
  const [dailyTotal, setDailyTotal] = useState<string>('€0,00');

  // SEMANA 2 - Tarefa 3.2: Integrar useConsumptionGroups
  const { groups, fetchGroups, createGroup } = useConsumptionGroups(activeOrderId);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const { formatAmount } = useCurrency();
  
  // FASE 5: Toast removido daqui (já declarado acima)

  // FASE 2: Modo Demo - Pré-preencher dados
  useEffect(() => {
    if (isDemoMode && restaurantId && menuItems.length > 0 && tables.length > 0 && !activeOrderId) {
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
              status: 'new',
              items: itemsToAdd.map(item => ({
                id: item.id,
                productId: item.id,
                name: item.name,
                price: Math.round(item.price * 100),
                quantity: 1,
                categoryName: item.category,
              })),
              total: itemsToAdd.reduce((sum, item) => sum + Math.round(item.price * 100), 0),
              tableNumber: firstTable.number,
              tableId: firstTable.id,
            }).then((order) => {
              setActiveOrderId(order.id);
              setTabIsolated('chefiapp_active_order_id', order.id);
              success('Modo Demo: Pedido criado com itens de exemplo');
            }).catch((err) => {
              console.error('[TPV] Error creating demo order:', err);
            });
          }
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isDemoMode, restaurantId, menuItems, tables, activeOrderId, createOrder, success]);

  const handleSelectTable = async (tableId: string) => {
    setSelectedTableId(tableId);

    // UX: Verificar se mesa já tem pedido ativo
    const table = tables.find(t => t.id === tableId);
    if (table) {
      const existingOrder = orders.find(o => o.tableId === tableId && o.status !== 'paid' && o.status !== 'cancelled'); // Use 'orders' instead of 'activeOrders' if undefined
      if (existingOrder) {
        // Abrir pedido existente automaticamente
        setActiveOrderId(existingOrder.id);
        setTabIsolated('chefiapp_active_order_id', existingOrder.id);
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
        await addItemToOrder(activeOrderId, {
          productId: tempId,
          name: name,
          priceCents: Math.round(price * 100),
          quantity: 1,
          categoryName: '⚡ Agile Created',
        });
        success(`Produto "${name}" adicionado!`);
      } else {
        // Create new order with this item
        const newOrder = await createOrder({
          status: 'new',
          items: [{
            id: tempId,
            productId: tempId,
            name: name,
            price: Math.round(price * 100),
            quantity: 1,
            categoryName: '⚡ Agile Created'
          }],
          total: Math.round(price * 100),
          tableId: selectedTableId || undefined,
          tableNumber: selectedTableId ? tables.find(t => t.id === selectedTableId)?.number : undefined,
        });
        setActiveOrderId(newOrder.id);
        success(`Produto "${name}" criado`);
      }
    } catch (err: any) {
      console.error('Quick product failed:', err);
      error('Erro ao adicionar produto rápido');
    }
  };

  // Filter active orders (not delivered/cancelled) - MOVED BEFORE GUARD
  const activeOrders = useMemo(() => {
    // HARD RULE: Pedidos pagos são 'preparing' ou 'ready' (ainda ativos na cozinha/tela)
    // Apenas 'delivered' e 'canceled' saem do túnel
    return orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled');
  }, [orders]);

  // --------------------------------------------------------------------------------
  // BRAIN: VOICE CONTROL (SUB-CHEF EARS) - Must be before isLocked guard to avoid hooks violation
  // --------------------------------------------------------------------------------
  const { isListening, isAvailable, startListening, stopListening } = useTPVVoiceControl({
    tables,
    orders,
    onSelectTable: handleSelectTable,
    onSwitchView: setContextView,
    onCloseCash: () => {
      if (cashRegisterOpen) setShowCloseCashModal(true);
      else error('Caixa já está fechado');
    },
    onOpenPayment: () => {
      if (activeOrderId) setPaymentModalOrderId(activeOrderId);
      else error('Nenhum pedido ativo para pagar');
    }
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
        error('Abra o caixa antes de criar vendas');
        setShowOpenCashModal(true);
      }
    },
    onCloseOrder: () => {
      if (activeOrderId) {
        const order = orders.find(o => o.id === activeOrderId);
        if (order && order.status !== 'paid') {
          setPaymentModalOrderId(activeOrderId);
        }
      }
    },
    onSearchTable: () => {
      setContextView('tables');
    },
    onOpenCash: () => {
      if (role === 'waiter') {
        error('Apenas gerentes podem abrir o caixa principal');
        return;
      }
      if (!cashRegisterOpen) {
        setShowOpenCashModal(true);
      }
    },
    onCloseCash: () => {
      if (role === 'waiter') {
        error('Apenas gerentes podem fechar o caixa');
        return;
      }
      if (cashRegisterOpen) {
        if (activeOrders.length > 0) {
          error(`Impossível fechar caixa: Existem ${activeOrders.length} pedidos em aberto. Finalize ou cancele-os antes.`);
          return;
        }
        setShowCloseCashModal(true);
      }
    },
    onPayment: () => {
      if (activeOrderId) {
        const order = orders.find(o => o.id === activeOrderId);
        if (order && order.status !== 'paid') {
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

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // DEBUG: TPV State - MOVED BEFORE GUARD
  useEffect(() => {
    console.log('[TPV] Render State:', {
      activeOrderId,
      activeOrdersCount: activeOrders.length,
      contextView,
      loading: ordersLoading,
      ordersstate: orders.length,
      menuItemsCount: menuItems.length
    });
  }, [activeOrderId, activeOrders, contextView, ordersLoading, orders, menuItems]);

  // Load daily total and check cash register - MOVED BEFORE GUARD
  useEffect(() => {
    // Only load financial data if allowed
    if (role === 'waiter') return;

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
        console.error('Failed to load data:', err);
      }
    };
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [getDailyTotal, getOpenCashRegister, showOpenCashModal, activeOrders.length]);

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('chefiapp_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('chefiapp_device_id', deviceId);
    }
    return deviceId;
  };

  // --------------------------------------------------------------------------------
  // RITUAL: THE GATEKEEPER
  // --------------------------------------------------------------------------------
  if (isLocked) {
    return (
      <AppShell>
        <TPVLockScreen
          onUnlock={async (op, mode) => {
            // Map UI Mode to DB Mode
            const dbMode = mode === 'command' ? 'tower' : mode;

            // Map UI Role to Permission Role
            // This is a simplification. In real app, we fetch the real user role.
            const permissionRole = op.role === 'manager' ? 'manager' : 'waiter';
            const { DEFAULT_PERMISSIONS } = await import('../../core/context/ContextTypes');
            const permissionsSnapshot = DEFAULT_PERMISSIONS[permissionRole] || {};

            // PENDING: Authenticate as the selected user before RPC? 
            // For now, we are using the current logged in auth session (which should be the owner/manager kiosk account)
            // or the specific user account. 
            // Since this is a POS Kiosk, often one "Device Account" is logged in, and operators just PIN in.
            // But start_turn tracks `user_id`. 
            // If we are in "Kiosk Mode" (TabIsolated restaurant_id), auth.uid might be the Owner.
            // RPC uses `auth.uid()`. 
            // Ideally, we would Sign In the operator here using Auth.signInWithPassword (PIN).
            // But the user prompt says "Registrar: user_id...". 
            // For this iteration, we will call the RPC with the *Current Auth Session*. 
            // We assume the device is logged in.

            try {
              if (!restaurantId) {
                console.error('[TPV] Cannot start turn: Missing Restaurant ID');
                error('Erro crítico: Restaurant ID não identificado.');
                return;
              }

              const snapshot = permissionsSnapshot; // Alias for debug
              console.log('[TPV] invoking start_turn RPC with:', {
                // Sensitive: restaurantId,
                mode: dbMode,
                role: op.role,
                perms: snapshot
              });

              const { supabase } = await import('../../core/supabase');

              // P1-1 FIX: Validar sessão antes da chamada RPC
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) {
                // Se estiver em modo demo, simular sucesso
                if (isDemoData) {
                  console.log('[TPV] Demo Mode: Simulating start_turn success');
                  setActiveOperator(op);
                  setIsLocked(false);
                  success(`Comando Assumido (Demo): ${op.name}`);
                  return;
                }
                throw new Error('SESSION_EXPIRED');
              }

              const { data, error: rpcError } = await supabase.rpc('start_turn', {
                p_restaurant_id: restaurantId,
                p_operational_mode: dbMode,
                p_device_id: getDeviceId(),
                p_device_name: 'TPV Browser', // Could be user agent
                p_role_at_turn: op.role,
                p_permissions_snapshot: snapshot
              });

              if (rpcError) throw rpcError;

              if (data && data.success === false) {
                throw new Error(data.error);
              }

              // Success
              setActiveOperator(op);
              setActiveMode(mode);
              setIsLocked(false);

              if (data?.session_id) {
                localStorage.setItem('chefiapp_turn_session_id', data.session_id);
              }

              success(`Comando Assumido: ${op.name}`);

            } catch (err: any) {
              console.error('Start Turn Failed:', err);
              const msg = err.message === 'TOWER_MODE_FORBIDDEN'
                ? 'Acesso Negado: Apenas Gerentes podem acessar a Torre de Controle.'
                : 'Erro ao iniciar turno. Verifique conexão.';
              error(msg);
            }
          }}
        />
      </AppShell>
    );
  }
  // --------------------------------------------------------------------------------
  // END GUARD
  // --------------------------------------------------------------------------------

  console.log('[TPV] BODY RENDER. menuItems:', menuItems?.length);
  if (menuItems?.length > 0) {
    const debugPrices = menuItems.map(i => `${i.name}: ${i.price} (${typeof i.price})`).join(', ');
    console.log('[TPV] All Menu Items Prices:', debugPrices);
  }

  // SANITIZATION LAYER: Ensure no bad data reaches UI
  const safeMenuItems = (menuItems || []).map(item => ({
    ...item,
    price: typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0
  }));

  // Handlers
  const handleAction = async (orderId: string, action: string) => {
    // P1-1 FIX: Bloquear ações críticas se sistema down (exceto demo)
    const criticalActions = ['pay', 'prepare', 'ready', 'cancel'];
    if (criticalActions.includes(action) && !actionsEnabled && !isDemoData) {
      error('Sistema indisponível. Ação bloqueada. Tente em breve.');
      return;
    }

    // P1-4 FIX: Truth-First - Não atualizar UI antes do Core confirmar
    // A UI mostrará status da queue (pending/syncing/applied) via StreamTunnel
    // Não fazemos optimistic updates aqui - aguardamos confirmação do Core

    try {
      // HARD RULE 2: 'pay' abre modal de pagamento
      if (action === 'pay') {
        setPaymentModalOrderId(orderId);
        return;
      }

      // Context Guard: Cancel requires manager (unless configured otherwise)
      if (action === 'cancel' && role === 'waiter') {
        // For now, simpler error. Future: Manager Override Modal
        error('Cancelamento requer autorização de gerente');
        return;
      }

      // P1-4 FIX: Executar ação e aguardar confirmação antes de atualizar UI
      await performOrderAction(orderId, action);

      // P1-4 FIX: Aguardar refresh completo antes de mostrar sucesso
      // Isso garante que a UI mostra apenas o que o Core confirmou
      console.log('[TPV] Syncing orders after action...');
      await getActiveOrders();

      // Apenas após getActiveOrders() completar, a UI será atualizada
      // O StreamTunnel mostrará o status correto baseado nos dados do Core
    } catch (err: any) {
      console.error('Failed to perform action:', err);

      const errorMsg = getErrorMessage(err, {
        code: err.code,
        message: err.message,
        orderId: orderId
      });

      error(errorMsg);

      // P1-4 FIX: Em caso de erro, refresh para garantir UI sincronizada
      await getActiveOrders();
    }
  };

  // FASE 2: Detectar se é modo tutorial
  const isTutorialMode = location.state?.tutorial === true || searchParams.get('tutorial') === 'true';

  // Handler de pagamento (chamado pelo modal)
  const handlePayment = async (method: string, intentId?: string) => {
    if (!paymentModalOrderId) return;

    // FASE 2: Modo Demo - Simular pagamento fake
    if (isDemoMode) {
      // Simular sucesso de pagamento
      success('🎉 Pagamento processado com sucesso! (Modo Demo)');
      
      // Fechar modal
      setPaymentModalOrderId(null);
      
      // Se for tutorial, redirecionar para dashboard após 2 segundos
      if (isTutorialMode) {
        setTimeout(() => {
          success('Parabéns! Você completou sua primeira venda. Agora você pode usar o TPV normalmente.');
          setTimeout(() => {
            navigate('/app/dashboard', { 
              state: { firstSaleCompleted: true }
            });
          }, 2000);
        }, 2000);
      }
      
      return;
    }

    // P1-1 FIX: Bloquear pagamento se sistema down e não for demo
    if (!actionsEnabled && !isDemoData) {
      error('Sistema indisponível. Pagamentos bloqueados por segurança. Tente em breve.');
      return;
    }

    // SEMANA 1 - Tarefa 1.3: Validação de saldo antes de fechar conta
    const order = activeOrders.find(o => o.id === paymentModalOrderId);
    if (!order) {
      error('Pedido não encontrado');
      return;
    }

    // Validar que pedido tem itens
    if (!order.items || order.items.length === 0) {
      error('Não é possível fechar conta sem itens. Adicione itens ao pedido primeiro.');
      return;
    }

    // INV-006: UI uses Domain's total, never calculates independently
    const totalCents = order.total;
    if (totalCents <= 0) {
      error('Não é possível fechar conta com total zero. Adicione itens ao pedido primeiro.');
      return;
    }

    // Validar que pedido não está totalmente pago
    if (order.status === 'paid') {
      error('Este pedido já foi totalmente pago.');
      return;
    }

    // SEMANA 2: Se está parcialmente pago (partially_paid), permitir continuar pagamento (split bill)
    // Não bloquear aqui, apenas validar no backend

    // SEMANA 2: Aqui adicionaremos validação de saldo parcial (split bill)
    // Por enquanto, assumimos que se chegou aqui, o saldo está completo

    try {
      // Para pagamentos Stripe (card), passar intentId no metadata
      const payload: any = { method };
      if (method === 'card' && intentId) {
        payload.stripe_intent_id = intentId;
      }

      await performOrderAction(paymentModalOrderId, 'pay', payload);

      // SPRINT 1 - Tarefa 1.1: Emissão Fiscal no Backend
      // SPRINT 1 - Tarefa 1.4: Emitir fiscal apenas quando totalmente pago
      // Aguardar atualização do pedido para verificar status
      await getActiveOrders();

      // Verificar se pedido está totalmente pago antes de emitir fiscal
      const updatedOrder = activeOrders.find(o => o.id === paymentModalOrderId);
      if (updatedOrder && restaurantId) {
        // Buscar pagamentos para calcular total pago
        try {
          const { PaymentEngine } = await import('../../core/tpv/PaymentEngine');
          const payments = await PaymentEngine.getPaymentsByOrder(paymentModalOrderId);
          const totalPaid = payments
            .filter(p => p.status === 'PAID')
            .reduce((sum, p) => sum + p.amountCents, 0);

          const orderTotal = updatedOrder.total;

          // SPRINT 1 - Tarefa 1.4: Só emitir fiscal se totalmente pago
          if (totalPaid >= orderTotal && updatedOrder.status === 'paid') {
            // Chamar endpoint do backend para adicionar à fila fiscal
            try {
              const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4320';
              const sessionToken = localStorage.getItem('chefiapp_session_token') ||
                getTabIsolated('chefiapp_session_token');

              const response = await fetch(`${apiUrl}/api/fiscal/emit`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-chefiapp-token': sessionToken || '',
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
                if (errorData.error === 'ORDER_NOT_FULLY_PAID') {
                  // Pedido não está totalmente pago ainda (split bill em progresso)
                  console.log('[TPV] Fiscal not emitted - order not fully paid yet');
                } else {
                  console.warn('[TPV] Fiscal emission failed (non-blocking):', errorData);
                }
              } else {
                const result = await response.json();
                console.log('[TPV] Fiscal emission queued:', result.queue_id);
              }
            } catch (fiscalError) {
              // Log mas não bloqueia pagamento
              console.warn('[TPV] Fiscal emission request failed (non-blocking):', fiscalError);
            }
          } else {
            // Pedido parcialmente pago - não emitir fiscal ainda
            console.log('[TPV] Fiscal not emitted - order partially paid', {
              totalPaid,
              orderTotal,
              status: updatedOrder.status,
            });
          }
        } catch (fiscalError) {
          // Log mas não bloqueia pagamento
          console.warn('[TPV] Fiscal emission check failed (non-blocking):', fiscalError);
        }
      }

      setPaymentModalOrderId(null);

      // Limpar pedido ativo após pagamento
      if (activeOrderId === paymentModalOrderId) {
        setActiveOrderId(null);
        removeTabIsolated('chefiapp_active_order_id');
      }

      success('Pedido pago com sucesso');
    } catch (err: any) {
      console.error('Payment failed:', err);

      const errorMsg = getErrorMessage(err, {
        code: err.code,
        message: err.message,
        orderId: paymentModalOrderId
      });

      error(errorMsg);
      // Não relançar erro - PaymentModal já trata visualmente via setResult('error')
    }
  };

  // SEMANA 2 - Tarefa 3.3: Handler de pagamento parcial (split bill)
  const handlePartialPayment = async (amountCents: number, method: 'cash' | 'card' | 'pix') => {
    if (!splitBillModalOrderId) return;

    // P1-1 FIX: Bloquear pagamento se sistema down e não for demo
    if (!actionsEnabled && !isDemoData) {
      error('Sistema indisponível. Pagamentos bloqueados por segurança. Tente em breve.');
      return;
    }

    const order = activeOrders.find(o => o.id === splitBillModalOrderId);
    if (!order) {
      error('Pedido não encontrado');
      return;
    }

    // Validar que amount não é maior que o total restante
    // (vamos buscar pagamentos para calcular quanto já foi pago)
    try {
      const { PaymentEngine } = await import('../../core/tpv/PaymentEngine');
      const payments = await PaymentEngine.getPaymentsByOrder(splitBillModalOrderId);
      const paidAmount = payments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + p.amountCents, 0);

      const remainingAmount = order.total - paidAmount;

      if (amountCents > remainingAmount) {
        error(`Valor excede o saldo restante de ${formatAmount(remainingAmount)}`);
        return;
      }

      // Processar pagamento parcial usando performOrderAction
      // Passar amount no payload para o backend processar como parcial
      await performOrderAction(splitBillModalOrderId, 'pay', {
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
          removeTabIsolated('chefiapp_active_order_id');
        }
      }
    } catch (err: any) {
      console.error('Partial payment failed:', err);
      error(err.message || 'Erro ao processar pagamento parcial');
    }
  };

  const handleCreateOrder = async () => {
    // HARD-BLOCK 1: Verificar caixa antes de qualquer ação (UI)
    if (!cashRegisterOpen) {
      error('Abra o caixa antes de criar vendas');
      setShowOpenCashModal(true);
      return;
    }

    // HARD-BLOCK 2: Verificar caixa no backend também (double-check)
    try {
      const register = await getOpenCashRegister();
      if (!register) {
        error('Caixa não está aberto. Abra o caixa antes de criar vendas.');
        setCashRegisterOpen(false);
        setShowOpenCashModal(true);
        return;
      }
    } catch (_err) {
      error('Erro ao verificar caixa. Abra o caixa antes de criar vendas.');
      setShowOpenCashModal(true);
      return;
    }

    // NOTA: handleCreateOrder não deve criar pedido vazio
    // O fluxo correto é: adicionar item do menu → cria pedido automaticamente
    // Este handler só existe para casos especiais (ex: pedido sem mesa)
    // Por enquanto, redireciona para o menu
    setContextView('menu');
    error('Adicione itens do menu para criar um pedido');
  };

  // Handler for creating order from table map
  const handleCreateOrderViaMap = async (tableId: string) => {
    // Check if table already has an order
    const existingOrder = orders.find(o => o.tableId === tableId && o.status !== 'paid' && o.status !== 'cancelled');
    if (existingOrder) {
      setActiveOrderId(existingOrder.id);
      setContextView('menu');
      return;
    }

    // Check cash register
    if (!cashRegisterOpen) {
      error('Abra o caixa antes de criar vendas');
      setShowOpenCashModal(true);
      return;
    }

    // Create new order for this table
    try {
      const table = tables.find(t => t.id === tableId);
      const tableNumber = table?.number || 0;
      const newOrder = await createOrder({ items: [], tableNumber });
      if (newOrder?.id) {
        setActiveOrderId(newOrder.id);
        setSelectedTableId(tableId);
        setContextView('menu');
        success(`Pedido criado para mesa ${tableNumber}`);
      }
    } catch (err: any) {
      error(err.message || 'Erro ao criar pedido');
    }
  };

  const handleAddItem = async (item: { id: string; name: string; price: number; category: string }, groupId?: string | null) => {
    console.log('[TPV] handleAddItem called for:', item.name, item.id, 'group:', groupId);
    try {
      // Find or create active order
      let currentOrderId = activeOrderId;

      if (!currentOrderId) {
        // HARD RULE: Criar pedido apenas quando adicionar primeiro item
        // (não criar pedido vazio)
        const newOrder = await createOrder({
          status: 'new',
          items: [{

            id: item.id,
            productId: item.id,
            name: item.name,
            price: Math.round(item.price * 100), // em centavos
            quantity: 1,
            categoryName: item.category, // Added for Mission 55
            consumptionGroupId: groupId || undefined, // Divisão de conta
          }],
          total: Math.round(item.price * 100),
          tableNumber: selectedTableId ? tables.find(t => t.id === selectedTableId)?.number : undefined,
          tableId: selectedTableId || undefined,
        });
        currentOrderId = newOrder.id;
        setActiveOrderId(currentOrderId);
        // Refresh groups after order creation (trigger cria grupo padrão)
        setTimeout(() => fetchGroups(), 500);
        success(`${item.name} adicionado`);
        return;
      }

      // Add item to existing order
      await addItemToOrder(currentOrderId, {
        productId: item.id,
        name: item.name,
        priceCents: Math.round(item.price * 100), // Convert to cents
        quantity: 1,
        categoryName: item.category, // Added for Mission 55
        consumptionGroupId: groupId || undefined, // Divisão de conta
      });

      success(`${item.name
        } adicionado`);
    } catch (err: any) {
      console.error('Failed to add item:', err);

      const errorMsg = getErrorMessage(err, {
        code: err.code,
        message: err.message,
        tableId: selectedTableId || undefined,
        tableNumber: selectedTableId ? tables.find(t => t.id === selectedTableId)?.number : undefined,
        itemName: item.name
      });

      error(errorMsg);

      const suggestion = getErrorSuggestion(err, {
        code: err.code,
        tableId: selectedTableId || undefined
      });
      if (suggestion) {
        setTimeout(() => {
          error(suggestion);
        }, 2000);
      }

      // Auto-handle TABLE_HAS_ACTIVE_ORDER: open existing order
      if (err.code === 'TABLE_HAS_ACTIVE_ORDER' || err.message?.includes('TABLE_HAS_ACTIVE_ORDER')) {
        const existingOrder = activeOrders.find(o => o.tableId === selectedTableId);
        if (existingOrder) {
          setActiveOrderId(existingOrder.id);
          setTabIsolated('chefiapp_active_order_id', existingOrder.id);
        }
      }
    }
  };



  return (
    <AppShell operationalMode={true}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* FASE 2: Banner Modo Demo */}
        {isDemoMode && (
          <div style={{
            background: 'linear-gradient(135deg, #32d74b 0%, #28c83e 100%)',
            color: '#000',
            padding: '12px 24px',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(50, 215, 75, 0.3)',
            zIndex: 1000,
          }}>
            🎯 MODO DEMO - Este é um pedido de exemplo. Nenhum pagamento real será processado.
          </div>
        )}

        {/* BRAIN: Operational Ticker (The Sub-Chef's Voice) */}
        {activeMode !== 'rush' && <InsightTicker insight={topInsight} />}

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
          <Suspense fallback={<div style={{ padding: 16, textAlign: 'center' }}>Carregando...</div>}>
            <TPVSettingsModal
              operatorName={activeOperator?.name}
              onClose={() => setShowSettingsModal(false)}
              onAdvancedSettings={() => {
                // Navigate to /app/settings
                window.location.href = '/app/settings';
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
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <TPVNavigation
                currentView={contextView}
                onChangeView={(view) => setContextView(view)}
                onSettings={() => setShowSettingsModal(true)}
                cashStatus={cashRegisterOpen ? 'open' : 'closed'}
              />
              <div style={{ padding: spacing[2], marginTop: 'auto' }}>
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
                    id: 'current-session',
                    restaurant_id: restaurantId || '',
                    user_id: activeOperator.id,
                    device_id: getDeviceId(),
                    started_at: new Date().toISOString(),
                    status: 'active',
                    operational_mode: activeMode === 'command' ? 'tower' : activeMode,
                    role_at_turn: activeOperator.role,
                    permissions_snapshot: {
                      canViewFinancials: true,
                      canModifyMenu: true,
                      canmanageStaff: true,
                      canVoidOrders: true,
                      canCloseRegister: true
                    }
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
                    operatorId={activeOperator.id || 'op-1'}
                    operatorName={activeOperator.name || 'Chef'}
                  />
                </div>
              )}

              {/* FASE 2: Banner Modo Demo */}
              {isDemoMode && (
                <div style={{
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, rgba(50, 215, 75, 0.2), rgba(50, 215, 75, 0.1))',
                  border: '2px solid rgba(50, 215, 75, 0.5)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>🎯</span>
                    <div>
                      <Text size="sm" weight="bold" style={{ color: '#32d74b', marginBottom: '2px' }}>
                        Modo Demo Ativo
                      </Text>
                      <Text size="xs" color="secondary">
                        Você está testando o TPV. Nenhum pagamento real será processado.
                      </Text>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      removeTabIsolated('chefiapp_tpv_demo_mode');
                      window.location.href = '/app/tpv';
                    }}
                  >
                    Sair do Demo
                  </Button>
                </div>
              )}

              {contextView === 'menu' && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Optional Header inside Workspace given lack of top bar */}
                  <div style={{ marginBottom: spacing[4] }}>
                    <TPVHeader
                      operatorName={activeOperator?.name || 'Chef'}
                      terminalId="TERM-01"
                      isOnline={isOnline}
                      restaurantName={identity?.name || 'ChefIApp'}
                      voiceControl={{
                        isListening,
                        isAvailable,
                        onToggle: isListening ? stopListening : startListening
                      }}
                    />
                  </div>
                  <QuickMenuPanel
                    items={[
                      {
                        id: 'QUICK_ADD_ACTION',
                        name: '+ Novo Produto',
                        price: 0,
                        category: '⚡ Ações',
                        trackStock: false,
                      },
                      ...safeMenuItems.map(item => {
                        // Visual Polish: Inject demo images based on name
                        const lowerName = item.name.toLowerCase();
                        let imageUrl = undefined;

                        if (lowerName.includes('coca') || lowerName.includes('refrigerante')) {
                          imageUrl = '/assets/products/coke.png';
                        } else if (lowerName.includes('burger') || lowerName.includes('hamb')) {
                          imageUrl = '/assets/products/burger.png';
                        } else if (lowerName.includes('frita') || lowerName.includes('batata')) {
                          imageUrl = '/assets/products/fries.png';
                        }

                        return {
                          ...item,
                          imageUrl
                        };
                      })
                    ]}
                    activeOrderItems={
                      activeOrderId
                        ? activeOrders.find(o => o.id === activeOrderId)?.items || []
                        : []
                    }
                    onAddItem={(item) => {
                      // Intercept Quick Add Action
                      if (item.id === 'QUICK_ADD_ACTION') {
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
                  />
                </div>
              )}

              {contextView === 'tables' && (
                <TableMapPanel
                  tables={tablesWithHealth}
                  onSelectTable={(tableId) => {
                    setSelectedTableId(tableId);
                    const order = orders.find(o => o.tableId === tableId && o.status !== 'paid' && o.status !== 'cancelled');
                    if (order) {
                      setActiveOrderId(order.id);
                      setContextView('orders');
                    }
                  }}
                  onCreateOrder={handleCreateOrderViaMap}
                />
              )}

              {contextView === 'orders' && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                  <IncomingRequests
                    restaurantId={restaurantId}
                    onOrderAccepted={() => getActiveOrders()}
                  />
                  <div style={{ flex: 1, position: 'relative' }}>
                    <StreamTunnel
                      orders={activeOrders}
                      onAction={handleAction}
                      activeOrderId={activeOrderId}
                    />
                  </div>
                </div>
              )}

              {contextView === 'reservations' && (
                <div style={{ height: '100%', overflow: 'hidden' }}>
                  <Suspense fallback={<div style={{ padding: 16, textAlign: 'center' }}>Carregando reservas...</div>}>
                    <ReservationBoard restaurantId={restaurantId || ''} />
                  </Suspense>
                </div>
              )}

              {contextView === 'delivery' && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                  <div style={{ padding: spacing[4], borderBottom: `1px solid ${colors.border.subtle}` }}>
                    <Text size="xl" weight="bold" color="primary">🚚 Central de Delivery</Text>
                    <Text size="sm" color="secondary">Gestão de pedidos Uber Eats, Glovo e Web</Text>
                  </div>
                  <IncomingRequests
                    restaurantId={restaurantId}
                    onOrderAccepted={() => getActiveOrders()}
                  />
                  <div style={{ flex: 1, overflow: 'auto', padding: spacing[4] }}>
                    <StreamTunnel
                      orders={activeOrders.filter(o => (o as any).source && (o as any).source !== 'local')}
                      onAction={handleAction}
                      activeOrderId={activeOrderId}
                    />
                  </div>
                </div>
              )}

              {contextView === 'warmap' && (
                <TPVWarMap
                  tables={tablesWithHealth.map(t => ({
                    id: t.id,
                    number: t.number,
                    status: (t.health as any) === 'red' ? 'alert' : t.status as 'free' | 'occupied' | 'reserved' | 'alert',
                  }))}
                  orders={activeOrders.map(o => ({
                    id: o.id,
                    status: o.status,
                    tableNumber: o.tableNumber,
                    isDelayed: o.status === 'new' && o.createdAt && (Date.now() - new Date(o.createdAt).getTime()) > 15 * 60 * 1000, // > 15 min
                    createdAt: o.createdAt ? new Date(o.createdAt) : undefined,
                  }))}
                  kitchenPressure={
                    activeOrders.filter(o => o.status === 'preparing').length > 10 ? 'high' :
                      activeOrders.filter(o => o.status === 'preparing').length > 5 ? 'medium' : 'low'
                  }
                  deliveryQueueCount={activeOrders.filter(o => (o as any).source && (o as any).source !== 'local').length}
                  onSectorClick={(sector) => {
                    if (sector === 'mesas') setContextView('tables');
                    else if (sector === 'cozinha') setContextView('orders');
                    else if (sector === 'delivery') setContextView('delivery');
                    // alertas stays on warmap for now
                  }}
                />
              )}
            </>
          }
          ticket={
            activeOrderId && activeOrders.find(o => o.id === activeOrderId) ? (
              // Mostrar resumo da conta e editor de itens quando há pedido ativo
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: spacing[3], padding: spacing[4] }}>
                {/* Header Fixo da Conta */}
                <OrderHeader
                  tableNumber={activeOrders.find(o => o.id === activeOrderId)?.tableNumber}
                  orderId={activeOrderId || undefined}
                  restaurantId={restaurantId || undefined}
                />

                {/* Editor de Itens (ORDER LIST should be main part of ticket) */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <Suspense fallback={<div style={{ padding: 16, textAlign: 'center' }}>Carregando editor...</div>}>
                    <OrderItemEditor
                      order={activeOrders.find(o => o.id === activeOrderId) || null}
                      onUpdateQuantity={async (itemId, quantity) => {
                        if (!activeOrderId) return;
                        try {
                          await updateItemQuantity(activeOrderId, itemId, quantity);
                          success('Quantidade atualizada');
                        } catch (err: any) {
                          error(err.message || 'Erro ao atualizar quantidade');
                        }
                      }}
                      onRemoveItem={async (itemId) => {
                        if (!activeOrderId) return;
                        try {
                          await removeItemFromOrder(activeOrderId, itemId);
                          success('Item removido');
                        } catch (err: any) {
                          error(err.message || 'Erro ao remover item');
                        }
                      }}
                      onBackToMenu={() => {
                        // On split view, back to menu might just define no active order?
                        // Or maybe we treat "Back" as "Unselect Table"
                        setActiveOrderId(null);
                        removeTabIsolated('chefiapp_active_order_id');
                        // setContextView('menu'); // View stays, context changes
                      }}
                      loading={ordersLoading}
                    />
                  </Suspense>
                </div>

                {/* Resumo da Conta (Sempre Visível no fundo) */}
                <OrderSummaryPanel
                  order={activeOrders.find(o => o.id === activeOrderId) || null}
                  onSplitBill={() => {
                    if (activeOrderId) {
                      setSplitBillModalOrderId(activeOrderId);
                    }
                  }}
                  onPay={() => {
                    const order = activeOrders.find(o => o.id === activeOrderId);
                    // SEMANA 2: Permitir pagar se não está totalmente pago (permite continuar split bill)
                    if (order && order.status !== 'paid') {
                      setPaymentModalOrderId(activeOrderId);
                    }
                  }}
                  loading={ordersLoading}
                />
              </div>
            ) : (
              // EMPTY STATE / GENERIC TICKET
              <CommandPanel
                onCreateOrder={handleCreateOrder}
                onOpenTables={() => setContextView('tables')}
                dailyTotal={dailyTotal}
                cashRegisterOpen={cashRegisterOpen}
                onOpenCashRegister={() => setShowOpenCashModal(true)}
                onCloseCashRegister={() => {
                  if (activeOrders.length > 0) {
                    error(`Impossível fechar caixa: Existem ${activeOrders.length} pedidos em aberto.`);
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
          <Suspense fallback={<div style={{ padding: 16, textAlign: 'center' }}>Carregando...</div>}>
            <QuickProductModal
              onClose={() => setShowQuickProductModal(false)}
              onCreate={handleCreateQuickProduct}
            />
          </Suspense>
        )}

        {/* Group Selector Modal */}
        {showGroupSelector && pendingItem && activeOrderId && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <Card padding="lg" style={{ maxWidth: 500, width: '90%' }}>
              <Text size="lg" weight="bold" color="primary" style={{ marginBottom: spacing[4] }}>
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

              <div style={{ marginTop: spacing[4], display: 'flex', gap: spacing[2] }}>
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
      {
        paymentModalOrderId && (() => {
          const order = activeOrders.find(o => o.id === paymentModalOrderId);
          if (!order) return null;
          return (
            <Suspense fallback={<div style={{ padding: 16, textAlign: 'center' }}>Carregando modal de pagamento...</div>}>
              <PaymentModal
                orderId={order.id}
                restaurantId={restaurantId || ''}
                orderTotal={order.total}
                onPay={handlePayment}
                onCancel={() => setPaymentModalOrderId(null)}
                isDemoMode={isDemoMode}
              />
            </Suspense>
          );
        })()
      }

      {/* Split Bill Modal */}
      {
        splitBillModalOrderId && (() => {
          const order = activeOrders.find(o => o.id === splitBillModalOrderId);
          if (!order) return null;
          return (
            <Suspense fallback={<div style={{ padding: 16, textAlign: 'center' }}>Carregando modal de divisão...</div>}>
              <SplitBillModalWrapper
                orderId={order.id}
                restaurantId={restaurantId || ''}
                orderTotal={order.total}
                onPayPartial={handlePartialPayment}
                onCancel={() => setSplitBillModalOrderId(null)}
                loading={ordersLoading}
              />
            </Suspense>
          );
        })()
      }

      {/* Open Cash Register Modal */}
      {
        showOpenCashModal && (
          <Suspense fallback={<div style={{ padding: 16, textAlign: 'center' }}>Carregando modal de abertura...</div>}>
            <OpenCashRegisterModal
              onOpen={async (openingBalanceCents) => {
                try {
                  await openCashRegister(openingBalanceCents);
                  setShowOpenCashModal(false);
                  setCashRegisterOpen(true);
                  success('Caixa aberto com sucesso');

                  // Recarregar dados
                  const totalCents = await getDailyTotal();
                  setDailyTotalCents(totalCents);
                  setDailyTotal(
                    formatAmount(totalCents)
                  );
                } catch (err: any) {
                  error(err.message || 'Erro ao abrir caixa');
                  // Não relançar - OpenCashRegisterModal já trata visualmente via setError()
                }
              }}
              onCancel={() => setShowOpenCashModal(false)}
            />
          </Suspense>
        )
      }

      {/* Close Cash Register Modal */}
      {
        showCloseCashModal && (
          <Suspense fallback={<div style={{ padding: 16, textAlign: 'center' }}>Carregando modal de fechamento...</div>}>
            <CloseCashRegisterModal
              dailyTotalCents={dailyTotalCents}
              openingBalanceCents={openingBalanceCents}
              restaurantId={restaurantId}
              operatorName="GOLDMONKEY" // TODO: Get from auth context
              terminalId="CAIXA-01"     // TODO: Get from device settings
              onClose={async (closingBalanceCents) => {
                try {
                  await closeCashRegister(closingBalanceCents);
                  // setShowCloseCashModal(false); // CHANGED: Don't close immediately, let modal show success state
                  setCashRegisterOpen(false);
                  success('Caixa fechado com sucesso');

                  // Recarregar dados
                  const totalCents = await getDailyTotal();
                  setDailyTotalCents(totalCents);
                  setDailyTotal(
                    formatAmount(totalCents)
                  );
                } catch (err: any) {
                  error(err.message || 'Erro ao fechar caixa');
                  // Não relançar - CloseCashRegisterModal já trata visualmente via setError()
                }
              }}
              onCancel={() => setShowCloseCashModal(false)}
              onDismiss={() => setShowCloseCashModal(false)}
            />
          </Suspense>
        )
      }

      {/* Create Group Modal */}
      {
        showCreateGroupModal && activeOrderId && (
          <Suspense fallback={<div style={{ padding: 16, textAlign: 'center' }}>Carregando modal de grupo...</div>}>
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
        )
      }
    </AppShell>
  );
};



// Wrap in TableProvider and OrderProvider
// TPV wrapper
// Providers (TableProvider, OfflineOrderProvider) are injected by AppDomainWrapper
const TPV = () => {
  // FASE 5: Toast para feedback visual (no nível do wrapper para compartilhar entre componentes)
  const { toasts, dismiss } = useToast();
  
  // Staff-style browser tab title for isolated tool context
  useEffect(() => {
    document.title = 'ChefIApp POS — TPV';
    return () => { document.title = 'ChefIApp POS'; };
  }, []);

  return (
    <LoyaltyProvider>
      <TPVContent />
      {/* FASE 5: Toast Container para feedback visual */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </LoyaltyProvider>
  );
};

export default TPV;

