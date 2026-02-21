/**
 * useIntegrationBridge — Conecta o sistema de integrações ao Staff/TPV
 * 
 * Este hook:
 * 1. Inicializa o MockDeliveryAdapter
 * 2. Escuta eventos de integração
 * 3. Cria tasks no StaffContext quando pedidos chegam
 * 4. Expõe controles para o DEV panel
 */
// @ts-nocheck


import { useEffect, useCallback, useState } from 'react';
import { 
  IntegrationRegistry, 
  mockDeliveryAdapter,
  type IntegrationEvent,
  type IntegrationInfo,
} from '../../../integrations';
import type { Task } from '../context/StaffCoreTypes';

interface IntegrationBridgeOptions {
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  notifyActivity: () => void;
  enabled?: boolean;
}

interface IntegrationBridgeReturn {
  // State
  integrations: IntegrationInfo[];
  isInitialized: boolean;
  aggregatedStatus: 'ok' | 'degraded' | 'down';
  
  // Mock Controls (DEV)
  simulateOrder: () => void;
  simulateCancel: () => void;
  simulateDelay: () => void;
  simulateFailure: () => void;
  simulateRecovery: () => void;
  
  // Stats
  mockStats: {
    eventCount: number;
    ordersInFlight: number;
    state: string;
    lastEventAt: number | null;
  };
}

// Debounce para não criar tasks duplicadas
const processedOrders = new Set<string>();

export const useIntegrationBridge = ({
  setTasks,
  notifyActivity,
  enabled = true,
}: IntegrationBridgeOptions): IntegrationBridgeReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationInfo[]>([]);
  const [aggregatedStatus, setAggregatedStatus] = useState<'ok' | 'degraded' | 'down'>('ok');
  const [mockStats, setMockStats] = useState({
    eventCount: 0,
    ordersInFlight: 0,
    state: 'disconnected',
    lastEventAt: null as number | null,
  });

  // ───────────────────────────────────────────────────────────
  // EVENT HANDLER — Converte eventos em ações do sistema
  // ───────────────────────────────────────────────────────────
  
  const handleIntegrationEvent = useCallback((event: IntegrationEvent) => {
    if (!event?.payload) {
      console.warn('[IntegrationBridge] Ignoring event without payload:', event);
      return;
    }
    console.log('[IntegrationBridge] 📨 Received:', event.type);

    switch (event.type) {
      case 'order.created': {
        const { orderId, customerName, total, source } = event.payload;
        
        // Dedup
        if (processedOrders.has(orderId)) {
          console.log('[IntegrationBridge] ⏭️ Order already processed:', orderId);
          return;
        }
        processedOrders.add(orderId);
        
        // Criar task para o staff
        const newTask: Task = {
          id: `delivery-${orderId}`,
          type: 'delivery',
          title: `📦 Delivery: ${customerName || 'Cliente'}`,
          description: `Pedido ${orderId} via ${source} - R$${total?.toFixed(2) || '0.00'}`,
          reason: 'Novo pedido de delivery recebido',
          status: 'pending',
          assigneeRole: 'kitchen',
          riskLevel: 60, // Delivery tem prioridade alta
          priority: 'urgent',
          createdAt: Date.now(),
          metadata: {
            orderId,
            source,
            channel: 'delivery',
          },
        };
        
        setTasks(prev => [...prev, newTask]);
        notifyActivity();
        
        console.log('[IntegrationBridge] ✅ Created task for order:', orderId);
        break;
      }
      
      case 'order.updated': {
        const { orderId, newStatus } = event.payload;
        
        if (newStatus === 'cancelled') {
          // Marcar task como cancelada
          setTasks(prev => prev.map(t => 
            t.metadata?.orderId === orderId 
              ? { ...t, status: 'done', title: `❌ ${t.title} (CANCELADO)` }
              : t
          ));
          processedOrders.delete(orderId);
        }
        break;
      }
      
      case 'delivery.status': {
        const { orderId, status, message } = event.payload;
        
        if (status === 'delayed') {
          // Criar task de alerta
          const alertTask: Task = {
            id: `delay-${orderId}-${Date.now()}`,
            type: 'alert',
            title: `⚠️ Atraso: Pedido ${orderId}`,
            description: message || 'Entrega atrasada',
            reason: 'Notificação de atraso do delivery',
            status: 'pending',
            assigneeRole: 'manager',
            riskLevel: 70,
            priority: 'urgent',
            createdAt: Date.now(),
            metadata: { orderId, alertType: 'delay' },
          };
          
          setTasks(prev => [...prev, alertTask]);
          notifyActivity();
        }
        break;
      }
    }
    
    // Update stats
    setMockStats(mockDeliveryAdapter.getStats());
  }, [setTasks, notifyActivity]);

  // ───────────────────────────────────────────────────────────
  // INITIALIZATION
  // ───────────────────────────────────────────────────────────
  
  useEffect(() => {
    if (!enabled) return;
    
    const init = async () => {
      try {
        // Wire up event callback
        mockDeliveryAdapter.setEventCallback(handleIntegrationEvent);
        
        // Register adapter
        await IntegrationRegistry.register(mockDeliveryAdapter);
        
        // Initial health check
        await IntegrationRegistry.healthCheckAll();
        
        setIsInitialized(true);
        setIntegrations(IntegrationRegistry.getInfo());
        setAggregatedStatus(IntegrationRegistry.getAggregatedStatus());
        setMockStats(mockDeliveryAdapter.getStats());
        
        console.log('[IntegrationBridge] ✅ Initialized');
      } catch (err) {
        console.error('[IntegrationBridge] ❌ Failed to initialize:', err);
      }
    };
    
    init();
    
    // Periodic health check
    const healthInterval = setInterval(async () => {
      await IntegrationRegistry.healthCheckAll();
      setIntegrations(IntegrationRegistry.getInfo());
      setAggregatedStatus(IntegrationRegistry.getAggregatedStatus());
      setMockStats(mockDeliveryAdapter.getStats());
    }, 30000); // 30s
    
    return () => {
      clearInterval(healthInterval);
      // Don't unregister on unmount - keep running
    };
  }, [enabled, handleIntegrationEvent]);

  // ───────────────────────────────────────────────────────────
  // DEV CONTROLS
  // ───────────────────────────────────────────────────────────
  
  const simulateOrder = useCallback(() => {
    mockDeliveryAdapter.simulateNewOrder();
    setMockStats(mockDeliveryAdapter.getStats());
  }, []);
  
  const simulateCancel = useCallback(() => {
    mockDeliveryAdapter.simulateCancelOrder();
    setMockStats(mockDeliveryAdapter.getStats());
  }, []);
  
  const simulateDelay = useCallback(() => {
    mockDeliveryAdapter.simulateDeliveryDelay();
    setMockStats(mockDeliveryAdapter.getStats());
  }, []);
  
  const simulateFailure = useCallback(() => {
    mockDeliveryAdapter.simulateFailure();
    setMockStats(mockDeliveryAdapter.getStats());
    setAggregatedStatus('down');
  }, []);
  
  const simulateRecovery = useCallback(() => {
    mockDeliveryAdapter.recover();
    setMockStats(mockDeliveryAdapter.getStats());
    setAggregatedStatus('ok');
  }, []);

  return {
    integrations,
    isInitialized,
    aggregatedStatus,
    simulateOrder,
    simulateCancel,
    simulateDelay,
    simulateFailure,
    simulateRecovery,
    mockStats,
  };
};
