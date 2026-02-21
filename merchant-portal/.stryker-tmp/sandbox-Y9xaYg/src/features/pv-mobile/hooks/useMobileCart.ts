/**
 * useMobileCart — Simplified cart hook for PV Mobile
 *
 * Wraps createOrderLifecycle and useOperationalStore with a mobile-friendly API.
 * Handles: add/remove/update items, totals, send to kitchen, payment method.
 *
 * @example
 * const { cart, addProduct, sendToKitchen, total, paymentMethod } = useMobileCart(restaurantId);
 */

import { useCallback, useMemo, useState } from "react";
import { createOrderLifecycle } from "../../../core/operational/processOrderLifecycle";
import { useOperationalStore } from "../../../core/operational/useOperationalStore";
import type { OrderMode } from "../../../pages/TPVMinimal/components/OrderModeSelector";
import type { PaymentMethod } from "../components/PaymentMethodSelector";

export interface MobileCartItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number; // cents
  image_url?: string | null;
  category_name?: string;
  modifiers?: Array<{
    groupId: string;
    groupName: string;
    modifierId: string;
    name: string;
    priceDeltaCents: number;
  }>;
}

export interface MobileCartProduct {
  id: string;
  name: string;
  price_cents: number;
  image_url?: string | null;
  category_name?: string;
  modifiers?: Array<{
    groupId: string;
    groupName: string;
    modifierId: string;
    name: string;
    priceDeltaCents: number;
  }>;
}

export interface SelectedTable {
  id: string;
  number: number;
}

interface UseMobileCartReturn {
  // Cart state
  cart: MobileCartItem[];
  itemCount: number;
  subtotal: number; // cents
  tax: number; // cents
  total: number; // cents
  orderMode: OrderMode;
  isSending: boolean;
  isSentToKitchen: boolean;
  selectedTable: SelectedTable | null;
  paymentMethod: PaymentMethod | null;

  // Actions
  addProduct: (product: MobileCartProduct) => void;
  removeProduct: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemModifiers?: (
    productId: string,
    newModifiers: Array<{
      groupId: string;
      groupName: string;
      modifierId: string;
      name: string;
      priceDeltaCents: number;
    }>,
  ) => void;
  setOrderMode: (mode: OrderMode) => void;
  setTable: (table: SelectedTable) => void;
  clearTable: () => void;
  setPaymentMethod: (method: PaymentMethod | null) => void;
  clearCart: () => void;
  sendToKitchen: (paymentMethod?: PaymentMethod) => Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
  }>;
  confirmAndPay: () => Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
  }>;
}

const TAX_RATE = 0.05; // 5% tax (simplified, will use VAT engine later)

