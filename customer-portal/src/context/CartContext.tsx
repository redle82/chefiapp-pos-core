import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// --- Types ---

export interface CartItem {
    id: string;        // unique instance id (e.g. uuid) or composite
    productId: string; // reference to menu item
    name: string;
    price_cents: number; // Snapshot of price at addition time
    currency: string;
    qty: number;
    notes?: string;
}

interface CartContextType {
    items: CartItem[];
    totalCents: number;
    addToCart: (product: { id: string; name: string; price_cents: number; currency: string }, qty: number, notes?: string) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, delta: number) => void;
    clearCart: () => void;
    isCartOpen: boolean;
    setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// --- Constants ---

const STORAGE_KEY = 'chefiapp_customer_cart';

// --- Provider ---

interface CartProviderProps {
    children: ReactNode;
    slug: string; // distinct carts per restaurant
}

export function CartProvider({ children, slug }: CartProviderProps) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // 1. Hydrate from LocalStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(`${STORAGE_KEY}_${slug}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setItems(parsed);
                }
            }
        } catch (e) {
            console.error('Failed to load cart from storage', e);
        }
    }, [slug]);

    // 2. Persist to LocalStorage on change
    useEffect(() => {
        try {
            localStorage.setItem(`${STORAGE_KEY}_${slug}`, JSON.stringify(items));
        } catch (e) {
            console.error('Failed to save cart to storage', e);
        }
    }, [items, slug]);

    const totalCents = items.reduce((acc, item) => acc + (item.price_cents * item.qty), 0);

    const addToCart = (product: { id: string; name: string; price_cents: number; currency: string }, qty: number, notes?: string) => {
        setItems(prev => {
            // Check if exact same item exists (could merge if no custom notes, but for now simple)
            const existingIdx = prev.findIndex(i => i.productId === product.id && i.notes === notes);

            if (existingIdx >= 0) {
                const newItems = [...prev];
                newItems[existingIdx].qty += qty;
                return newItems;
            }

            const newItem: CartItem = {
                id: crypto.randomUUID(),
                productId: product.id,
                name: product.name,
                price_cents: product.price_cents,
                currency: product.currency,
                qty,
                notes
            };
            return [...prev, newItem];
        });
    };

    const removeFromCart = (itemId: string) => {
        setItems(prev => prev.filter(i => i.id !== itemId));
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setItems(prev => {
            return prev.map(item => {
                if (item.id === itemId) {
                    const newQty = Math.max(0, item.qty + delta);
                    return { ...item, qty: newQty };
                }
                return item;
            }).filter(item => item.qty > 0);
        });
    };

    const clearCart = () => {
        setItems([]);
    };

    const value = {
        items,
        totalCents,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

// --- Hook ---

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
