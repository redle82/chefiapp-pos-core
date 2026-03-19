/**
 * useCustomerOrder -- Hook for customer self-service ordering via QR code.
 *
 * Fetches the public menu (no auth required), manages cart state,
 * and submits orders via the atomic RPC.
 *
 * Data: gm_menu_categories + gm_products filtered by restaurant_id and available=true.
 * Also fetches restaurant identity (name, logo) for the header.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { dockerCoreClient } from "../../infra/docker-core/connection";

// ─── Types ───

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  categoryId: string | null;
  photoUrl: string | null;
  available: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface RestaurantInfo {
  name: string;
  logoUrl: string | null;
}

interface UseCustomerOrderReturn {
  restaurant: RestaurantInfo;
  menu: { categories: Category[]; products: Product[] };
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  cartTotal: number;
  cartItemCount: number;
  notes: string;
  setNotes: (notes: string) => void;
  submitOrder: () => Promise<{ success: boolean; orderId?: string }>;
  submitting: boolean;
  orderSubmitted: boolean;
  submittedOrderId: string | null;
  resetOrder: () => void;
  loading: boolean;
  error: string | null;
}

// ─── Data fetching (public, no auth) ───

async function fetchRestaurantInfo(
  restaurantId: string,
): Promise<RestaurantInfo> {
  const { data, error } = await dockerCoreClient
    .from("gm_restaurants")
    .select("name, commercial_name, display_name, logo_url")
    .eq("id", restaurantId)
    .maybeSingle();

  if (error || !data) return { name: "Menu", logoUrl: null };

  const row = data as Record<string, unknown>;
  const name =
    (row.commercial_name as string) ||
    (row.display_name as string) ||
    (row.name as string) ||
    "Menu";
  return {
    name,
    logoUrl: (row.logo_url as string) ?? null,
  };
}

async function fetchCategories(restaurantId: string): Promise<Category[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_menu_categories")
    .select("id, name, sort_order")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return (data as { id: string; name: string; sort_order: number }[]).map(
    (c) => ({
      id: c.id,
      name: c.name,
      sortOrder: c.sort_order ?? 0,
    }),
  );
}

async function fetchProducts(restaurantId: string): Promise<Product[]> {
  const { data, error } = await dockerCoreClient
    .from("gm_products")
    .select(
      "id, name, description, price_cents, category_id, photo_url, available, gm_product_assets(image_url)",
    )
    .eq("restaurant_id", restaurantId)
    .eq("available", true)
    .order("name", { ascending: true });

  if (error || !data) return [];

  return (data as any[]).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    priceCents: p.price_cents ?? 0,
    categoryId: p.category_id ?? null,
    photoUrl: p.gm_product_assets?.image_url ?? p.photo_url ?? null,
    available: p.available !== false,
  }));
}

// ─── Hook ───

export function useCustomerOrder(
  restaurantId: string,
  tableNumber?: number,
): UseCustomerOrderReturn {
  const [restaurant, setRestaurant] = useState<RestaurantInfo>({
    name: "Menu",
    logoUrl: null,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Fetch restaurant info + menu on mount
  useEffect(() => {
    mountedRef.current = true;
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [info, cats, prods] = await Promise.all([
          fetchRestaurantInfo(restaurantId),
          fetchCategories(restaurantId),
          fetchProducts(restaurantId),
        ]);
        if (!mountedRef.current) return;
        setRestaurant(info);
        setCategories(cats);
        setProducts(prods);
        setError(null);
      } catch (err) {
        if (!mountedRef.current) return;
        console.error("[useCustomerOrder] menu fetch failed", err);
        setError("Erro ao carregar o menu. Tente novamente.");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    load();
    return () => {
      mountedRef.current = false;
    };
  }, [restaurantId]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.product.id === product.id);
      if (existing) {
        return prev.map((ci) =>
          ci.product.id === product.id
            ? { ...ci, quantity: ci.quantity + quantity }
            : ci,
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((ci) => ci.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((ci) => ci.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((ci) =>
        ci.product.id === productId ? { ...ci, quantity } : ci,
      ),
    );
  }, []);

  const cartTotal = cart.reduce(
    (sum, ci) => sum + ci.product.priceCents * ci.quantity,
    0,
  );

  const cartItemCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);

  const submitOrder = useCallback(async (): Promise<{
    success: boolean;
    orderId?: string;
  }> => {
    if (cart.length === 0) return { success: false };
    setSubmitting(true);
    setError(null);

    try {
      const rpcItems = cart.map((ci) => ({
        product_id: ci.product.id,
        name: ci.product.name,
        quantity: ci.quantity,
        unit_price: ci.product.priceCents,
      }));

      const syncMetadata: Record<string, unknown> = {
        origin: "QR",
        source: "qr_order",
      };
      if (tableNumber !== undefined) {
        syncMetadata.table_number = tableNumber;
      }
      if (notes.trim()) {
        syncMetadata.customer_notes = notes.trim();
      }

      const { data, error: rpcError } = await dockerCoreClient.rpc(
        "create_order_atomic",
        {
          p_restaurant_id: restaurantId,
          p_items: rpcItems,
          p_payment_method: "pending",
          p_sync_metadata: syncMetadata,
        },
      );

      if (rpcError) {
        console.error("[useCustomerOrder] submitOrder failed", rpcError);
        setError("Erro ao enviar pedido. Tente novamente.");
        return { success: false };
      }

      const orderId = (data as { id?: string })?.id;
      setOrderSubmitted(true);
      setSubmittedOrderId(orderId ?? null);
      setCart([]);
      setNotes("");
      return { success: true, orderId: orderId ?? undefined };
    } catch (err) {
      console.error("[useCustomerOrder] submitOrder error", err);
      setError("Erro ao enviar pedido. Tente novamente.");
      return { success: false };
    } finally {
      setSubmitting(false);
    }
  }, [cart, restaurantId, tableNumber, notes]);

  const resetOrder = useCallback(() => {
    setOrderSubmitted(false);
    setSubmittedOrderId(null);
    setCart([]);
    setNotes("");
    setError(null);
  }, []);

  return {
    restaurant,
    menu: { categories, products },
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    cartItemCount,
    notes,
    setNotes,
    submitOrder,
    submitting,
    orderSubmitted,
    submittedOrderId,
    resetOrder,
    loading,
    error,
  };
}
