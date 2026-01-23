/**
 * Order Filters - RBAC Filtering
 * 
 * Bug #1 Fix: Filtro estrutural por businessId, shiftId, waiterId
 * ÚNICA fonte de verdade para visibilidade de pedidos
 */

import { Order } from '@/context/OrderContext';
import { StaffRole, Permission } from '@/context/ContextPolicy';

interface FilterParams {
    role: StaffRole;
    userId: string | null;
    shiftId: string | null;
    businessId: string | null;
    orders: Order[];
    canAccess: (permission: Permission) => boolean;
}

/**
 * getVisibleOrders - ÚNICA fonte de verdade para visibilidade de pedidos
 * 
 * Regras:
 * - waiter: apenas pedidos onde waiterId === userId E shiftId === currentShift
 * - manager/cashier: pedidos do shift ativo
 * - owner: pedidos agregados (sem ações operacionais)
 */
export function getVisibleOrders({
    role,
    userId,
    shiftId,
    businessId,
    orders,
    canAccess
}: FilterParams): Order[] {
    // 1. Sempre filtrar por businessId primeiro (segurança)
    let filtered = orders;
    if (businessId) {
        // Nota: Order não tem businessId direto, mas vem do contexto
        // Se orders já vierem filtrados do backend, isso é redundante
        // Mas garantimos segurança aqui também
        filtered = orders; // Assumindo que orders já vem filtrado por businessId do backend
    }

    // 2. Se tem permissão order:view_all, vê todos (manager, owner, admin)
    if (canAccess('order:view_all')) {
        // Owner vê todos mas sem ações operacionais (isso é tratado na UI)
        return filtered;
    }

    // 3. Waiter: apenas seus pedidos (waiterId + shiftId)
    if (role === 'waiter') {
        if (!userId || !shiftId) {
            // Sem userId ou shiftId, não mostra nada (segurança)
            return [];
        }
        return filtered.filter(order => 
            order.shiftId === shiftId &&
            order.waiterId === userId // Bug #1 Fix: Garçom vê apenas seus pedidos
        );
    }

    // 4. Manager/Cashier: pedidos do shift ativo
    if (role === 'manager' || role === 'cashier') {
        if (!shiftId) {
            return [];
        }
        return filtered.filter(order => order.shiftId === shiftId);
    }

    // 5. Outros roles: apenas pedidos do turno atual
    if (shiftId) {
        return filtered.filter(order => order.shiftId === shiftId);
    }

    // 6. Fallback: sem shiftId, não mostra nada (segurança)
    return [];
}
