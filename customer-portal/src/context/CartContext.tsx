import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface CartItem {
    id: string; // product_id
    name: string;
    price: number;
    quantity: number;
    notes?: string;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    total: number;
    itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children, slug }: { children: ReactNode; slug: string }) {
    const [items, setItems] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem(`cart-${slug}`);
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem(`cart-${slug}`, JSON.stringify(items));
    }, [items, slug]);

    const addToCart = (newItem: CartItem) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === newItem.id);
            if (existing) {
                return prev.map(i =>
                    i.id === newItem.id
                        ? { ...i, quantity: i.quantity + newItem.quantity }
                        : i
                );
            }
            return [...prev, newItem];
        });
    };

    const removeFromCart = (itemId: string) => {
        setItems(prev => prev.filter(i => i.id !== itemId));
    };

    const clearCart = () => setItems([]);

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total, itemCount }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within CartProvider');
    return context;
}
