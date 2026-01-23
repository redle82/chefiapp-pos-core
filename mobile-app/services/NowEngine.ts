/**
 * NOW ENGINE - Motor de Decisão Única
 *
 * Sistema que decide "o que fazer AGORA" - uma coisa por vez
 *
 * Premissa inegociável:
 * O AppStaff mostra APENAS UMA COISA POR VEZ.
 */

import { StaffRole } from '@/context/AppStaffContext';
import { gamificationService } from './GamificationService';
import { addBreadcrumb, logError } from './logging';
import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export type ActionType = 'critical' | 'urgent' | 'attention' | 'silent';
export type ActionName =
  | 'collect_payment'
  | 'deliver'
  | 'check'
  | 'resolve'
  | 'acknowledge'
  | 'check_kitchen'
  | 'prioritize_drinks'
  | 'routine_clean'
  | 'resolve_error';

export interface NowAction {
  id: string;
  type: ActionType;
  title: string; // Máximo 2 palavras
  message: string | null; // Máximo 1 frase
  reason?: string; // ERRO-009 Fix: Explicação do "porquê" da ação (1 linha clara)
  action: ActionName | null;
  tableId?: string;
  orderId?: string;
  itemId?: string;
  itemCategory?: string;
  orderOrigin?: 'WEB_PUBLIC' | 'GARÇOM' | string; // ERRO-002 Fix: Origem do pedido
  tableNumber?: string; // ERRO-002 Fix: Número da mesa para exibição
  priority: number; // 0-1000
  timestamp: number;
}

export interface OperationalContext {
  currentTime: number;
  shiftDuration: number;
  tables: TableContext[];
  kitchen: KitchenContext;
  sales: SalesContext;
  staff: StaffContext;
  pressure: PressureContext;
}

interface TableContext {
  id: string;
  status: 'free' | 'occupied' | 'needs_attention';
  lastEventTime: number;
  orderStatus: 'pending' | 'preparing' | 'ready' | 'delivered' | 'wants_pay' | 'paid';
  elapsedMinutes: number;
  orderId?: string;
}

interface KitchenContext {
  pressure: 'low' | 'medium' | 'high';
  preparingCount: number;
  readyItems: ReadyItem[];
  delayedItems: DelayedItem[];
}

interface ReadyItem {
  orderId: string;
  tableId: string;
  itemId: string;
  itemName: string;
  itemCategory: string;
  readyTime: number;
  elapsedMinutes: number;
  isDelivered?: boolean; // ERRO-016 Fix: Status de entrega
}

interface DelayedItem {
  orderId: string;
  tableId: string;
  itemId: string;
  expectedTime: number;
  actualTime: number;
  delay: number;
}

interface SalesContext {
  pendingPayments: PendingPayment[];
  activeOrders: number;
}

interface PendingPayment {
  orderId: string;
  tableId: string;
  amount: number;
  elapsedMinutes: number;
}

interface StaffContext {
  role: StaffRole;
  currentAction: string | null;
  idleTime: number; // segundos
}

interface PressureContext {
  overall: 'low' | 'medium' | 'high';
  factors: string[];
}

// ============================================================================
// NOW ENGINE CLASS
// ============================================================================

class NowEngine {
  private context: OperationalContext | null = null;
  private currentAction: NowAction | null = null;
  private listeners: ((action: NowAction | null) => void)[] = [];
  private intervalId: any = null;
  private channel: any = null;
  private restaurantId: string | null = null;
  private currentRole: StaffRole = 'waiter';

  // ERRO-002 Fix: Armazenar dados dos pedidos para incluir origem e mesa
  private ordersCache: Map<string, { origin?: string; table_number?: string }> = new Map();

  // Tracking de ações completadas (evita duplicação)
  private completedActions: Map<string, number> = new Map(); // actionId -> timestamp
  private readonly COMPLETED_ACTION_TTL = 60000; // 60 segundos

  // Debounce para recalculations
  private recalculationTimeout: any = null;
  private readonly RECALCULATION_DEBOUNCE = 1000; // 1 segundo

