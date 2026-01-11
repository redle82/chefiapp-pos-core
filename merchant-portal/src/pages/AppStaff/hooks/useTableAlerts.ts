/**
 * useTableAlerts - Hook para alertas automáticos de mesas
 * 
 * Detecta:
 * - Mesa sem pedido há X minutos
 * - Mesa com pedido há muito tempo
 * - Mesa precisa de atenção
 */

import { useEffect, useState } from 'react';
import { useTables } from '../../TPV/context/TableContext';
import { useOrders } from '../../TPV/context/OrderContextReal';
import { useStaff } from '../context/StaffContext';
import type { Task } from '../context/StaffCoreTypes';

interface TableAlert {
    tableId: string;
    tableNumber: number;
    type: 'no_order' | 'long_wait' | 'needs_attention';
    message: string;
    severity: 'warning' | 'error';
    minutes: number;
}

const NO_ORDER_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutos
const LONG_WAIT_THRESHOLD_MS = 45 * 60 * 1000; // 45 minutos

export function useTableAlerts() {
    const { tables } = useTables();
    const { orders } = useOrders();
    const { createTask, tasks } = useStaff();
    const [alerts, setAlerts] = useState<TableAlert[]>([]);

    useEffect(() => {
        if (!tables || !orders) return;

        const newAlerts: TableAlert[] = [];
        const now = Date.now();

        // Verificar cada mesa
        for (const table of tables) {
            if (table.status !== 'occupied') continue;

            // Buscar pedidos ativos da mesa
            const tableOrders = orders.filter(
                o => o.tableId === table.id && o.status !== 'paid' && o.status !== 'cancelled'
            );

            // ALERTA 1: Mesa sem pedido há muito tempo
            if (tableOrders.length === 0) {
                const lastOrderTime = table.lastOrderAt 
                    ? new Date(table.lastOrderAt).getTime()
                    : table.occupiedAt 
                        ? new Date(table.occupiedAt).getTime()
                        : null;

                if (lastOrderTime) {
                    const minutesWithoutOrder = (now - lastOrderTime) / (60 * 1000);
                    
                    if (minutesWithoutOrder >= 20) {
                        newAlerts.push({
                            tableId: table.id,
                            tableNumber: table.number,
                            type: 'no_order',
                            message: `Mesa ${table.number} sem pedido há ${Math.floor(minutesWithoutOrder)} minutos`,
                            severity: minutesWithoutOrder >= 30 ? 'error' : 'warning',
                            minutes: Math.floor(minutesWithoutOrder),
                        });
                    }
                }
            }

            // ALERTA 2: Mesa com pedido há muito tempo (não pago)
            if (tableOrders.length > 0) {
                const oldestOrder = tableOrders.reduce((oldest, order) => {
                    const orderTime = new Date(order.created_at).getTime();
                    const oldestTime = oldest ? new Date(oldest.created_at).getTime() : 0;
                    return orderTime < oldestTime ? order : oldest;
                }, null as any);

                if (oldestOrder) {
                    const orderAge = (now - new Date(oldestOrder.created_at).getTime()) / (60 * 1000);
                    
                    if (orderAge >= 45) {
                        newAlerts.push({
                            tableId: table.id,
                            tableNumber: table.number,
                            type: 'long_wait',
                            message: `Mesa ${table.number} com pedido há ${Math.floor(orderAge)} minutos`,
                            severity: orderAge >= 60 ? 'error' : 'warning',
                            minutes: Math.floor(orderAge),
                        });
                    }
                }
            }
        }

        setAlerts(newAlerts);

        // Criar tarefas para alertas críticos
        for (const alert of newAlerts) {
            if (alert.severity === 'error') {
                // Verificar se já existe tarefa para esta mesa
                const existingTask = tasks.find(
                    t => t.metadata?.tableId === alert.tableId && 
                         t.metadata?.alertType === alert.type &&
                         t.status !== 'done'
                );

                if (!existingTask) {
                    createTask({
                        title: alert.message,
                        description: `Atenção necessária na mesa ${alert.tableNumber}`,
                        priority: 'critical',
                        role: 'waiter',
                        metadata: {
                            tableId: alert.tableId,
                            tableNumber: alert.tableNumber,
                            alertType: alert.type,
                            minutes: alert.minutes,
                        },
                    });
                }
            }
        }
    }, [tables, orders, createTask, tasks]);

    return { alerts };
}
