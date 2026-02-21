/**
 * TPVPOSView — Main POS view: categories, product grid, order panel.
 *
 * Ref: POS reference layout — product grid left, order panel right (with mode tabs inside).
 *
 * ChefIApp additions:
 * - OrderStatusPanel: order status, actions (send kitchen, hold, split).
 * - createOrderLifecycle: operational state + Docker Core backend.
 *
 * Flow:
 *   1. addToCart → lifecycle.startOrder(local) + lifecycle.addItem(local stock)
 *   2. "Send Kitchen" → lifecycle.sendToKitchen (creates order in backend, KDS sees it)
 *   3. "Pay/Confirm" → lifecycle.finalizeOrder (closes order in backend)
 *   Takeaway shortcut: "Confirm" → lifecycle.confirmAndPay (create + close atomically)
 */

import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { OrderStatusPanel } from "../../components/pos/OrderStatusPanel";
import { CONFIG } from "../../config";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { createOrderLifecycle } from "../../core/operational/processOrderLifecycle";
import { useOperationalStore } from "../../core/operational/useOperationalStore";
import { resolveProductImageUrl } from "../../core/products/resolveProductImageUrl";
import { getTpvRestaurantId } from "../../core/storage/installedDeviceStorage";
import { useBootstrapState } from "../../hooks/useBootstrapState";
import type { CoreProduct } from "../../infra/readers/RestaurantReader";
import { readMenuCategories } from "../../infra/readers/RestaurantReader";
import { ToastContainer, useToast } from "../../ui/design-system/Toast";
import { isPlaceholderPhoto } from "../../utils/isPlaceholderPhoto";
import type { OrderMode } from "./components/OrderModeSelector";
import {
  OrderSummaryPanel,
  type OrderSummaryItem,
} from "./components/OrderSummaryPanel";
import {
  ProductCategoryFilter,
  type TPVCategory,
} from "./components/ProductCategoryFilter";
import { TPVProductCard } from "./components/TPVProductCard";
import { getFoodPhotoUrl } from "./foodPhotoUrls";
import "./TPVPOSView.css";

const DEFAULT_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";

