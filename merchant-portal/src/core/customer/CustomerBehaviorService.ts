/**
 * P5-3: Customer Behavior Service
 * 
 * Serviço para análise de comportamento de clientes
 */

import { supabase } from '../supabase';
import { Logger } from '../logger';

export interface CustomerSegment {
    id: string;
    name: string;
    criteria: string;
    customerCount: number;
    averageOrderValue: number;
    visitFrequency: number;
}

export interface CustomerProfile {
    customerId: string;
    name: string;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastVisit: Date;
    favoriteItems: string[];
    segment: string;
    lifetimeValue: number;
}

export interface PurchasePattern {
    customerId: string;
    dayOfWeek: number[];
    timeOfDay: number[];
    averageOrderValue: number;
    preferredItems: string[];
}

class CustomerBehaviorService {
    /**
     * Analyze customer behavior patterns
     */
    async analyzeCustomerBehavior(restaurantId: string): Promise<CustomerProfile[]> {
        try {
            // Get orders with customer info
            const { data: orders, error } = await supabase
                .from('gm_orders')
                .select(`
                    id,
                    customer_id,
                    total_cents,
                    created_at,
                    items:gm_order_items(product_id, product_name)
                `)
                .eq('restaurant_id', restaurantId)
                .not('customer_id', 'is', null);

            if (error) throw error;

            // Group by customer
            const customerMap = new Map<string, {
                orders: any[];
                totalSpent: number;
            }>();

            for (const order of orders || []) {
                const customerId = order.customer_id;
                if (!customerId) continue;

                if (!customerMap.has(customerId)) {
                    customerMap.set(customerId, { orders: [], totalSpent: 0 });
                }

                const customer = customerMap.get(customerId)!;
                customer.orders.push(order);
                customer.totalSpent += order.total_cents;
            }

            // Build profiles
            const profiles: CustomerProfile[] = [];

            for (const [customerId, data] of customerMap.entries()) {
                const totalOrders = data.orders.length;
                const averageOrderValue = totalOrders > 0 ? data.totalSpent / totalOrders : 0;
                const lastOrder = data.orders.sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0];

                // Get favorite items
                const itemCounts = new Map<string, number>();
                for (const order of data.orders) {
                    for (const item of order.items || []) {
                        const itemId = item.product_id;
                        itemCounts.set(itemId, (itemCounts.get(itemId) || 0) + 1);
                    }
                }
                const favoriteItems = Array.from(itemCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([id]) => id);

                // Determine segment
                let segment = 'casual';
                if (totalOrders > 10 && averageOrderValue > 5000) {
                    segment = 'vip';
                } else if (totalOrders > 5) {
                    segment = 'regular';
                }

                profiles.push({
                    customerId,
                    name: `Customer ${customerId.slice(0, 8)}`,
                    totalOrders,
                    totalSpent: data.totalSpent,
                    averageOrderValue,
                    lastVisit: new Date(lastOrder.created_at),
                    favoriteItems,
                    segment,
                    lifetimeValue: data.totalSpent,
                });
            }

            return profiles.sort((a, b) => b.lifetimeValue - a.lifetimeValue);
        } catch (err) {
            Logger.error('Failed to analyze customer behavior', err, { restaurantId });
            return [];
        }
    }

    /**
     * Segment customers
     */
    async segmentCustomers(restaurantId: string): Promise<CustomerSegment[]> {
        const profiles = await this.analyzeCustomerBehavior(restaurantId);

        const segments: CustomerSegment[] = [
            {
                id: 'vip',
                name: 'VIP Customers',
                criteria: '10+ orders, high average order value',
                customerCount: profiles.filter(p => p.segment === 'vip').length,
                averageOrderValue: profiles.filter(p => p.segment === 'vip').reduce((sum, p) => sum + p.averageOrderValue, 0) / Math.max(1, profiles.filter(p => p.segment === 'vip').length),
                visitFrequency: 12, // Estimated
            },
            {
                id: 'regular',
                name: 'Regular Customers',
                criteria: '5-10 orders',
                customerCount: profiles.filter(p => p.segment === 'regular').length,
                averageOrderValue: profiles.filter(p => p.segment === 'regular').reduce((sum, p) => sum + p.averageOrderValue, 0) / Math.max(1, profiles.filter(p => p.segment === 'regular').length),
                visitFrequency: 6,
            },
            {
                id: 'casual',
                name: 'Casual Customers',
                criteria: '1-5 orders',
                customerCount: profiles.filter(p => p.segment === 'casual').length,
                averageOrderValue: profiles.filter(p => p.segment === 'casual').reduce((sum, p) => sum + p.averageOrderValue, 0) / Math.max(1, profiles.filter(p => p.segment === 'casual').length),
                visitFrequency: 2,
            },
        ];

        return segments;
    }

    /**
     * Get purchase patterns
     */
    async getPurchasePatterns(restaurantId: string, customerId: string): Promise<PurchasePattern | null> {
        try {
            const { data: orders } = await supabase
                .from('gm_orders')
                .select('created_at, total_cents, items:gm_order_items(product_id)')
                .eq('restaurant_id', restaurantId)
                .eq('customer_id', customerId);

            if (!orders || orders.length === 0) return null;

            const dayOfWeek: number[] = [];
            const timeOfDay: number[] = [];
            const itemCounts = new Map<string, number>();

            for (const order of orders) {
                const date = new Date(order.created_at);
                dayOfWeek.push(date.getDay());
                timeOfDay.push(date.getHours());

                for (const item of order.items || []) {
                    itemCounts.set(item.product_id, (itemCounts.get(item.product_id) || 0) + 1);
                }
            }

            const averageOrderValue = orders.reduce((sum, o) => sum + o.total_cents, 0) / orders.length;
            const preferredItems = Array.from(itemCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([id]) => id);

            return {
                customerId,
                dayOfWeek: [...new Set(dayOfWeek)],
                timeOfDay: [...new Set(timeOfDay)],
                averageOrderValue,
                preferredItems,
            };
        } catch (err) {
            Logger.error('Failed to get purchase patterns', err, { restaurantId, customerId });
            return null;
        }
    }
}

export const customerBehaviorService = new CustomerBehaviorService();
