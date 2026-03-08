import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { currencyService } from "../../core/currency/CurrencyService";
import {
  getTabIsolated,
  removeTabIsolated,
  setTabIsolated,
} from "../../core/storage/TabIsolatedStorage";

// --- Types ---

export interface CartItem {
  id: string; // instance id
  productId: string;
  name: string;
  price: number; // Changed from price_cents to price (euros) to match ProductContext
  currency: string;
  qty: number;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  total: number;
  addToCart: (
    product: { id: string; name: string; price: number; currency?: string },
    qty: number,
    notes?: string,
  ) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  slug: string;
  tableNumber?: number; // ERRO-021 Fix: Número da mesa
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// --- Constants ---

const STORAGE_KEY = "chefiapp_public_cart";
const CART_TTL = 24 * 60 * 60 * 1000; // ERRO-011 Fix: 24 horas

// --- Provider ---

interface CartProviderProps {
  children: ReactNode;
  slug: string; // distinct carts per restaurant
  tableNumber?: number; // ERRO-021 Fix: Número da mesa da URL
}

export function CartProvider({
  children,
  slug,
  tableNumber,
}: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 1. Hydrate
  // ERRO-011 Fix: Restaurar carrinho com TTL
  useEffect(() => {
    try {
      const stored = getTabIsolated(`${STORAGE_KEY}_${slug}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // ERRO-011 Fix: Verificar se tem timestamp e se ainda é válido
        if (parsed.timestamp && parsed.items) {
          const elapsed = Date.now() - parsed.timestamp;
          if (elapsed < CART_TTL) {
            // Carrinho ainda válido
            if (Array.isArray(parsed.items)) {
              setItems(parsed.items);
              // ERRO-011 Fix: Mostrar banner se houver itens restaurados
              if (parsed.items.length > 0) {
                // Banner será mostrado no CartDrawer se necessário
              }
            }
          } else {
            // Carrinho expirado, limpar
            removeTabIsolated(`${STORAGE_KEY}_${slug}`);
          }
        } else if (Array.isArray(parsed)) {
          // Formato antigo (sem timestamp), migrar
          setItems(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load cart", e);
    }
  }, [slug]);

  // 2. Persist
  // ERRO-011 Fix: Salvar com timestamp para TTL
  useEffect(() => {
    try {
      if (items.length > 0) {
        // ERRO-011 Fix: Salvar com timestamp
        const cartData = {
          items,
          timestamp: Date.now(),
        };
        setTabIsolated(`${STORAGE_KEY}_${slug}`, JSON.stringify(cartData));
      } else {
        // Limpar se carrinho vazio
        removeTabIsolated(`${STORAGE_KEY}_${slug}`);
      }
    } catch (e) {
      console.error("Failed to save cart", e);
    }
  }, [items, slug]);

  const total = items.reduce((acc, item) => acc + item.price * item.qty, 0);

  const addToCart = (
    product: { id: string; name: string; price: number; currency?: string },
    qty: number,
    notes?: string,
  ) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productId === product.id && i.notes === notes,
      );

      if (existingIdx >= 0) {
        const newItems = [...prev];
        newItems[existingIdx].qty += qty;
        return newItems;
      }

      const newItem: CartItem = {
        id: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency || currencyService.getDefaultCurrency(),
        qty,
        notes,
      };
      return [...prev, newItem];
    });
    setIsCartOpen(true); // Auto open
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = Math.max(0, item.qty + delta);
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0);
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        slug, // Expose for consumers (Orders Service)
        tableNumber, // ERRO-021 Fix: Expor número da mesa
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
