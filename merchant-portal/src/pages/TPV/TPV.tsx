import React, { useState, useMemo, useEffect } from 'react';
import { getErrorMessage, getErrorSuggestion } from '../../core/errors/ErrorMessages';
import { getTabIsolated, setTabIsolated, removeTabIsolated } from '../../core/storage/TabIsolatedStorage';
import { AppShell } from '../../ui/design-system/AppShell';
import { useOrders } from './context/OrderContextReal';
import { OfflineOrderProvider } from './context/OfflineOrderContext';
import { SyncStatusIndicator } from '../../components/SyncStatusIndicator';
import type { Order } from './context/OrderTypes';
import { useMenuItems } from '../../hooks/useMenuItems';
import { useCoreHealth } from '../../core/health/useCoreHealth';

import { OfflineBanner } from '../../components/OfflineBanner';
import { DeliveryNotificationManager } from './components/DeliveryNotificationManager';
import { FiscalConfigAlert } from './components/FiscalConfigAlert';
import { CashRegisterAlert } from './components/CashRegisterAlert';



/* UDS Implementation (Sealed) */
import { TPVLayout } from '../../ui/design-system/layouts/TPVLayout';
import { TPVHeader } from '../../ui/design-system/domain/TPVHeader';
import { CommandPanel } from '../../ui/design-system/domain/CommandPanel';
import { StreamTunnel } from '../../ui/design-system/domain/StreamTunnel';
import { QuickMenuPanel } from '../../ui/design-system/domain/QuickMenuPanel';
import { TableMapPanel } from '../../ui/design-system/domain/TableMapPanel';
import { Toast, useToast } from '../../ui/design-system';
import { spacing } from '../../ui/design-system/tokens/spacing';
import { TableProvider, useTables } from './context/TableContext';
import { PaymentModal } from './components/PaymentModal';
import { SplitBillModalWrapper } from './components/SplitBillModalWrapper';
import { OpenCashRegisterModal } from './components/OpenCashRegisterModal';
import { CloseCashRegisterModal } from './components/CloseCashRegisterModal';
import { OrderItemEditor } from './components/OrderItemEditor';
import { OrderSummaryPanel } from './components/OrderSummaryPanel';
import { OrderHeader } from './components/OrderHeader';
import { IncomingRequests } from './components/IncomingRequests';
import { GroupSelector } from './components/GroupSelector';
import { CreateGroupModal } from './components/CreateGroupModal';
import { useConsumptionGroups } from './hooks/useConsumptionGroups';
import { useCommonTPVShortcuts } from './hooks/useTPVShortcuts';
import { TPVInstallPrompt } from './components/TPVInstallPrompt'; // Added Install Prompt
import { useCurrency } from '../../core/currency/useCurrency'; // P5-5
import { useVoiceCommands } from '../../core/voice/useVoiceCommands'; // P5-8
import { useAutomatedInventory } from '../../core/inventory/useAutomatedInventory'; // P5-4

import { useDynamicMenu } from '../../core/menu/DynamicMenu/hooks/useDynamicMenu';

type ContextView = 'menu' | 'tables';

