import React, { useEffect, useState } from 'react';
import { Telemetry } from './client';
import { SilentTableDetector, type TrackedTable } from './detectors/silent_table';
import { ForgottenItemDetector, type TrackedItem } from './detectors/forgotten_item';
import { StaffVanishDetector, type TrackedCall } from './detectors/staff_vanish';
import { useOrders, type Order, type OrderItem } from '../../pages/TPV/context/OrderContext';
import { useStaff, type Task } from '../../pages/AppStaff/context/StaffContext';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';

/**
 * GM Bridge Provider (The Scanner)
 * 
 * Runs the Intelligence Loops in the background.
 * Consumes App State -> Feeds Detectors -> Emits Telemetry.
 */

export const GMBridgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { orders } = useOrders();
    const { tasks } = useStaff();

    // Resolve Identity (L4 Truth)
    const [restaurantId, setRestaurantId] = useState<string | null>(getTabIsolated('chefiapp_restaurant_id'));

    // Poll for identity change (e.g. login/logout)
    useEffect(() => {
        const interval = setInterval(() => {
            const current = getTabIsolated('chefiapp_restaurant_id');
            if (current !== restaurantId) setRestaurantId(current);
        }, 2000);
        return () => clearInterval(interval);
    }, [restaurantId]);

    // Loop Config
    const SCAN_INTERVAL_MS = 30 * 1000; // 30s

    useEffect(() => {
        if (restaurantId) {
            Telemetry.initialize(restaurantId);
        }
    }, [restaurantId]);

    useEffect(() => {
        if (!restaurantId) return;

        const interval = setInterval(() => {
            runDetectors();
        }, SCAN_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [orders, tasks, restaurantId]);

    const runDetectors = () => {
        // 1. SILENT TABLE DETECTOR
        // We infer "Active Tables" from Orders that are NOT paid/closed.
        // In a real app, we might have a dedicated useTables hook with lastInteraction.
        // Here we use Order.updatedAt as proxy for interaction.
        orders.forEach((order: Order) => {
            if (['served', 'paid'].includes(order.status)) return; // Ignora mesas fechadas

            const trackedTable: TrackedTable = {
                id: order.tableNumber ? `table-${order.tableNumber}` : `order-${order.id}`,
                status: 'open', // If order is open, table is open
                lastInteractionAt: new Date(order.updatedAt).getTime(),
                orderTotal: order.total
            };

            const risk = SilentTableDetector.check(trackedTable);
            if (risk) {
                Telemetry.emit(risk.type, risk.severity, risk.payload);
            }
        });

        // 2. FORGOTTEN ITEM DETECTOR
        orders.forEach((order: Order) => {
            if (['served', 'paid'].includes(order.status)) return;

            order.items.forEach((item: OrderItem) => {
                // We need item status. OrderContext items are simple objects.
                // If items don't have individual status, we might skip or infer from order.
                // Assuming for now order status applies to all items OR looking for specific fields.
                // If Item doesn't have status, we skip effectively or check implementation plan.
                // PROPOSAL: If order is 'new' for > 10 mins, all items are 'new'.

                const trackedItem: TrackedItem = {
                    id: item.id,
                    orderId: order.id,
                    name: item.name,
                    status: order.status as any, // Inferring item status from order status for MVP
                    updatedAt: new Date(order.updatedAt).getTime()
                };

                const risk = ForgottenItemDetector.check(trackedItem);
                if (risk) {
                    Telemetry.emit(risk.type, risk.severity, risk.payload);
                }
            });
        });

        // 3. STAFF VANISH DETECTOR
        // Iterate over tasks that represent "Calls" (if any)
        tasks.forEach((task: Task) => {
            // Heuristic: High/Critical tasks that are pending > 5min are risks
            if (task.status === 'pending' && task.priority === 'critical') {
                const trackedCall: TrackedCall = {
                    id: task.id,
                    tableId: 'unknown', // Task might not have tableId in meta yet
                    createdAt: task.createdAt,
                    status: 'open',
                    assignedStaffId: task.assigneeRole
                };

                const risk = StaffVanishDetector.check(trackedCall);
                if (risk) {
                    Telemetry.emit(risk.type, risk.severity, risk.payload);
                }
            }
        });
    };

    return <>{children}</>;
};
