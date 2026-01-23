import { useEffect, useRef } from 'react';
import { useOrder } from '@/context/OrderContext';
import { useAppStaff } from '@/context/AppStaffContext';

const CHECK_INTERVAL = 60000; // 1 minute
const THRESHOLD_LATE_ORDER_MINUTES = 20;
const THRESHOLD_FORGOTTEN_TABLE_MINUTES = 15;

export function useQualityMonitor() {
    const { orders, activeTableId } = useOrder();
    const { recordQualityEvent, activeRole, shiftState } = useAppStaff();

    // Track reported incidents to prevent duplicate logs per session
    // Map<EntityID, Set<EventType>>
    const reportedIncidents = useRef<Map<string, Set<string>>>(new Map());

    useEffect(() => {
        if (shiftState !== 'active') return;

        const interval = setInterval(() => {
            checkLateOrders();
        }, CHECK_INTERVAL);

        return () => clearInterval(interval);
    }, [orders, shiftState]);

    const checkLateOrders = () => {
        const now = Date.now();

        orders.forEach(order => {
            // Check LATE ORDER (Kitchen Ticket > 20m)
            if (['pending', 'preparing'].includes(order.status)) {
                const elapsedMinutes = (now - new Date(order.createdAt).getTime()) / 60000;

                if (elapsedMinutes > THRESHOLD_LATE_ORDER_MINUTES) {
                    logOnce(order.id, 'ORDER_LATE', -5, {
                        order_id: order.id,
                        elapsed_minutes: Math.round(elapsedMinutes),
                        table: order.table
                    });
                }
            }
        });
    };

    const logOnce = (entityId: string, type: string, score: number, metadata: any) => {
        if (!reportedIncidents.current.has(entityId)) {
            reportedIncidents.current.set(entityId, new Set());
        }

        if (!reportedIncidents.current.get(entityId)?.has(type)) {
            recordQualityEvent(type, score, metadata);
            reportedIncidents.current.get(entityId)?.add(type);
        }
    };

    // Logic for other monitors (Table Forgotten etc) can be added here
}
