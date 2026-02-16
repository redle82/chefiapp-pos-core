/**
 * TPVPOSView — Vista principal do POS: modo, categorias, grelha de produtos, painel do pedido.
 * Usa a mesma lógica de dados que TPVMinimal (produtos, carrinho, createOrder).
 *
 * Integração Operacional (Fase 2 — Backend Real):
 * - OrderStatusPanel: status do pedido, ações (enviar cozinha, segurar, dividir).
 * - createOrderLifecycle: orquestra estado operacional + backend Docker Core.
 *
 * Fluxo:
 *   1. addToCart → lifecycle.startOrder(local) + lifecycle.addItem(local stock)
 *   2. "Enviar Cozinha" → lifecycle.sendToKitchen (cria pedido no backend, KDS vê)
 *   3. "Pagar/Confirmar" → lifecycle.finalizeOrder (fecha pedido no backend)
 *   Atalho takeaway: "Confirmar" → lifecycle.confirmAndPay (cria + fecha atomicamente)
 */

import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { OrderStatusPanel } from "../../components/pos/OrderStatusPanel";
import { CONFIG } from "../../config";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { createOrderLifecycle } from "../../core/operational/processOrderLifecycle";
import { useOperationalStore } from "../../core/operational/useOperationalStore";
import { getTpvRestaurantId } from "../../core/storage/installedDeviceStorage";
import { useBootstrapState } from "../../hooks/useBootstrapState";
import type { CoreProduct } from "../../infra/readers/RestaurantReader";
import { readMenuCategories } from "../../infra/readers/RestaurantReader";
import { ToastContainer, useToast } from "../../ui/design-system/Toast";
import { isPlaceholderPhoto } from "../../utils/isPlaceholderPhoto";
import {
  OrderModeSelector,
  type OrderMode,
} from "./components/OrderModeSelector";
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

  // Flag: pedido já enviado para cozinha (tem ID real no backend)
  const isSentToKitchen = currentOrderStatus === "SENT";

  // Carregar menu (categorias + produtos)
  useEffect(() => {
    if (bootstrap.coreStatus !== "online") return;
    const urlProducts = `${CONFIG.CORE_URL}/rest/v1/gm_products?select=*&restaurant_id=eq.${restaurantId}&available=eq.true&order=created_at.asc`;
    fetch(urlProducts, {
      headers: {
        apikey: CONFIG.CORE_ANON_KEY,
        "Content-Type": "application/json",
      },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: CoreProduct[]) =>
        setProducts(Array.isArray(data) ? data : []),
      )
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
    // Sempre usar foto de comida por categoria (evita paisagens/placeholders da BD)
    const imageUrl = getFoodPhotoUrl(product.category_id, categoryName);

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

  // Label do botão principal muda conforme o estado
  const proceedLabel = isSentToKitchen
    ? `Pagar €${(totalCents / 100).toFixed(2)}`
    : `Confirmar €${(totalCents / 100).toFixed(2)}`;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        minHeight: 0,
      }}
    >
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 16,
        }}
      >
        <OrderModeSelector value={orderMode} onChange={setOrderMode} />
        <ProductCategoryFilter
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {filteredProducts.map((product) => {
            const categoryName = categories.find(
              (c) => c.id === product.category_id,
            )?.name;
            const foodPhotoUrl = getFoodPhotoUrl(
              product.category_id,
              categoryName,
            );
            // Só usar photo_url da BD se NÃO for placeholder (evita paisagens/fotos aleatórias)
            const trustedPhotoUrl =
              product.photo_url && !isPlaceholderPhoto(product.photo_url)
                ? product.photo_url
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
      {/* Sidebar direita: pedido + painel operacional */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 320,
          maxWidth: 360,
        }}
      >
        <OrderSummaryPanel
          items={cart}
          subtotalCents={subtotalCents}
          taxCents={taxCents}
          discountCents={0}
          onClearAll={handleCancelOrder}
          onUpdateQuantity={updateQuantity}
          onPrintReceipt={() => toast.info("Impressão de recibo em breve.")}
          onProceed={handleProceed}
          proceedDisabled={(cart.length === 0 && !isSentToKitchen) || sending}
        />
        <OrderStatusPanel
          onSendToKitchen={handleSendToKitchen}
          onHoldOrder={() => {
            lifecycle.holdOrder();
            toast.info("Pedido em espera.");
          }}
          onSplitBill={() => toast.info("Divisão de conta em breve.")}
          disabled={cart.length === 0 || sending}
        />
      </div>
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  );
}