  async start(restaurantId: string, role: StaffRole) {
    this.restaurantId = restaurantId;
    this.currentRole = role;

    // FASE 4: Inicializar GamificationService
    gamificationService.setRestaurantId(restaurantId);

    // Observa contexto continuamente (a cada 30s)
    this.intervalId = setInterval(() => {
      this.recalculate();
    }, 30000);

    // Escuta eventos em tempo real
    this.subscribeToEvents();

    // Primeiro cálculo
    await this.recalculate();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.recalculationTimeout) {
      clearTimeout(this.recalculationTimeout);
      this.recalculationTimeout = null;
    }
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    // Limpar tracking
    this.completedActions.clear();
    this.currentAction = null;
  }

  setRole(role: StaffRole) {
    this.currentRole = role;
    this.recalculate();
  }

  subscribe(listener: (action: NowAction | null) => void) {
    this.listeners.push(listener);
    // Enviar ação atual imediatamente
    if (this.currentAction) {
      listener(this.currentAction);
    }
  }

  unsubscribe(listener: (action: NowAction | null) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private async recalculate() {
    // Limpar timeout anterior se existir
    if (this.recalculationTimeout) {
      clearTimeout(this.recalculationTimeout);
    }

    // Debounce: aguardar antes de recalcular
    this.recalculationTimeout = setTimeout(async () => {
      try {
        // Limpar ações completadas antigas
        this.cleanCompletedActions();

        const context = await this.gatherContext();
        const action = this.calculateNowAction(context);

        // Verificar se ação não foi completada recentemente
        if (action && this.isActionRecentlyCompleted(action.id)) {
          // Ação foi completada recentemente, não mostrar
          if (this.currentAction?.id === action.id) {
            // Se é a mesma ação atual, limpar
            this.currentAction = null;
            this.emit(null);
          }
          return;
        }

        // Só emitir se ação mudou
        if (action?.id !== this.currentAction?.id) {
          this.currentAction = action;
          this.emit(action);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logError(err, {
          action: 'recalculate',
          restaurantId: this.restaurantId ?? undefined,
        });
        console.error('[NowEngine] Recalculate error:', error);
      }
    }, this.RECALCULATION_DEBOUNCE);
  }

  private async gatherContext(): Promise<OperationalContext> {
    if (!this.restaurantId) {
      const error = new Error('Restaurant ID not set');
      logError(error, { action: 'gatherContext' });
      throw error;
    }

    addBreadcrumb('Gathering context', 'nowengine', { restaurantId: this.restaurantId });

    // 1. Mesas
    const { data: tablesData } = await supabase
      .from('gm_tables')
      .select('id, status, last_event_time')
      .eq('restaurant_id', this.restaurantId);

    // 2. Pedidos
    // ERRO-002 Fix: Buscar origem e table_number para exibição
    const { data: ordersData } = await supabase
      .from('gm_orders')
      .select('id, table_id, table_number, status, total, origin, created_at, updated_at')
      .eq('restaurant_id', this.restaurantId)
      .in('status', ['pending', 'preparing', 'delivered', 'wants_pay']);

    // ERRO-002 Fix: Cachear dados dos pedidos para uso nas ações
    if (ordersData) {
      ordersData.forEach(order => {
        this.ordersCache.set(order.id, {
          origin: order.origin || 'GARÇOM',
          table_number: order.table_number || order.table_id || '?'
        });
      });
    }

    // 3. Itens
    // ERRO-016 Fix: Buscar nome do item e status de entrega
    const { data: itemsData } = await supabase
      .from('gm_order_items')
      .select('id, order_id, status, ready_at, category, product_name, created_at')
      .eq('restaurant_id', this.restaurantId)
      .in('status', ['preparing', 'ready', 'delivered']);

    // 4. Mapear contexto
    const tables: TableContext[] = (tablesData || []).map(table => {
      const order = (ordersData || []).find(o => o.table_id === table.id);
      const lastEventTime = new Date(table.last_event_time || table.id).getTime();
      const elapsedMinutes = Math.floor((Date.now() - lastEventTime) / 60000);

      return {
        id: table.id,
        status: table.status as any,
        lastEventTime,
        orderStatus: order?.status as any || 'free',
        elapsedMinutes,
        orderId: order?.id
      };
    });

    // 5. KDS
    // ERRO-016 Fix: Buscar nome do item e status de entrega
    const readyItems: ReadyItem[] = (itemsData || [])
      .filter(item => (item.status === 'ready' || item.status === 'delivered') && item.ready_at)
      .map(item => {
        const order = (ordersData || []).find(o => o.id === item.order_id);
        const readyTime = new Date(item.ready_at).getTime();
        const elapsedMinutes = Math.floor((Date.now() - readyTime) / 60000);

        return {
          orderId: item.order_id,
          tableId: order?.table_id || '',
          itemId: item.id,
          itemName: item.product_name || 'Item', // ERRO-016 Fix: Nome real do item
          itemCategory: item.category || 'food',
          readyTime,
          elapsedMinutes,
          isDelivered: item.status === 'delivered' || false // ERRO-016 Fix: Status de entrega
        };
      });

    const preparingCount = (itemsData || []).filter(i => i.status === 'preparing').length;
    const kitchenPressure = this.calculateKitchenPressure(preparingCount);

    // 6. Vendas
    const pendingPayments: PendingPayment[] = (ordersData || [])
      .filter(o => o.status === 'wants_pay')
      .map(order => {
        const elapsedMinutes = Math.floor((Date.now() - new Date(order.updated_at).getTime()) / 60000);
        return {
          orderId: order.id,
          tableId: order.table_id,
          amount: order.total,
          elapsedMinutes
        };
      });

    // 7. Pressão
    const pressure = this.calculateOverallPressure(tables, ordersData || [], itemsData || []);

    return {
      currentTime: Date.now(),
      shiftDuration: 0, // TODO: calcular duração do turno
      tables,
      kitchen: {
        pressure: kitchenPressure,
        preparingCount,
        readyItems,
        delayedItems: [] // TODO: calcular itens atrasados
      },
      sales: {
        pendingPayments,
        activeOrders: ordersData?.length || 0
      },
      staff: {
        role: this.currentRole,
        currentAction: null, // TODO: rastrear ação atual
        idleTime: 0 // TODO: calcular tempo ocioso
      },
      pressure
    };
  }

  private calculateNowAction(context: OperationalContext): NowAction | null {
    // 1. Calcular todas as ações possíveis
    const allActions = this.calculateAllActions(context);

    // 2. Filtrar ações completadas recentemente
    const filteredActions = allActions.filter(action =>
      !this.isActionRecentlyCompleted(action.id)
    );

    // 3. Filtrar por role
    const roleActions = this.filterByRole(filteredActions, context.staff.role);

    // 4. Priorizar
    const prioritized = this.prioritize(roleActions);

    // 5. Selecionar 1 única ação
    return prioritized[0] || this.getSilentState();
  }

  private calculateAllActions(context: OperationalContext): NowAction[] {
    const actions: NowAction[] = [];

    // ERRO-002 Fix: Helper para obter dados do pedido
    const getOrderData = (orderId: string | undefined) => {
      if (!orderId) return { origin: 'GARÇOM', tableNumber: '?' };
      const cached = this.ordersCache.get(orderId);
      return {
        origin: cached?.origin || 'GARÇOM',
        tableNumber: cached?.table_number || '?'
      };
    };

    // CRÍTICO
    // 1. Cliente reclamando (< 2min)
    const complaint = context.tables.find(t =>
      t.status === 'needs_attention' &&
      t.elapsedMinutes < 2
    );
    if (complaint) {
      const orderData = getOrderData(complaint.orderId);
      // ERRO-018 Fix: Mensagem específica
      actions.push({
        id: `critical-complaint-${complaint.id}`,
        type: 'critical',
        title: `Mesa ${orderData.tableNumber}`,
        message: 'Cliente chamou, verificar urgência',
        reason: 'Cliente solicitou atenção recentemente. Verificar necessidade imediata para evitar insatisfação.', // ERRO-009 Fix
        action: 'resolve',
        tableId: complaint.id,
        orderOrigin: orderData.origin, // ERRO-002 Fix
        tableNumber: orderData.tableNumber, // ERRO-002 Fix
        priority: 1000,
        timestamp: Date.now()
      });
    }

    // 2. Mesa quer pagar há > 5min
    const wantsPayCritical = context.tables.find(t =>
      t.orderStatus === 'wants_pay' &&
      t.elapsedMinutes > 5
    );
    if (wantsPayCritical) {
      const orderData = getOrderData(wantsPayCritical.orderId);
      actions.push({
        id: `critical-payment-${wantsPayCritical.id}`,
        type: 'critical',
        title: `Mesa ${orderData.tableNumber}`,
        message: 'Quer pagar há 5+ min',
        reason: `Cliente aguardando pagamento há ${Math.floor(wantsPayCritical.elapsedMinutes)} minutos. Prioridade máxima para evitar insatisfação.`, // ERRO-009 Fix
        action: 'collect_payment',
        tableId: wantsPayCritical.id,
        orderId: wantsPayCritical.orderId,
        orderOrigin: orderData.origin, // ERRO-002 Fix
        tableNumber: orderData.tableNumber, // ERRO-002 Fix
        priority: 900,
        timestamp: Date.now()
      });
    }

    // 3. Item pronto há > 3min
    // ERRO-024 Fix: Agrupar itens por pedido para mostrar status completo
    const orderDeliveryMap = new Map<string, { orderId: string; pendingItems: ReadyItem[]; deliveredItems: ReadyItem[] }>();
    context.kitchen.readyItems.forEach(item => {
      if (!orderDeliveryMap.has(item.orderId)) {
        orderDeliveryMap.set(item.orderId, {
          orderId: item.orderId,
          pendingItems: [],
          deliveredItems: []
        });
      }
      const status = orderDeliveryMap.get(item.orderId)!;
      if (item.isDelivered) {
        status.deliveredItems.push(item);
      } else {
        status.pendingItems.push(item);
      }
    });

    const criticalOrder = Array.from(orderDeliveryMap.values()).find(status =>
      status.pendingItems.some(item => item.elapsedMinutes > 3)
    );

    if (criticalOrder) {
      const orderData = getOrderData(criticalOrder.orderId);
      const criticalItem = criticalOrder.pendingItems.find(item => item.elapsedMinutes > 3)!;
      const pendingCount = criticalOrder.pendingItems.length;
      const deliveredCount = criticalOrder.deliveredItems.length;

      let message = `${criticalItem.itemName} pronto há 3+ min`;
      if (pendingCount > 1) {
        message += ` (+${pendingCount - 1} ${pendingCount - 1 === 1 ? 'item' : 'itens'} pendente${pendingCount - 1 === 1 ? '' : 's'})`;
      }
      if (deliveredCount > 0) {
        message += ` • ${deliveredCount} ${deliveredCount === 1 ? 'entregue' : 'entregues'}`;
      }

      actions.push({
        id: `critical-ready-${criticalItem.itemId}`,
        type: 'critical',
        title: `Mesa ${orderData.tableNumber}`,
        message,
        reason: `${criticalItem.itemName} está pronto há ${Math.floor(criticalItem.elapsedMinutes)} minutos. Entregar imediatamente para manter qualidade.`, // ERRO-009 Fix
        action: 'deliver',
        tableId: criticalItem.tableId,
        orderId: criticalOrder.orderId,
        itemId: criticalItem.itemId,
        itemCategory: criticalItem.itemCategory,
        orderOrigin: orderData.origin, // ERRO-002 Fix
        tableNumber: orderData.tableNumber, // ERRO-002 Fix
        priority: 850,
        timestamp: Date.now()
      });
    }

    // URGENTE
    // 1. Mesa quer pagar há 2-5min
    const wantsPayUrgent = context.tables.find(t =>
      t.orderStatus === 'wants_pay' &&
      t.elapsedMinutes >= 2 &&
      t.elapsedMinutes <= 5
    );
    if (wantsPayUrgent) {
      const orderData = getOrderData(wantsPayUrgent.orderId);
      actions.push({
        id: `urgent-payment-${wantsPayUrgent.id}`,
        type: 'urgent',
        title: `Mesa ${orderData.tableNumber}`,
        message: 'Quer pagar',
        reason: `Cliente aguardando pagamento há ${Math.floor(wantsPayUrgent.elapsedMinutes)} minutos. Processar para liberar mesa.`, // ERRO-009 Fix
        action: 'collect_payment',
        tableId: wantsPayUrgent.id,
        orderId: wantsPayUrgent.orderId,
        orderOrigin: orderData.origin, // ERRO-002 Fix
        tableNumber: orderData.tableNumber, // ERRO-002 Fix
        priority: 700,
        timestamp: Date.now()
      });
    }

    // 2. Item pronto há 1-3min
    // ERRO-024 Fix: Buscar próximo pedido urgente com status completo
    const urgentOrder = Array.from(orderDeliveryMap.values()).find(status =>
      status.pendingItems.length > 0 &&
      status.pendingItems.every(item => item.elapsedMinutes <= 3) &&
      !criticalOrder // Só se não houver pedido crítico
    );

    if (urgentOrder) {
      const orderData = getOrderData(urgentOrder.orderId);
      const urgentItem = urgentOrder.pendingItems[0];
      const pendingCount = urgentOrder.pendingItems.length;
      const deliveredCount = urgentOrder.deliveredItems.length;

      let message = `${urgentItem.itemName} pronto`;
      if (pendingCount > 1) {
        message += ` (+${pendingCount - 1} ${pendingCount - 1 === 1 ? 'item' : 'itens'})`;
      }
      if (deliveredCount > 0) {
        message += ` • ${deliveredCount} ${deliveredCount === 1 ? 'entregue' : 'entregues'}`;
      }

      actions.push({
        id: `urgent-ready-${urgentItem.itemId}`,
        type: 'urgent',
        title: `Mesa ${orderData.tableNumber}`,
        message,
        reason: `${urgentItem.itemName} está pronto há ${Math.floor(urgentItem.elapsedMinutes)} minutos. Entregar para manter temperatura e qualidade.`, // ERRO-009 Fix
        action: 'deliver',
        tableId: urgentItem.tableId,
        orderId: urgentOrder.orderId,
        itemId: urgentItem.itemId,
        itemCategory: urgentItem.itemCategory,
        orderOrigin: orderData.origin, // ERRO-002 Fix
        tableNumber: orderData.tableNumber, // ERRO-002 Fix
        priority: 600,
        timestamp: Date.now()
      });
    }

    // 3. Mesa ocupada há > 30min
    const staleTable = context.tables.find(t =>
      t.status === 'occupied' &&
      t.elapsedMinutes > 30 &&
      t.orderStatus !== 'wants_pay'
    );
    if (staleTable) {
      const orderData = getOrderData(staleTable.orderId);
      // ERRO-018 Fix: Mensagem específica
      actions.push({
        id: `urgent-stale-${staleTable.id}`,
        type: 'urgent',
        title: `Mesa ${orderData.tableNumber}`,
        message: `Sem ação há ${staleTable.elapsedMinutes} min, verificar se cliente precisa algo`,
        reason: `Mesa ocupada há ${staleTable.elapsedMinutes} minutos sem ação. Verificar se cliente precisa de algo ou quer pagar.`, // ERRO-009 Fix
        action: 'check',
        tableId: staleTable.id,
        orderOrigin: orderData.origin, // ERRO-002 Fix
        tableNumber: orderData.tableNumber, // ERRO-002 Fix
        priority: 500,
        timestamp: Date.now()
      });
    }

    // 4. KDS saturado
    if (context.kitchen.pressure === 'high') {
      const preparingCount = context.kitchen.preparingCount;
      // ERRO-025 Fix: Mensagem específica
      actions.push({
        id: 'urgent-kitchen-pressure',
        type: 'urgent',
        title: 'Cozinha',
        message: `Cozinha saturada (${preparingCount} itens) - Priorizar bebidas para liberar espaço`,
        reason: `Cozinha com ${preparingCount} itens em preparo. Priorizar bebidas (preparo rápido) para reduzir pressão e melhorar fluxo.`, // ERRO-009 Fix
        action: 'prioritize_drinks',
        priority: 550,
        timestamp: Date.now()
      });
    }

    // ATENÇÃO
    // 1. Mesa ocupada há 15-30min
    const attentionTable = context.tables.find(t =>
      t.status === 'occupied' &&
      t.elapsedMinutes >= 15 &&
      t.elapsedMinutes <= 30
    );
    if (attentionTable) {
      const orderData = getOrderData(attentionTable.orderId);
      // ERRO-018 Fix: Mensagem específica
      actions.push({
        id: `attention-table-${attentionTable.id}`,
        reason: `Mesa ocupada há ${attentionTable.elapsedMinutes} minutos. Verificar se cliente está satisfeito ou precisa de algo.`, // ERRO-009 Fix
        type: 'attention',
        title: `Mesa ${orderData.tableNumber}`,
        message: `Sem ação há ${attentionTable.elapsedMinutes} min, verificar se precisa algo`,
        action: 'check',
        tableId: attentionTable.id,
        orderOrigin: orderData.origin, // ERRO-002 Fix
        tableNumber: orderData.tableNumber, // ERRO-002 Fix
        priority: 400,
        timestamp: Date.now()
      });
    }

    // 2. Pedido novo (< 2min)
    // ERRO-002 Fix + ERRO-003 Fix: Incluir origem e mudar mensagem
    const newOrder = context.tables.find(t =>
      t.orderStatus === 'pending' &&
      t.elapsedMinutes < 2
    );
    if (newOrder) {
      const orderData = getOrderData(newOrder.orderId);
      // ERRO-003 Fix: Mensagem mais clara e específica explicando o que fazer
      const originText = orderData.origin === 'WEB_PUBLIC' ? 'web' :
                        orderData.origin === 'CAIXA' ? 'do caixa' :
                        'do garçom';
      actions.push({
        id: `attention-new-${newOrder.id}`,
        type: 'attention',
        title: `Mesa ${orderData.tableNumber}`,
        // ERRO-003 Fix: Mensagem explicativa - o que fazer e por quê
        message: `Novo pedido ${originText} recebido. Toque para ver detalhes e confirmar recebimento.`,
        reason: `Pedido ${originText} recebido há ${Math.floor(newOrder.elapsedMinutes)} minutos. Confirmar recebimento para iniciar preparo.`, // ERRO-009 Fix
        action: 'acknowledge',
        tableId: newOrder.id,
        orderId: newOrder.orderId,
        orderOrigin: orderData.origin, // ERRO-002 Fix
        tableNumber: orderData.tableNumber, // ERRO-002 Fix
        priority: 300,
        timestamp: Date.now()
      });
    }

    return actions;
  }

  private filterByRole(actions: NowAction[], role: StaffRole): NowAction[] {
    switch (role) {
      case 'waiter':
        // Garçom vê: ações de mesa, entregar itens, coletar pagamento
        return actions.filter(a =>
          a.tableId ||
          a.action === 'deliver' ||
          a.action === 'collect_payment' ||
          a.action === 'check' ||
          a.action === 'acknowledge'
        );

      case 'cook':
        // Cozinheiro vê: itens prontos, pressão de cozinha
        return actions.filter(a =>
          (a.action === 'deliver' && a.itemCategory !== 'drink') ||
          a.action === 'check_kitchen' ||
          a.action === 'prioritize_drinks'
        );

      case 'bartender':
        // Barman vê: bebidas prontas, pressão de bar
        return actions.filter(a =>
          (a.action === 'deliver' && a.itemCategory === 'drink') ||
          a.action === 'prioritize_drinks'
        );

      case 'manager':
        // Gerente vê: crítico, urgente, exceções
        return actions.filter(a =>
          a.type === 'critical' ||
          a.type === 'urgent' ||
          a.action === 'resolve'
        );

      case 'owner':
        // Dono não vê ações operacionais
        return [];

      default:
        return actions;
    }
  }

  private prioritize(actions: NowAction[]): NowAction[] {
    // Ordenar por prioridade (maior primeiro)
    return actions.sort((a, b) => b.priority - a.priority);
  }

  private getSilentState(): NowAction {
    return {
      id: 'silent',
      type: 'silent',
      title: 'Tudo em ordem',
      message: null,
      action: null,
      priority: 0,
      timestamp: Date.now()
    };
  }

  private calculateKitchenPressure(preparingCount: number): 'low' | 'medium' | 'high' {
    if (preparingCount > 10) return 'high';
    if (preparingCount > 5) return 'medium';
    return 'low';
  }

  private calculateOverallPressure(
    tables: TableContext[],
    orders: any[],
    items: any[]
  ): PressureContext {
    let score = 0;
    const factors: string[] = [];

    // Mesas ocupadas
    const occupied = tables.filter(t => t.status === 'occupied').length;
    if (occupied > 10) {
      score += 3;
      factors.push('many_tables');
    } else if (occupied > 5) {
      score += 2;
    } else if (occupied > 0) {
      score += 1;
    }

    // KDS saturado
    const preparingCount = items.filter(i => i.status === 'preparing').length;
    if (preparingCount > 10) {
      score += 3;
      factors.push('kitchen_saturated');
    } else if (preparingCount > 5) {
      score += 2;
    }

    // Pagamentos pendentes
    const pending = orders.filter(o => o.status === 'wants_pay').length;
    if (pending > 3) {
      score += 2;
      factors.push('pending_payments');
    } else if (pending > 0) {
      score += 1;
    }

    let overall: 'low' | 'medium' | 'high' = 'low';
    if (score >= 6) overall = 'high';
    else if (score >= 3) overall = 'medium';

    return { overall, factors };
  }

  private subscribeToEvents() {
    if (!this.restaurantId) return;

    this.channel = supabase
      .channel('now_engine_events')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'gm_orders',
        filter: `restaurant_id=eq.${this.restaurantId}`
      }, () => {
        this.recalculate();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'gm_tables',
        filter: `restaurant_id=eq.${this.restaurantId}`
      }, () => {
        this.recalculate();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'gm_order_items',
        filter: `restaurant_id=eq.${this.restaurantId}`
      }, () => {
        this.recalculate();
      })
      .subscribe();
  }

  private emit(action: NowAction | null) {
    this.listeners.forEach(listener => listener(action));
  }

  async completeAction(actionId: string, userId?: string) {
    if (!this.currentAction || this.currentAction.id !== actionId) {
      console.warn('[NowEngine] Action ID mismatch or no current action');
      return;
    }

    const action = this.currentAction;

    // Marcar ação como completada (tracking)
    this.markActionAsCompleted(actionId);

    // FASE 4: Obter userId se não fornecido
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    try {
      // Processar ação baseado no tipo
      switch (action.action) {
        case 'collect_payment':
          if (action.orderId) {
            // Marcar pedido como pago
            await supabase
              .from('gm_orders')
              .update({
                status: 'PAID',
                payment_status: 'paid',
                updated_at: new Date().toISOString()
              })
              .eq('id', action.orderId);

            // Atualizar status da mesa se necessário
            if (action.tableId) {
              await supabase
                .from('gm_tables')
                .update({
                  status: 'free',
                  updated_at: new Date().toISOString()
                })
                .eq('id', action.tableId);
            }
          }
          break;

        case 'deliver':
          if (action.itemId) {
            // Marcar item como entregue
            await supabase
              .from('gm_order_items')
              .update({
                status: 'delivered',
                delivered_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', action.itemId);

            // Se todos os itens do pedido estão entregues, marcar pedido como entregue
            if (action.orderId) {
              const { data: items } = await supabase
                .from('gm_order_items')
                .select('status')
                .eq('order_id', action.orderId);

              const allDelivered = items?.every(item =>
                item.status === 'delivered' || item.status === 'cancelled'
              );

              if (allDelivered) {
                await supabase
                  .from('gm_orders')
                  .update({
                    status: 'DELIVERED',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', action.orderId);
              }
            }
          }
          break;

        case 'resolve':
          if (action.tableId) {
            // Marcar mesa como atendida
            await supabase
              .from('gm_tables')
              .update({
                status: 'occupied',
                updated_at: new Date().toISOString()
              })
              .eq('id', action.tableId);
          }
          break;

        case 'check':
          // Ação de verificação não precisa de persistência
          // Apenas recalcula
          break;

        case 'acknowledge':
          // ERRO-003 Fix: Ação de reconhecimento marca pedido como "visto"
          // Não muda status, mas registra que garçom viu o pedido
          // Isso ajuda o sistema a saber que o pedido foi notificado
          // Por enquanto, apenas recalcula (próxima ação aparece automaticamente)
          // TODO: Adicionar campo "acknowledged_at" em gm_orders se necessário
          break;

        case 'check_kitchen':
        case 'prioritize_drinks':
        case 'routine_clean':
        case 'resolve_error':
          // Ações informativas não precisam de persistência
          // Apenas recalcula
          break;

        default:
          console.warn('[NowEngine] Unknown action type:', action.action);
      }

      // GAMIFICAÇÃO REMOVIDA: Pontos e achievements não devem ser visíveis durante turno
      // IQO permanece silencioso (métricas para gerente, não para funcionário)
      // Se necessário, registrar eventos de qualidade silenciosamente sem feedback ao usuário

      // Recalcular próxima ação após completar (sem debounce para resposta imediata)
      await this.recalculateImmediate();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, {
        action: 'completeAction',
        actionId: action.id,
        actionType: action.type,
        restaurantId: this.restaurantId ?? undefined,
      });
      console.error('[NowEngine] Error completing action:', error);
      throw error;
    }
  }

  // Recalcular imediatamente (sem debounce)
  private async recalculateImmediate() {
    try {
      // Limpar ações completadas antigas
      this.cleanCompletedActions();

      const context = await this.gatherContext();
      const action = this.calculateNowAction(context);

      // Verificar se ação não foi completada recentemente
      if (action && this.isActionRecentlyCompleted(action.id)) {
        // Ação foi completada recentemente, não mostrar
        this.currentAction = null;
        this.emit(null);
        return;
      }

      // Só emitir se ação mudou
      if (action?.id !== this.currentAction?.id) {
        this.currentAction = action;
        this.emit(action);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, {
        action: 'recalculateImmediate',
        restaurantId: this.restaurantId ?? undefined,
      });
      console.error('[NowEngine] Recalculate immediate error:', error);
    }
  }

  // Marcar ação como completada
  private markActionAsCompleted(actionId: string) {
    this.completedActions.set(actionId, Date.now());
  }

  // Verificar se ação foi completada recentemente
  private isActionRecentlyCompleted(actionId: string): boolean {
    const completedAt = this.completedActions.get(actionId);
    if (!completedAt) return false;

    const elapsed = Date.now() - completedAt;
    return elapsed < this.COMPLETED_ACTION_TTL;
  }

  // Limpar ações completadas antigas
  private cleanCompletedActions() {
    const now = Date.now();
    for (const [actionId, timestamp] of this.completedActions.entries()) {
      if (now - timestamp > this.COMPLETED_ACTION_TTL) {
        this.completedActions.delete(actionId);
      }
    }
  }

  // ERRO-008 Fix: Obter contador de ações pendentes
  public async getPendingActionsCount(): Promise<number> {
    try {
      if (!this.context) {
        await this.recalculateImmediate();
      }
      if (!this.context) return 0;

      const allActions = this.calculateAllActions(this.context);
      return allActions.length;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, {
        action: 'getPendingActionsCount',
        restaurantId: this.restaurantId ?? undefined,
      });
      console.error('[NowEngine] Error getting pending count:', error);
      return 0;
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const nowEngine = new NowEngine();