export function useMobileCart(restaurantId: string): UseMobileCartReturn {
  const [cart, setCart] = useState<MobileCartItem[]>([]);
  const [orderMode, setOrderMode] = useState<OrderMode>("take_away");
  const [selectedTable, setSelectedTable] = useState<SelectedTable | null>(
    null,
  );
  const [isSending, setIsSending] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );

  // Table selection for Dine In
  const setTable = useCallback((table: SelectedTable) => {
    setSelectedTable(table);
  }, []);

  const clearTable = useCallback(() => {
    setSelectedTable(null);
  }, []);

  // Order lifecycle orchestrator
  const lifecycle = useMemo(() => createOrderLifecycle(), []);

  // Backend order status
  const currentOrderStatus = useOperationalStore((s) => s.currentOrder.status);
  const isSentToKitchen = currentOrderStatus === "SENT";

  // Calculations
  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
    [cart],
  );

  const tax = useMemo(() => Math.round(subtotal * TAX_RATE), [subtotal]);

  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  // Add product to cart
  const addProduct = useCallback(
    (product: MobileCartProduct) => {
      // Start order if first item
      if (cart.length === 0) {
        lifecycle.startOrder(orderMode);
      }

      // Calculate price with modifiers
      const modifierPrice =
        product.modifiers?.reduce((sum, mod) => sum + mod.priceDeltaCents, 0) ??
        0;
      const finalPrice = product.price_cents + modifierPrice;

      // Reserve operational stock
      lifecycle.addItem({
        id: product.id,
        name: product.name,
        priceCents: finalPrice,
        costCents: Math.round(finalPrice * 0.35), // estimated cost
      });

      setCart((prev) => {
        // Use modifiers as part of unique key (if modifiers differ, treat as separate item)
        const modifierKey = product.modifiers
          ? JSON.stringify(
              product.modifiers.map((m) => ({
                id: m.modifierId,
                name: m.name,
              })),
            )
          : "";
        const itemKey = `${product.id}|${modifierKey}`;

        const existing = prev.find((i) => {
          const existingModifierKey = i.modifiers
            ? JSON.stringify(
                i.modifiers.map((m) => ({ id: m.modifierId, name: m.name })),
              )
            : "";
          return `${i.product_id}|${existingModifierKey}` === itemKey;
        });

        if (existing) {
          return prev.map((i) => {
            const i_mod_key = i.modifiers
              ? JSON.stringify(
                  i.modifiers.map((m) => ({ id: m.modifierId, name: m.name })),
                )
              : "";
            return `${i.product_id}|${i_mod_key}` === itemKey
              ? { ...i, quantity: i.quantity + 1 }
              : i;
          });
        }
        return [
          ...prev,
          {
            product_id: product.id,
            name: product.name,
            quantity: 1,
            unit_price: finalPrice,
            image_url: product.image_url,
            category_name: product.category_name,
            modifiers: product.modifiers,
          },
        ];
      });
    },
    [cart.length, lifecycle, orderMode],
  );

  // Remove product from cart
  const removeProduct = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  // Update quantity
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.product_id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity } : i)),
    );
  }, []);

  // Phase 5: Update item modifiers (with inline editing)
  const updateItemModifiers = useCallback(
    (
      productId: string,
      newModifiers: Array<{
        groupId: string;
        groupName: string;
        modifierId: string;
        name: string;
        priceDeltaCents: number;
      }>,
    ) => {
      setCart((prev) =>
        prev.map((item) => {
          if (item.product_id !== productId) return item;

          // Calculate new price with new modifiers
          const modifierPrice = newModifiers.reduce(
            (sum, mod) => sum + mod.priceDeltaCents,
            0,
          );

          // Get base price from current item (without old modifier deltas)
          const oldModifierPrice = (item.modifiers || []).reduce(
            (sum, mod) => sum + mod.priceDeltaCents,
            0,
          );
          const basePrice = item.unit_price - oldModifierPrice;
          const newPrice = basePrice + modifierPrice;

          return {
            ...item,
            unit_price: newPrice,
            modifiers: newModifiers,
          };
        }),
      );
    },
    [],
  );

  // Clear cart
  const clearCart = useCallback(async () => {
    setCart([]);
    await lifecycle.cancelOrder(restaurantId);
  }, [lifecycle, restaurantId]);

  // Send to kitchen
  const sendToKitchen = useCallback(
    async (paymentMethod?: PaymentMethod) => {
      if (cart.length === 0) {
        return { success: false, error: "Carrinho vazio" };
      }
      setIsSending(true);
      try {
        const result = await lifecycle.sendToKitchen(restaurantId);
        // Phase 6: Store payment method if provided
        if (paymentMethod) {
          // TODO: Attach payment method to order in backend
          console.log("Payment method selected:", paymentMethod);
        }
        return result;
      } finally {
        setIsSending(false);
      }
    },
    [cart.length, lifecycle, restaurantId],
  );

  // Confirm and pay (takeaway shortcut)
  const confirmAndPay = useCallback(async () => {
    if (cart.length === 0 && !isSentToKitchen) {
      return { success: false, error: "Carrinho vazio" };
    }
    setIsSending(true);
    try {
      let result;
      if (isSentToKitchen) {
        result = await lifecycle.finalizeOrder(restaurantId, total);
      } else {
        result = await lifecycle.confirmAndPay(restaurantId, "cash");
      }
      if (result.success) {
        setCart([]);
      }
      return result;
    } finally {
      setIsSending(false);
    }
  }, [cart.length, isSentToKitchen, lifecycle, restaurantId, total]);

  return {
    cart,
    itemCount,
    subtotal,
    tax,
    total,
    orderMode,
    isSending,
    isSentToKitchen,
    selectedTable,
    paymentMethod,
    addProduct,
    removeProduct,
    updateQuantity,
    updateItemModifiers,
    setOrderMode,
    setTable,
    clearTable,
    setPaymentMethod,
    clearCart,
    sendToKitchen,
    confirmAndPay,
  };
}