const TPVContent = () => {
  // FIX: Reactive Restaurant ID Resolution
  const [restaurantId, setRestaurantId] = useState<string | null>(getTabIsolated('chefiapp_restaurant_id'));

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
      menu.contextual.forEach(item => {
        items.push({
          id: item.id,
          name: item.name, // Keep existing naming
          price: item.price_cents / 100, // Convert to Float Euros
          category: '✨ Sugestões Inteligentes',
          trackStock: true, // Assuming default true for now or map from item
          stockQuantity: 100, // Mock infinite for now or map
          // Add extra metadata if needed by updated components
        });
      });
    }

    // 2. Full Catalog
    menu.fullCatalog.forEach(cat => {
      cat.products.forEach(item => {
        items.push({
          id: item.id,
          name: item.name,
          price: item.price_cents / 100,
          category: cat.name,
          trackStock: true, // Mock
          stockQuantity: 100 // Mock
        });
      });
    });

    return items;
  }, [menu]);
  const { success, error } = useToast();
  const { tables } = useTables();

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
  // Demo mode permite ações mesmo com sistema down (para testes)
  const isDemoData = getTabIsolated('chefiapp_demo_mode') === 'true';
  const actionsEnabled = healthStatus === 'UP' || healthStatus === 'DEGRADED' || isDemoData || isOnline;
  const [contextView, setContextView] = useState<ContextView>('menu');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => {
    // HARD RULE 4: Recuperar pedido ativo ao carregar (Tab-Isolated)
    return getTabIsolated('chefiapp_active_order_id');
  });
  const [dailyTotal, setDailyTotal] = useState<string>('€0,00');

  // P5-5: Currency support
  const { currency, formatAmount } = useCurrency();

  // P5-4: Automated inventory
  const { alerts: inventoryAlerts } = useAutomatedInventory();

  // P5-8: Voice commands
  const voiceCommands = useVoiceCommands([
    {
      pattern: 'novo pedido',
      action: () => {
        if (cashRegisterOpen) {
          handleCreateOrder();
        }
      },
      description: 'Criar novo pedido',
    },
    {
      pattern: 'abrir caixa',
      action: () => {
        if (!cashRegisterOpen) {
          setShowOpenCashModal(true);
        }
      },
      description: 'Abrir caixa',
    },
    {
      pattern: 'fechar pedido',
      action: () => {
        if (activeOrderId) {
          const order = orders.find(o => o.id === activeOrderId);
          if (order && order.status !== 'paid') {
            setPaymentModalOrderId(activeOrderId);
          }
        }
      },
      description: 'Fechar pedido',
    },
  ], true);
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

  // FASE 2 + P3-3: Atalhos de teclado para reduzir cliques
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
      if (!cashRegisterOpen) {
        setShowOpenCashModal(true);
      }
    },
    onCloseCash: () => {
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

  console.log('[TPV] BODY RENDER. menuItems:', menuItems?.length);

  // BUG-023 FIX: Detect offline/online status
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

  // Filter active orders (not delivered/cancelled)
  const activeOrders = useMemo(() => {
    // HARD RULE: Pedidos pagos são 'preparing' ou 'ready' (ainda ativos na cozinha/tela)
    // Apenas 'delivered' e 'canceled' saem do túnel
    return orders.filter(o => o.status !== 'delivered' && o.status !== 'canceled');
  }, [orders]);

  // Mapear estado visual das mesas com base em pedidos ativos
  // Livre (free) = sem pedido ativo; Ocupada (occupied) = há pedido ativo; Reservada mantém estado original
  // SEMANA 1 - Tarefa 1.1: Incluir informações do pedido ativo
  const tableView = useMemo(() => {
    return tables.map(table => {
      const activeOrder = activeOrders.find(o => o.tableId === table.id || o.tableNumber === table.number);
      const hasActiveOrder = !!activeOrder;
      const derivedStatus: 'free' | 'occupied' | 'reserved' =
        table.status === 'reserved'
          ? 'reserved'
          : hasActiveOrder
            ? 'occupied'
            : 'free';

      return {
        ...table,
        status: derivedStatus,
        // SEMANA 1 - Tarefa 1.1: Incluir informações do pedido ativo
        orderInfo: activeOrder ? {
          id: activeOrder.id,
          status: activeOrder.status,
          total: activeOrder.total,
        } : undefined,
      };
    });
  }, [tables, activeOrders]);

  // DEBUG: TPV State
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

  // Load daily total and check cash register
  useEffect(() => {
    const loadData = async () => {
      try {
        const totalCents = await getDailyTotal();
        setDailyTotalCents(totalCents);
        setDailyTotal(formatAmount(totalCents));

        // Verificar caixa aberto
        const register = await getOpenCashRegister();
        const isOpen = !!register;
        setCashRegisterOpen(isOpen);
        if (register) {
          setOpeningBalanceCents(register.openingBalanceCents);
        }

        // UX: Se caixa fechado e não há modal aberto, sugerir abertura
        if (!isOpen && !showOpenCashModal && activeOrders.length === 0) {
          // Não forçar, apenas deixar visível o botão no CommandPanel
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [getDailyTotal, getOpenCashRegister, showOpenCashModal, activeOrders.length]);

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

  // Handler de pagamento (chamado pelo modal)
  const handlePayment = async (method: 'cash' | 'card' | 'pix', intentId?: string) => {
    if (!paymentModalOrderId) return;

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
    } catch (err) {
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
            consumptionGroupId: groupId || null, // Divisão de conta
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
        consumptionGroupId: groupId || null, // Divisão de conta
      });

      success(`${item.name} adicionado`);
    } catch (err: any) {
      console.error('Failed to add item:', err);

      const errorMsg = getErrorMessage(err, {
        code: err.code,
        message: err.message,
        tableId: selectedTableId,
        tableNumber: selectedTableId ? tables.find(t => t.id === selectedTableId)?.number : undefined,
        itemName: item.name
      });

      error(errorMsg);

      // Show suggestion if available
      const suggestion = getErrorSuggestion(err, {
        code: err.code,
        tableId: selectedTableId
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

  const handleSelectTable = async (tableId: string) => {
    setSelectedTableId(tableId);

    // UX: Verificar se mesa já tem pedido ativo
    const table = tables.find(t => t.id === tableId);
    if (table) {
      const existingOrder = activeOrders.find(o => o.tableId === tableId);
      if (existingOrder) {
        // Abrir pedido existente automaticamente
        setActiveOrderId(existingOrder.id);
        setTabIsolated('chefiapp_active_order_id', existingOrder.id);
        success(`Pedido da mesa ${table.number} aberto`);
      }
    }

    setContextView('menu'); // Return to menu after selection
  };

  return (
    <AppShell operationalMode={true}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <OfflineBanner />
        <DeliveryNotificationManager />
        <FiscalConfigAlert restaurantId={restaurantId} />
        <CashRegisterAlert
          isOpen={cashRegisterOpen}
          onOpenCash={() => setShowOpenCashModal(true)}
        />
        <TPVInstallPrompt />
        <TPVLayout
          header={
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <TPVHeader
                  operatorName="GOLDMONKEY"
                  terminalId="CAIXA 01"
                  isOnline={isOnline}
                />
              </div>
              <SyncStatusIndicator />
            </div>
          }
          command={
            <CommandPanel
              onCreateOrder={handleCreateOrder}
              onOpenTables={() => {
                console.log('[TPV] onOpenTables clicked');
                setContextView(prev => {
                  const newView = prev === 'menu' ? 'tables' : 'menu';
                  console.log('[TPV] contextView changed:', newView);
                  return newView;
                });
              }}
              dailyTotal={dailyTotal}
              cashRegisterOpen={cashRegisterOpen}
              onOpenCashRegister={() => {
                console.log('[TPV] onOpenCashRegister clicked');
                setShowOpenCashModal(true);
              }}
              onCloseCashRegister={() => {
                console.log('[TPV] onCloseCashRegister clicked');

                // UX HARD BLOCK: Prevent closing with active orders
                if (activeOrders.length > 0) {
                  error(`Impossível fechar caixa: Existem ${activeOrders.length} pedidos em aberto. Finalize ou cancele-os antes.`);
                  return;
                }

                setShowCloseCashModal(true);
              }}
            />
          }
          stream={
            <>
              <IncomingRequests
                restaurantId={restaurantId}
                onOrderAccepted={() => getActiveOrders()}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                <StreamTunnel
                  orders={activeOrders}
                  onAction={handleAction}
                  activeOrderId={activeOrderId}
                />
              </div>
            </>
          }
          context={
            activeOrderId && activeOrders.find(o => o.id === activeOrderId) ? (
              // Mostrar resumo da conta e editor de itens quando há pedido ativo
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: spacing[3] }}>
                {/* Header Fixo da Conta */}
                <OrderHeader
                  order={activeOrders.find(o => o.id === activeOrderId) || null}
                />
                {/* Resumo da Conta (Sempre Visível) */}
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
                {/* Editor de Itens */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
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
                      setActiveOrderId(null);
                      removeTabIsolated('chefiapp_active_order_id');
                      setContextView('menu');
                    }}
                    loading={ordersLoading}
                  />
                </div>
              </div>
            ) : contextView === 'menu' ? (
              <>
                <QuickMenuPanel
                  items={menuItems
                    .filter(item => !item.visibility || item.visibility.tpv !== false) // Filter by visibility
                    .map(item => ({
                      id: item.id,
                      name: item.name,
                      price: item.priceCents / 100, // Convert cents to euros
                      category: item.category,
                      trackStock: item.trackStock,
                      stockQuantity: item.stockQuantity
                    }))}
                  activeOrderItems={
                    activeOrderId
                      ? activeOrders.find(o => o.id === activeOrderId)?.items || []
                      : []
                  }
                  onAddItem={(item) => {
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
                    <Card surface="layer1" padding="xl" style={{ maxWidth: 500, width: '90%' }}>
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
              </>
            ) : (
              <TableMapPanel
                tables={tableView}
                onSelectTable={handleSelectTable}
                onCreateOrder={async (tableId: string) => {
                  // SEMANA 1 - Tarefa 1.1: Ação rápida para criar pedido em mesa livre
                  const table = tables.find(t => t.id === tableId);
                  if (table) {
                    setSelectedTableId(tableId);
                    // Mudar para view de menu para adicionar itens
                    setContextView('menu');
                    success(`Mesa ${table.number} selecionada. Adicione itens do menu para criar o pedido.`);
                  }
                }}
              />
            )
          }
        />
      </div>

      {/* Payment Modal */}
      {
        paymentModalOrderId && (() => {
          const order = activeOrders.find(o => o.id === paymentModalOrderId);
          if (!order) return null;
          return (
            <PaymentModal
              orderId={order.id}
              restaurantId={restaurantId || ''}
              orderTotal={order.total}
              onPay={handlePayment}
              onCancel={() => setPaymentModalOrderId(null)}
            />
          );
        })()
      }

      {/* Split Bill Modal */}
      {
        splitBillModalOrderId && (() => {
          const order = activeOrders.find(o => o.id === splitBillModalOrderId);
          if (!order) return null;
          return (
            <SplitBillModalWrapper
              orderId={order.id}
              restaurantId={restaurantId || ''}
              orderTotal={order.total}
              onPayPartial={handlePartialPayment}
              onCancel={() => setSplitBillModalOrderId(null)}
              loading={ordersLoading}
            />
          );
        })()
      }

      {/* Open Cash Register Modal */}
      {
        showOpenCashModal && (
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
        )
      }

      {/* Close Cash Register Modal */}
      {
        showCloseCashModal && (
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
        )
      }

      {/* Create Group Modal */}
      {
        showCreateGroupModal && activeOrderId && (
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
        )
      }
    </AppShell >
  );
};

// Wrap in TableProvider and OrderProvider
const TPV = () => {
  // Staff-style browser tab title for isolated tool context
  useEffect(() => {
    document.title = 'ChefIApp POS — TPV';
    return () => { document.title = 'ChefIApp POS'; };
  }, []);

  return (
    <TableProvider>
      <OfflineOrderProvider>
        <TPVContent />
      </OfflineOrderProvider>
    </TableProvider>
  );
};

export default TPV;
