/**
 * useContextualSuggestions - Hook para sugestões contextuais inteligentes
 * 
 * Detecta padrões e sugere ações baseadas em:
 * - Estado atual do turno
 * - Tarefas pendentes
 * - Pedidos ativos
 * - Padrões operacionais
 */

import { useEffect, useState, useMemo } from 'react';
import { useStaff } from '../context/StaffContext';
import { useAppStaffOrders } from './useAppStaffOrders';
import { useAppStaffTables } from './useAppStaffTables';

export interface ContextualSuggestion {
    id: string;
    type: 'action' | 'optimization' | 'warning';
    title: string;
    description: string;
    action?: () => void;
    priority: 'low' | 'medium' | 'high';
    icon?: string;
}

export function useContextualSuggestions() {
    const { tasks, activeRole, shiftState, forecast, coreRestaurantId, operationalContract } = useStaff();
    // FASE 3.3: Core API usa UUID (coreRestaurantId quando contrato é local)
    const restaurantIdForCore = coreRestaurantId ?? operationalContract?.id ?? null;
    const { orders: appStaffOrders } = useAppStaffOrders(restaurantIdForCore);
    const { tables: appStaffTables } = useAppStaffTables(restaurantIdForCore);
    // Converter para formato esperado
    const orders = appStaffOrders.map(order => ({
      id: order.id,
      tableId: order.table_id || undefined,
      status: (order.status === 'OPEN' ? 'new' : 
               order.status === 'IN_PREP' ? 'preparing' : 
               order.status === 'READY' ? 'ready' : 
               order.status === 'PAID' ? 'paid' : 
               order.status === 'CANCELLED' ? 'cancelled' : 'new') as 'new' | 'preparing' | 'ready' | 'served' | 'paid' | 'partially_paid' | 'cancelled',
      created_at: order.created_at,
    }));
    const tables = appStaffTables.map(table => ({
      id: table.id,
      number: table.number,
      status: table.status,
    }));
    const [suggestions, setSuggestions] = useState<ContextualSuggestion[]>([]);

    // Analisar contexto e gerar sugestões
    useEffect(() => {
        const newSuggestions: ContextualSuggestion[] = [];

        // SUGESTÃO 1: Muitas tarefas pendentes
        const pendingTasks = tasks.filter(t => t.status === 'pending');
        if (pendingTasks.length > 5) {
            newSuggestions.push({
                id: 'many-tasks',
                type: 'optimization',
                title: 'Muitas tarefas pendentes',
                description: `Você tem ${pendingTasks.length} tarefas pendentes. Considere focar nas mais críticas primeiro.`,
                priority: 'medium',
                icon: '📋',
            });
        }

        // SUGESTÃO 2: Pressão alta detectada
        if (forecast.pressure.level === 'high') {
            newSuggestions.push({
                id: 'high-pressure',
                type: 'warning',
                title: 'Alta pressão detectada',
                description: 'Muitos pedidos ativos. Considere priorizar pedidos mais antigos.',
                priority: 'high',
                icon: '⚠️',
            });
        }

        // SUGESTÃO 3: Mesa sem pedido (para garçons)
        if (activeRole === 'waiter' && tables) {
            const occupiedTables = tables.filter(t => t.status === 'occupied');
            const tablesWithoutOrders = occupiedTables.filter(table => {
                const hasOrder = orders?.some(o => o.tableId === table.id && o.status !== 'paid');
                return !hasOrder;
            });

            if (tablesWithoutOrders.length > 0) {
                newSuggestions.push({
                    id: 'tables-without-orders',
                    type: 'action',
                    title: 'Mesas sem pedido',
                    description: `${tablesWithoutOrders.length} mesa(s) ocupada(s) sem pedido. Verifique se os clientes precisam de atendimento.`,
                    priority: 'high',
                    icon: '🍽️',
                });
            }
        }

        // SUGESTÃO 4: Pedidos aguardando há muito tempo
        if (orders) {
            const now = Date.now();
            const oldOrders = orders.filter(order => {
                const orderAge = now - new Date(order.created_at).getTime();
                return orderAge > 30 * 60 * 1000 && order.status !== 'paid'; // 30 minutos
            });

            if (oldOrders.length > 0) {
                newSuggestions.push({
                    id: 'old-orders',
                    type: 'warning',
                    title: 'Pedidos aguardando',
                    description: `${oldOrders.length} pedido(s) aguardando há mais de 30 minutos. Verifique o status.`,
                    priority: 'high',
                    icon: '⏰',
                });
            }
        }

        // SUGESTÃO 5: Turno começando - boas práticas
        if (shiftState === 'active' && tasks.length === 0 && pendingTasks.length === 0) {
            newSuggestions.push({
                id: 'shift-start',
                type: 'action',
                title: 'Turno iniciado',
                description: 'Seu turno está ativo. Verifique as mesas e pedidos pendentes.',
                priority: 'low',
                icon: '✅',
            });
        }

        // SUGESTÃO 6: Otimização de tempo (se muitas tarefas baixas)
        const lowPriorityTasks = pendingTasks.filter(t => t.priority === 'low');
        if (lowPriorityTasks.length > 3 && pendingTasks.length > 5) {
            newSuggestions.push({
                id: 'optimize-tasks',
                type: 'optimization',
                title: 'Otimizar tarefas',
                description: 'Você tem muitas tarefas de baixa prioridade. Considere agrupá-las ou delegá-las.',
                priority: 'low',
                icon: '⚡',
            });
        }

        setSuggestions(newSuggestions);
    }, [tasks, activeRole, shiftState, forecast, orders, tables]);

    // Ordenar por prioridade
    const sortedSuggestions = useMemo(() => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return [...suggestions].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    }, [suggestions]);

    return { suggestions: sortedSuggestions };
}
