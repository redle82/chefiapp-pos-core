import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { PersistenceService } from '@/services/persistence';

// =============================================================================
// TYPES
// =============================================================================

export interface OrderItem {
    id: string;
    name: string;
    price: number;
    category: 'food' | 'drink' | 'other';
}

export interface Order {
    id: string;
    table: string;
    items: OrderItem[];
    status: 'pending' | 'preparing' | 'ready' | 'delivered';
    total: number;
    createdAt: Date;
    updatedAt: Date;
}

interface OrderContextType {
    activeTableId: string | null;
    setActiveTable: (id: string | null) => void;
    orderDraft: OrderItem[];
    addToDraft: (item: OrderItem) => void;
    removeFromDraft: (itemId: string) => void;
    clearDraft: () => void;
    submitOrder: () => void;
    orders: Order[];
    updateOrderStatus: (orderId: string, status: Order['status']) => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrder = () => {
    const context = useContext(OrderContext);
    if (!context) {
        throw new Error('useOrder must be used within an OrderProvider');
    }
    return context;
};

// =============================================================================
// PROVIDER
// =============================================================================

export const OrderProvider = ({ children }: { children: ReactNode }) => {
    const [activeTableId, setActiveTableId] = useState<string | null>(null);
    const [orderDraft, setOrderDraft] = useState<OrderItem[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // --- Persistence Logic ---

    // Load from Persistence on Mount
    useEffect(() => {
        const load = async () => {
            const storedOrders = await PersistenceService.loadOrders();
            if (storedOrders) {
                // Hydrate Dates (JSON dates are strings)
                const hydrated = storedOrders.map((o: any) => ({
                    ...o,
                    createdAt: new Date(o.createdAt),
                    updatedAt: new Date(o.updatedAt),
                }));
                setOrders(hydrated);
            }
            setIsLoaded(true);
        };
        load();
    }, []);

    // Save to Persistence on Change
    useEffect(() => {
        if (isLoaded) {
            PersistenceService.saveOrders(orders);
        }
    }, [orders, isLoaded]);

    // --- Order Logic ---

    const addToDraft = (item: OrderItem) => {
        setOrderDraft(prev => [...prev, item]);
    };

    const removeFromDraft = (itemId: string) => {
        setOrderDraft(prev => {
            const index = prev.findIndex(i => i.id === itemId);
            if (index > -1) {
                const newDraft = [...prev];
                newDraft.splice(index, 1);
                return newDraft;
            }
            return prev;
        });
    };

    const clearDraft = () => {
        setOrderDraft([]);
    };

    const submitOrder = () => {
        if (!activeTableId || orderDraft.length === 0) return;

        const newOrder: Order = {
            id: Date.now().toString(),
            table: activeTableId,
            items: [...orderDraft],
            status: 'pending',
            total: orderDraft.reduce((sum, item) => sum + item.price, 0),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        setOrders(prev => [...prev, newOrder]);
        setOrderDraft([]);
        // We keep the table active for convenience
    };

    const updateOrderStatus = (orderId: string, status: Order['status']) => {
        setOrders(prev => prev.map(o =>
            o.id === orderId
                ? { ...o, status, updatedAt: new Date() }
                : o
        ));
    };

    return (
        <OrderContext.Provider value={{
            activeTableId,
            setActiveTable: setActiveTableId,
            orderDraft,
            addToDraft,
            removeFromDraft,
            clearDraft,
            submitOrder,
            orders,
            updateOrderStatus
        }}>
            {children}
        </OrderContext.Provider>
    );
};
