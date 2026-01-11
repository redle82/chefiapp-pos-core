import React, { useState, useMemo, useEffect } from 'react';
import { getErrorMessage, getErrorSuggestion } from '../../core/errors/ErrorMessages';
import { getTabIsolated, setTabIsolated, removeTabIsolated } from '../../core/storage/TabIsolatedStorage';
import { AppShell } from '../../ui/design-system/AppShell';
import { useOrders } from './context/OrderContextReal';
import { OfflineOrderProvider } from './context/OfflineOrderContext';
import { SyncStatusIndicator } from '../../components/SyncStatusIndicator';
import type { Order } from './context/OrderTypes';
import { useMenuItems } from '../../hooks/useMenuItems';

/* UDS Implementation (Sealed) */
import { TPVLayout } from '../../ui/design-system/layouts/TPVLayout';
import { TPVHeader } from '../../ui/design-system/domain/TPVHeader';
import { CommandPanel } from '../../ui/design-system/domain/CommandPanel';
import { StreamTunnel } from '../../ui/design-system/domain/StreamTunnel';
import { QuickMenuPanel } from '../../ui/design-system/domain/QuickMenuPanel';
import { TableMapPanel } from '../../ui/design-system/domain/TableMapPanel';
import { Toast, useToast } from '../../ui/design-system';
import { TableProvider, useTables } from './context/TableContext';
import { PaymentModal } from './components/PaymentModal';
import { OpenCashRegisterModal } from './components/OpenCashRegisterModal';
import { CloseCashRegisterModal } from './components/CloseCashRegisterModal';
import { OrderItemEditor } from './components/OrderItemEditor';
import { IncomingRequests } from './components/IncomingRequests';
import { GroupSelector } from './components/GroupSelector';
import { CreateGroupModal } from './components/CreateGroupModal';
import { useConsumptionGroups } from './hooks/useConsumptionGroups';

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
  const { items: menuItems, loading: menuLoading } = useMenuItems(restaurantId);
  const { success, error } = useToast();
  const { tables } = useTables();
  const [contextView, setContextView] = useState<ContextView>('menu');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => {
    // HARD RULE 4: Recuperar pedido ativo ao carregar (Tab-Isolated)
    return getTabIsolated('chefiapp_active_order_id');
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dailyTotal, setDailyTotal] = useState<string>('€0,00');
  const [dailyTotalCents, setDailyTotalCents] = useState<number>(0);
  const [cashRegisterOpen, setCashRegisterOpen] = useState<boolean>(false);
  const [paymentModalOrderId, setPaymentModalOrderId] = useState<string | null>(null);
  const [showOpenCashModal, setShowOpenCashModal] = useState<boolean>(false);
  const [showCloseCashModal, setShowCloseCashModal] = useState<boolean>(false);
  const [openingBalanceCents, setOpeningBalanceCents] = useState<number>(0);

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
        setDailyTotal(
          new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalCents / 100)
        );

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
    try {
      // HARD RULE 2: 'pay' abre modal de pagamento
      if (action === 'pay') {
        setPaymentModalOrderId(orderId);
        return;
      }

      await performOrderAction(orderId, action);
      // HARD RULE: 'close' foi eliminado - pagamento já fecha automaticamente
      // Não precisa mais limpar pedido ativo aqui (já é feito no 'pay')
      console.log('[TPV] Syncing orders after action...');
      await getActiveOrders();
    } catch (err: any) {
      console.error('Failed to perform action:', err);
      
      const errorMsg = getErrorMessage(err, {
        code: err.code,
        message: err.message,
        orderId: orderId
      });
      
      error(errorMsg);
    }
  };

  // Handler de pagamento (chamado pelo modal)
  const handlePayment = async (method: 'cash' | 'card' | 'pix', intentId?: string) => {
    if (!paymentModalOrderId) return;

    try {
      // Para pagamentos Stripe (card), passar intentId no metadata
      const payload: any = { method };
      if (method === 'card' && intentId) {
        payload.stripe_intent_id = intentId;
      }

      await performOrderAction(paymentModalOrderId, 'pay', payload);
      
      // Integração Fiscal (GATE 5) - Não bloqueia pagamento se falhar
      try {
        const order = activeOrders.find(o => o.id === paymentModalOrderId);
        if (order && restaurantId) {
          const { getFiscalService } = await import('../../core/fiscal/FiscalService');
          const fiscalService = getFiscalService();
          await fiscalService.processPaymentConfirmed({
            orderId: paymentModalOrderId,
            restaurantId: restaurantId,
            paymentMethod: method,
            amountCents: order.total,
            paymentId: intentId,
          });
        }
      } catch (fiscalError) {
        // Log mas não bloqueia pagamento
        console.warn('[TPV] Fiscal processing failed (non-blocking):', fiscalError);
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
      throw err; // Re-throw para modal tratar
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
            // Mostrar editor de itens quando há pedido ativo
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
          ) : contextView === 'menu' ? (
            <>
              <QuickMenuPanel
                items={menuItems.map(item => ({
                  id: item.id,
                  name: item.name,
                  price: item.priceCents / 100, // Convert cents to euros
                  category: item.category,
                }))}
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
              tables={tables}
              onSelectTable={handleSelectTable}
            />
          )
        }
      />

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
                  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalCents / 100)
                );
              } catch (err: any) {
                error(err.message || 'Erro ao abrir caixa');
                throw err;
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
            onClose={async (closingBalanceCents) => {
              try {
                await closeCashRegister(closingBalanceCents);
                setShowCloseCashModal(false);
                setCashRegisterOpen(false);
                success('Caixa fechado com sucesso');

                // Recarregar dados
                const totalCents = await getDailyTotal();
                setDailyTotalCents(totalCents);
                setDailyTotal(
                  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(totalCents / 100)
                );
              } catch (err: any) {
                error(err.message || 'Erro ao fechar caixa');
                throw err;
              }
            }}
            onCancel={() => setShowCloseCashModal(false)}
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