export function TPVPOSView() {
  const runtimeContext = useRestaurantRuntime();
  const runtime = runtimeContext?.runtime;
  const bootstrap = useBootstrapState();
  const toast = useToast();
  const outletContext = useOutletContext<{ searchQuery?: string }>();
  const searchQuery = outletContext?.searchQuery ?? "";

  // Orchestrador operacional: estável por toda a vida do componente
  const lifecycle = useMemo(() => createOrderLifecycle(), []);

  // Estado do pedido actual (backend source of truth via store)
  const currentOrderStatus = useOperationalStore((s) => s.currentOrder.status);

  const installedRestaurantId = getTpvRestaurantId();
  const runtimeRestaurantId = runtime?.restaurant_id ?? null;
  const restaurantId =
    installedRestaurantId ?? runtimeRestaurantId ?? DEFAULT_RESTAURANT_ID;

  const [products, setProducts] = useState<CoreProduct[]>([]);
  const [categories, setCategories] = useState<TPVCategory[]>([]);
  const [cart, setCart] = useState<OrderSummaryItem[]>([]);
  const [orderMode, setOrderMode] = useState<OrderMode>("take_away");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [sending, setSending] = useState(false);
  // Mobile cart drawer state
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Flag: pedido já enviado para cozinha (tem ID real no backend)
  const isSentToKitchen = currentOrderStatus === "SENT";

  // Carregar menu (categorias + produtos)
  useEffect(() => {
    if (bootstrap.coreStatus !== "online") return;
    const urlWithAssets = `${CONFIG.CORE_URL}/rest/v1/gm_products?select=*,gm_product_assets(image_url)&restaurant_id=eq.${restaurantId}&available=eq.true&order=created_at.asc`;
    const urlPlain = `${CONFIG.CORE_URL}/rest/v1/gm_products?select=*&restaurant_id=eq.${restaurantId}&available=eq.true&order=created_at.asc`;
    const headers = {
      apikey: CONFIG.CORE_ANON_KEY,
      "Content-Type": "application/json",
    };

    const normalizeProducts = (
      data: Array<
        CoreProduct & {
          gm_product_assets?: { image_url?: string | null } | null;
        }
      >,
    ) =>
      Array.isArray(data)
        ? data.map(({ gm_product_assets, ...rest }) => ({
            ...rest,
            asset_image_url: gm_product_assets?.image_url ?? null,
          }))
        : [];

    fetch(urlWithAssets, { headers })
      .then(async (response) => {
        if (response.ok) return response.json();
        const fallback = await fetch(urlPlain, { headers });
        return fallback.ok ? fallback.json() : [];
      })
      .then((data) => setProducts(normalizeProducts(data)))
      .catch(() => setProducts([]));

    readMenuCategories(restaurantId).then((cats) =>
      setCategories(cats.map((c) => ({ id: c.id, name: c.name }))),
    );
  }, [restaurantId, bootstrap.coreStatus]);

  const filteredProducts = products.filter((p) => {
    const matchCategory =
      selectedCategoryId == null || p.category_id === selectedCategoryId;
    const matchSearch =
      !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const addToCart = (product: CoreProduct) => {
    if (isSentToKitchen) {
      toast.warning(
        "Pedido já enviado para cozinha. Finalize ou cancele antes de novo pedido.",
      );
      return;
    }

    const existing = cart.find((i) => i.product_id === product.id);
    const categoryName = categories.find(
      (c) => c.id === product.category_id,
    )?.name;
    const resolvedImageUrl = resolveProductImageUrl(product);
    const trustedImageUrl =
      resolvedImageUrl && !isPlaceholderPhoto(resolvedImageUrl)
        ? resolvedImageUrl
        : null;
    const imageUrl =
      trustedImageUrl ?? getFoodPhotoUrl(product.category_id, categoryName);

    // Iniciar pedido operacional se for o primeiro item
    if (cart.length === 0) {
      lifecycle.startOrder(orderMode);
    }

    // Reservar estoque operacional
    lifecycle.addItem({
      id: product.id,
      name: product.name,
      priceCents: product.price_cents,
      costCents: Math.round(product.price_cents * 0.35), // estimativa de custo
    });

    if (existing) {
      setCart(
        cart.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          name: product.name,
          subtitle: categoryName ?? undefined,
          quantity: 1,
          unit_price: product.price_cents,
          image_url: imageUrl,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((i) => i.product_id !== productId));
      return;
    }
    setCart(
      cart.map((i) => (i.product_id === productId ? { ...i, quantity } : i)),
    );
  };

  const subtotalCents = cart.reduce(
    (sum, i) => sum + i.unit_price * i.quantity,
    0,
  );
  const taxCents = Math.round(subtotalCents * 0.05);
  const totalCents = subtotalCents + taxCents;

  // ─── Enviar para cozinha (cria pedido no backend) ───────────────
  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    if (bootstrap.coreStatus !== "online") {
      toast.warning("Core offline. Não é possível enviar pedido.");
      return;
    }
    setSending(true);
    try {
      const result = await lifecycle.sendToKitchen(restaurantId);
      if (result.success) {
        toast.success(
          `Pedido #${result.orderId?.slice(0, 8)} enviado para cozinha!`,
        );
      } else {
        toast.error(result.error ?? "Erro ao enviar para cozinha.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSending(false);
    }
  };

  // ─── Confirmar + Pagar (takeaway ou após enviar cozinha) ────────
  const handleProceed = async () => {
    if (cart.length === 0 && !isSentToKitchen) return;
    if (
      bootstrap.coreStatus !== "online" ||
      bootstrap.publishStatus !== "publicado"
    ) {
      toast.warning("Core offline ou não publicado.");
      return;
    }
    setSending(true);
    try {
      if (isSentToKitchen) {
        // Pedido já no backend → apenas fechar (pagamento)
        const result = await lifecycle.finalizeOrder(restaurantId, totalCents);
        if (result.success) {
          setCart([]);
          toast.success(
            `Pedido #${result.orderId?.slice(0, 8)} pago. Total: €${(
              totalCents / 100
            ).toFixed(2)}`,
          );
        } else {
          toast.error(result.error ?? "Erro ao finalizar pedido.");
        }
      } else {
        // Atalho takeaway: cria + fecha atomicamente
        const result = await lifecycle.confirmAndPay(restaurantId, "cash");
        if (result.success) {
          setCart([]);
          toast.success(
            `Pedido #${result.orderId?.slice(
              0,
              8,
            )} confirmado e pago. Total: €${(totalCents / 100).toFixed(2)}`,
          );
        } else {
          toast.error(result.error ?? "Erro ao criar pedido.");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar pedido.");
    } finally {
      setSending(false);
    }
  };

  // ─── Cancelar ─────────────────────────────────────────────────────
  const handleCancelOrder = async () => {
    setCart([]);
    await lifecycle.cancelOrder(restaurantId);
  };

  // Calculate cart item count for mobile badge
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Shared order panel props
  const orderPanelProps = {
    items: cart,
    subtotalCents,
    taxCents,
    discountCents: 0,
    onClearAll: handleCancelOrder,
    onUpdateQuantity: updateQuantity,
    onPrintReceipt: () => toast.info("Impressão de recibo em breve."),
    onProceed: () => {
      handleProceed();
      setMobileCartOpen(false);
    },
    proceedDisabled: (cart.length === 0 && !isSentToKitchen) || sending,
    orderMode,
    onOrderModeChange: setOrderMode,
  };

  const statusPanelProps = {
    onSendToKitchen: async () => {
      await handleSendToKitchen();
      setMobileCartOpen(false);
    },
    onHoldOrder: () => {
      lifecycle.holdOrder();
      toast.info("Pedido em espera.");
    },
    onSplitBill: () => toast.info("Divisão de conta em breve."),
    disabled: cart.length === 0 || sending,
  };

  return (
    <div className="tpv-container">
      {/* Left: categories + product grid */}
      <div className="tpv-products">
        <ProductCategoryFilter
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />
        <div className="tpv-products-grid">
          {filteredProducts.map((product) => {
            const categoryName = categories.find(
              (c) => c.id === product.category_id,
            )?.name;
            const foodPhotoUrl = getFoodPhotoUrl(
              product.category_id,
              categoryName,
            );
            const resolvedImageUrl = resolveProductImageUrl(product);
            const trustedPhotoUrl =
              resolvedImageUrl && !isPlaceholderPhoto(resolvedImageUrl)
                ? resolvedImageUrl
                : null;
            return (
              <TPVProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  description: product.description,
                  price_cents: product.price_cents,
                  photo_url: trustedPhotoUrl,
                  category_id: product.category_id,
                }}
                fallbackPhotoUrl={foodPhotoUrl}
                onAdd={() => addToCart(product)}
              />
            );
          })}
        </div>
      </div>

      {/* Right: order panel + operational status (desktop only via CSS) */}
      <div className="tpv-order-panel">
        <OrderSummaryPanel {...orderPanelProps} />
        <OrderStatusPanel {...statusPanelProps} />
      </div>

      {/* Mobile: Floating cart button */}
      <button
        className="tpv-mobile-cart-button"
        onClick={() => setMobileCartOpen(true)}
        aria-label="Ver carrinho"
      >
        <span className="tpv-mobile-cart-button__content">
          <span>
            {cartItemCount > 0
              ? `Ver Pedido · €${(totalCents / 100).toFixed(2)}`
              : "Carrinho Vazio"}
          </span>
          {cartItemCount > 0 && (
            <span className="tpv-mobile-cart-button__badge">
              {cartItemCount}
            </span>
          )}
        </span>
      </button>

      {/* Mobile: Cart drawer overlay */}
      <div
        className={`tpv-mobile-drawer-overlay ${mobileCartOpen ? "open" : ""}`}
        onClick={() => setMobileCartOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile: Cart drawer */}
      <div className={`tpv-mobile-drawer ${mobileCartOpen ? "open" : ""}`}>
        <div
          className="tpv-mobile-drawer__handle"
          onClick={() => setMobileCartOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Fechar carrinho"
          onKeyDown={(e) => e.key === "Enter" && setMobileCartOpen(false)}
        />
        <div className="tpv-mobile-drawer__content">
          <OrderSummaryPanel {...orderPanelProps} />
          <OrderStatusPanel {...statusPanelProps} />
        </div>
      </div>

      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  );
}
