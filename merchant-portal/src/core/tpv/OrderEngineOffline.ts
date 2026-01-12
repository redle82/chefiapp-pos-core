/**
 * OrderEngineOffline - Wrapper offline-aware para OrderEngine
 * 
 * Garante que OrderEngine.createOrder() funciona completamente offline,
 * usando a fila IndexedDB e sincronizando automaticamente quando volta online.
 * 
 * REGRAS:
 * 1. Se online: chama OrderEngine.createOrder() diretamente
 * 2. Se offline: adiciona à fila IndexedDB (via OfflineSync)
 * 3. Sincronização automática quando volta online
 * 4. Idempotência garantida (não cria pedidos duplicados)
 */

import { OrderEngine, type OrderInput, type Order } from './OrderEngine';
import { OfflineDB } from '../queue/db';
import type { OfflineQueueItem } from '../queue/types';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../logger/Logger';

/**
 * Verifica se está online (network + Supabase)
 */
async function isOnline(): Promise<boolean> {
    // 1. Check network connectivity
    if (!navigator.onLine) {
        return false;
    }

    // 2. Check Supabase connectivity (ping rápido)
    try {
        const { supabase } = await import('../supabase');
        
        // Ping simples (select 1) com timeout curto
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
        
        const { error } = await supabase
            .from('gm_orders')
            .select('id')
            .limit(1)
            .abortSignal(controller.signal);
        
        clearTimeout(timeoutId);
        
        // Se erro é de rede/timeout, está offline
        if (error && (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('aborted'))) {
            return false;
        }
        
        return true;
    } catch (e: any) {
        // Timeout ou erro de rede = offline
        if (e.name === 'AbortError' || e.message?.includes('fetch') || e.message?.includes('network')) {
            return false;
        }
        Logger.warn('Failed to check Supabase connectivity', { error: e });
        return false;
    }
}

/**
 * Cria pedido offline-aware
 * 
 * Se online: chama OrderEngine.createOrder() diretamente
 * Se offline: adiciona à fila IndexedDB para sincronização posterior
 */
export async function createOrderOffline(input: OrderInput): Promise<Order> {
    const online = await isOnline();

    if (online) {
        // ONLINE: Chamar OrderEngine diretamente
        Logger.info('OrderEngineOffline: Online - creating order directly', { 
            restaurantId: input.restaurantId,
            itemsCount: input.items.length 
        });
        
        try {
            return await OrderEngine.createOrder(input);
        } catch (error: any) {
            // Se erro é de rede, tentar offline como fallback
            if (error.message?.includes('fetch') || error.message?.includes('network')) {
                Logger.warn('OrderEngineOffline: Network error, falling back to offline queue', { error });
                return await createOrderOfflineQueue(input);
            }
            throw error;
        }
    } else {
        // OFFLINE: Adicionar à fila
        Logger.info('OrderEngineOffline: Offline - adding to queue', { 
            restaurantId: input.restaurantId,
            itemsCount: input.items.length 
        });
        
        return await createOrderOfflineQueue(input);
    }
}

/**
 * Cria pedido na fila offline (IndexedDB)
 */
async function createOrderOfflineQueue(input: OrderInput): Promise<Order> {
    const localId = uuidv4();
    const now = Date.now();

    // Criar item da fila
    const queueItem: OfflineQueueItem = {
        id: localId,
        type: 'ORDER_CREATE',
        payload: {
            restaurantId: input.restaurantId,
            tableNumber: input.tableNumber,
            tableId: input.tableId,
            operatorId: input.operatorId,
            cashRegisterId: input.cashRegisterId,
            source: input.source || 'tpv',
            items: input.items,
            notes: input.notes,
            localId: localId, // Para idempotência
        },
        status: 'queued',
        createdAt: now,
        attempts: 0,
    };

    // Salvar na fila IndexedDB
    await OfflineDB.put(queueItem);

    Logger.info('OrderEngineOffline: Order added to offline queue', { 
        localId,
        restaurantId: input.restaurantId 
    });

    // Retornar pedido otimista (para UI)
    // NOTA: Este pedido não existe no banco ainda, será criado quando sincronizar
    const totalCents = input.items.reduce((sum, item) => {
        return sum + (item.priceCents * item.quantity);
    }, 0);

    const subtotalCents = totalCents; // Sem taxas por enquanto
    const taxCents = 0;
    const discountCents = 0;

    return {
        id: localId,
        restaurantId: input.restaurantId,
        tableNumber: input.tableNumber,
        tableId: input.tableId,
        status: 'pending' as const, // OrderStatus
        paymentStatus: 'PENDING' as const, // PaymentStatus
        totalCents,
        subtotalCents,
        taxCents,
        discountCents,
        source: input.source || 'tpv',
        operatorId: input.operatorId,
        cashRegisterId: input.cashRegisterId,
        notes: input.notes,
        items: input.items.map(item => ({
            id: uuidv4(),
            orderId: localId,
            productId: item.productId,
            nameSnapshot: item.name || '',
            priceSnapshot: item.priceCents,
            quantity: item.quantity,
            subtotalCents: item.priceCents * item.quantity,
            notes: item.notes,
            modifiers: item.modifiers,
            createdAt: new Date(now),
        })),
        createdAt: new Date(now),
        updatedAt: new Date(now),
    };
}

/**
 * Verifica se pedido já foi sincronizado (idempotência)
 */
export async function checkOrderSynced(localId: string): Promise<string | null> {
    // Buscar na fila por localId
    const items = await OfflineDB.getAll();
    const item = items.find(i => i.id === localId);
    
    if (!item) {
        // Item não está na fila, pode ter sido sincronizado
        // TODO: Verificar no banco se existe pedido com notes contendo localId
        return null;
    }
    
    if (item.status === 'applied') {
        // Item foi sincronizado, buscar ID real do banco
        // TODO: Implementar busca por notes
        return null;
    }
    
    return null;
}
