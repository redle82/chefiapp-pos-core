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

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { OrderStatusPanel } from "../../components/pos/OrderStatusPanel";
import { CONFIG } from "../../config";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useCurrency } from "../../core/currency/useCurrency";
import { Logger } from "../../core/logger";
import { createOrderLifecycle } from "../../core/operational/processOrderLifecycle";
import { useOperationalStore } from "../../core/operational/useOperationalStore";
import { resolveProductImageUrl } from "../../core/products/resolveProductImageUrl";
import { getTpvRestaurantId } from "../../core/storage/installedDeviceStorage";
import { EXAMPLE_MENUS } from "../../features/admin/onboarding/exampleMenus";
import { useBootstrapState } from "../../hooks/useBootstrapState";
import type { CoreProduct } from "../../infra/readers/RestaurantReader";
import { readMenuCategories } from "../../infra/readers/RestaurantReader";
import { SplitBillModalWrapper } from "../TPV/components/SplitBillModalWrapper";
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
  const { t } = useTranslation("tpv");
  const runtimeContext = useRestaurantRuntime();
  const runtime = runtimeContext?.runtime;
  const bootstrap = useBootstrapState();
  const toast = useToast();
  const { formatAmount } = useCurrency();
  const outletContext = useOutletContext<{ searchQuery?: string }>();
  const searchQuery = outletContext?.searchQuery ?? "";
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get("demo") === "1";
  const tableParam = searchParams.get("table") ?? null;
  const tableIdParam = searchParams.get("tableId") ?? null;

  // Orchestrador operacional: estável por toda a vida do componente
  const lifecycle = useMemo(() => createOrderLifecycle(), []);

  // Estado do pedido actual (backend source of truth via store)
  const currentOrderStatus = useOperationalStore((s) => s.currentOrder.status);
  const currentOrderId = useOperationalStore((s) => s.currentOrder.orderId);

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
  // Split bill modal state
  const [splitBillOpen, setSplitBillOpen] = useState(false);
  const [splitPayProcessing, setSplitPayProcessing] = useState(false);
  // Tip & payment method state
  const [tipCents, setTipCents] = useState(0);
  const [payMethod, setPayMethod] = useState<"cash" | "card" | "pix">("cash");
  const [tipModalOpen, setTipModalOpen] = useState(false);
  // Receipt state
  const [lastReceipt, setLastReceipt] = useState<{
    orderId: string;
    total: number;
    tip: number;
    method: string;
    table: string | null;
  } | null>(null);
  // Mobile cart drawer state
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Flag: pedido já enviado para cozinha (tem ID real no backend)
  const isSentToKitchen = currentOrderStatus === "SENT";

  // Auto-set dine_in mode when navigating from table map
  useEffect(() => {
    if (tableParam) setOrderMode("dine_in");
  }, [tableParam]);

  // Demo mode: pre-fill cart with example restaurant items
  useEffect(() => {
    if (!isDemoMode) return;
    const demoCategory = EXAMPLE_MENUS.restaurant.categories[1]; // Pratos Principais
    const demoItems = demoCategory.items.slice(0, 2);
    setCart(
      demoItems.map((item, i) => ({
        product_id: `demo-${i}`,
        name: item.name,
        subtitle: demoCategory.name,
        quantity: 1,
        unit_price: item.price,
        image_url: undefined,
      })),
    );
  }, [isDemoMode]);

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
        t("posView.orderAlreadySentToKitchen"),
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
      lifecycle.startOrder(orderMode, tableParam, tableIdParam);
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
  const grandTotalCents = totalCents + tipCents;

  // ─── Enviar para cozinha (cria pedido no backend) ───────────────
  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    if (bootstrap.coreStatus !== "online") {
      toast.warning(t("posView.coreOfflineCannotSend"));
      return;
    }
    setSending(true);
    try {
      const result = await lifecycle.sendToKitchen(restaurantId);
      if (result.success) {
        toast.success(
          t("posView.orderSentToKitchen", { id: result.orderId?.slice(0, 8) }),
        );
      } else {
        toast.error(result.error ?? t("posView.errorSendToKitchen"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("posView.unexpectedError"));
    } finally {
      setSending(false);
    }
  };

  // ─── Confirmar + Pagar (takeaway ou após enviar cozinha) ────────
  // Step 1: open tip modal (or skip in demo mode)
  const handleProceed = () => {
    if (cart.length === 0 && !isSentToKitchen) return;

    // Demo mode: simulate payment without backend
    if (isDemoMode) {
      const demoTotal = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0);
      setCart([]);
      setTipCents(0);
      toast.success(
        t("posView.demoPaymentSimulated", { total: formatAmount(demoTotal) }),
      );
      return;
    }

    // Show tip selection before payment
    setTipModalOpen(true);
  };

  // Step 2: confirm payment after tip + method selection
  const handleConfirmPayment = async () => {
    setTipModalOpen(false);

    if (
      bootstrap.coreStatus !== "online" ||
      bootstrap.publishStatus !== "publicado"
    ) {
      toast.warning(t("posView.coreOfflineOrNotPublished"));
      return;
    }
    setSending(true);
    try {
      if (isSentToKitchen) {
        const result = await lifecycle.finalizeOrder(
          restaurantId,
          grandTotalCents,
        );
        if (result.success) {
          setLastReceipt({
            orderId: result.orderId?.slice(0, 8) ?? "",
            total: grandTotalCents,
            tip: tipCents,
            method: payMethod,
            table: tableParam,
          });
          setCart([]);
          setTipCents(0);
        } else {
          toast.error(result.error ?? t("posView.errorFinalizeOrder"));
        }
      } else {
        const result = await lifecycle.confirmAndPay(restaurantId, payMethod);
        if (result.success) {
          setLastReceipt({
            orderId: result.orderId?.slice(0, 8) ?? "",
            total: grandTotalCents,
            tip: tipCents,
            method: payMethod,
            table: tableParam,
          });
          setCart([]);
          setTipCents(0);
        } else {
          toast.error(result.error ?? t("posView.errorCreateOrder"));
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

  // ─── Pagamento parcial (split bill) ──────────────────────────────
  const handlePayPartial = useCallback(
    async (amountCents: number, method: "cash" | "card" | "pix") => {
      const store = useOperationalStore.getState();
      const orderId = store.currentOrder.orderId;
      if (!orderId || orderId.startsWith("LOCAL-")) {
        toast.error(t("posView.orderNotSentToKitchen"));
        return;
      }

      setSplitPayProcessing(true);
      try {
        const { PaymentEngine } = await import(
          "../../core/tpv/PaymentEngine"
        );

        // Fetch active cash register (same pattern as TPVMinimal)
        const regUrl = `${CONFIG.CORE_URL}/rest/v1/gm_cash_registers?restaurant_id=eq.${restaurantId}&status=eq.open&limit=1`;
        const regRes = await fetch(regUrl, {
          headers: {
            apikey: CONFIG.CORE_ANON_KEY,
            "Content-Type": "application/json",
          },
        });
        const registers = regRes.ok ? await regRes.json() : [];
        const cashRegisterId = registers?.[0]?.id;

        if (!cashRegisterId) {
          toast.error(t("posView.noCashRegisterOpen"));
          return;
        }

        const result = await PaymentEngine.processSplitPayment({
          orderId,
          restaurantId,
          cashRegisterId,
          amountCents,
          method,
        });

        toast.success(
          t("posView.partialPaymentRegistered", { amount: formatAmount(amountCents) }),
        );

        if (result.isFullyPaid) {
          // Auto-close the order and reset
          await lifecycle.finalizeOrder(restaurantId, totalCents);
          setCart([]);
          setSplitBillOpen(false);
          toast.success(t("posView.billFullyPaid"));
        }
      } catch (err) {
        Logger.error("[SplitBill] Payment failed", err);
        toast.error(
          err instanceof Error ? err.message : t("posView.errorProcessPayment"),
        );
      } finally {
        setSplitPayProcessing(false);
      }
    },
    [restaurantId, totalCents, formatAmount, lifecycle, toast],
  );

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
    onPrintReceipt: () => toast.info(t("posView.printReceiptComingSoon")),
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
      toast.info(t("posView.orderOnHold"));
    },
    onSplitBill: () => {
      if (!isSentToKitchen) {
        toast.warning(t("posView.sendToKitchenBeforeSplit"));
        return;
      }
      setSplitBillOpen(true);
    },
    disabled: cart.length === 0 || sending,
  };

  return (
    <div className="tpv-container">
      {/* Demo mode banner */}
      {isDemoMode && (
        <div
          style={{
            gridColumn: "1 / -1",
            background: "#fef3c7",
            color: "#92400e",
            padding: "8px 16px",
            fontSize: "0.85rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>🧪</span>
          <span>
            {t("posView.demoBanner")}
          </span>
        </div>
      )}

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
        aria-label={t("posView.viewCart")}
      >
        <span className="tpv-mobile-cart-button__content">
          <span>
            {cartItemCount > 0
              ? `${t("posView.viewOrder")} · ${formatAmount(totalCents)}`
              : t("posView.emptyCart")}
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
          aria-label={t("posView.closeCart")}
          onKeyDown={(e) => e.key === "Enter" && setMobileCartOpen(false)}
        />
        <div className="tpv-mobile-drawer__content">
          <OrderSummaryPanel {...orderPanelProps} />
          <OrderStatusPanel {...statusPanelProps} />
        </div>
      </div>

      {/* Split Bill Modal */}
      {splitBillOpen && currentOrderId && (
        <SplitBillModalWrapper
          orderId={currentOrderId}
          restaurantId={restaurantId}
          orderTotal={totalCents}
          onPayPartial={handlePayPartial}
          onCancel={() => setSplitBillOpen(false)}
          loading={splitPayProcessing}
        />
      )}

      {/* Tip Selection Modal */}
      {tipModalOpen && (
        <div
          onClick={() => {
            setTipModalOpen(false);
            setTipCents(0);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0a0a0a",
              border: "1px solid #27272a",
              borderRadius: 20,
              width: "min(420px, 92vw)",
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>
              {t("posView.tipTitle")}
            </h2>
            <p style={{ color: "#a1a1aa", fontSize: 13, margin: 0 }}>
              Subtotal: {formatAmount(totalCents)}
            </p>

            {/* Preset tip buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              {[0, 5, 10, 15].map((pct) => {
                const amount = Math.round(totalCents * (pct / 100));
                const isSelected = tipCents === amount;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTipCents(amount)}
                    style={{
                      flex: 1,
                      padding: "12px 0",
                      background: isSelected ? "#1e1b4b" : "#18181b",
                      border: isSelected
                        ? "2px solid #6366f1"
                        : "2px solid transparent",
                      borderRadius: 10,
                      color: isSelected ? "#fff" : "#d4d4d8",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    {pct === 0 ? t("posView.noTip") : `${pct}%`}
                    {pct > 0 && (
                      <div
                        style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}
                      >
                        {formatAmount(amount)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Summary */}
            <div
              style={{
                background: "#18181b",
                padding: 16,
                borderRadius: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    color: "#71717a",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  {t("posView.totalWithTip")}
                </div>
                <div
                  style={{ color: "#10b981", fontSize: 24, fontWeight: 800 }}
                >
                  {formatAmount(totalCents + tipCents)}
                </div>
              </div>
              {tipCents > 0 && (
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      color: "#71717a",
                      fontSize: 12,
                      textTransform: "uppercase",
                    }}
                  >
                    {t("posView.tipLabel")}
                  </div>
                  <div style={{ color: "#e4e4e7", fontSize: 16, fontWeight: 700 }}>
                    {formatAmount(tipCents)}
                  </div>
                </div>
              )}
            </div>

            {/* Payment method selector */}
            <div>
              <div
                style={{
                  color: "#a1a1aa",
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 8,
                }}
              >
                {t("posView.paymentMethod")}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {(
                  [
                    { id: "cash" as const, label: t("posView.methodCash") },
                    { id: "card" as const, label: t("posView.methodCard") },
                    { id: "pix" as const, label: t("posView.methodPix") },
                  ]
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPayMethod(m.id)}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      background:
                        payMethod === m.id ? "#052e16" : "#18181b",
                      border:
                        payMethod === m.id
                          ? "2px solid #10b981"
                          : "2px solid transparent",
                      borderRadius: 10,
                      color: payMethod === m.id ? "#fff" : "#d4d4d8",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table indicator */}
            {tableParam && (
              <div style={{ color: "#a1a1aa", fontSize: 13 }}>
                {t("posView.table")}: <strong style={{ color: "#e4e4e7" }}>{tableParam}</strong>
              </div>
            )}

            {/* Confirm */}
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={sending}
              style={{
                padding: "16px 0",
                background: "#10b981",
                border: "none",
                borderRadius: 14,
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                cursor: sending ? "not-allowed" : "pointer",
                opacity: sending ? 0.5 : 1,
              }}
            >
              {sending
                ? t("posView.processing")
                : tipCents > 0
                  ? `${t("posView.pay")} ${formatAmount(totalCents + tipCents)}`
                  : `${t("posView.pay")} ${formatAmount(totalCents)}`}
            </button>
          </div>
        </div>
      )}

      {/* Receipt overlay after successful payment */}
      {lastReceipt && (
        <div
          onClick={() => setLastReceipt(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "min(360px, 90vw)",
              padding: 32,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              color: "#18181b",
            }}
          >
            <div style={{ fontSize: 40 }}>✓</div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
              {t("posView.paymentConfirmed")}
            </h2>
            <div
              style={{
                fontSize: 12,
                color: "#71717a",
                fontFamily: "monospace",
              }}
            >
              {t("posView.receiptOrderId", { id: lastReceipt.orderId })}
            </div>

            <div
              style={{
                width: "100%",
                borderTop: "1px dashed #d4d4d8",
                paddingTop: 12,
                marginTop: 4,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 14,
              }}
            >
              {lastReceipt.table && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#71717a" }}>{t("posView.table")}</span>
                  <span style={{ fontWeight: 600 }}>{lastReceipt.table}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#71717a" }}>{t("posView.receiptMethod")}</span>
                <span style={{ fontWeight: 600 }}>
                  {lastReceipt.method === "cash"
                    ? t("posView.methodCash")
                    : lastReceipt.method === "card"
                      ? t("posView.methodCard")
                      : t("posView.methodPix")}
                </span>
              </div>
              {lastReceipt.tip > 0 && (
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#71717a" }}>{t("posView.tipLabel")}</span>
                  <span style={{ fontWeight: 600 }}>
                    {formatAmount(lastReceipt.tip)}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "1px solid #e4e4e7",
                  paddingTop: 8,
                  marginTop: 4,
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 16 }}>{t("posView.total")}</span>
                <span style={{ fontWeight: 800, fontSize: 16 }}>
                  {formatAmount(lastReceipt.total)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLastReceipt(null)}
              style={{
                marginTop: 8,
                padding: "12px 32px",
                background: "#18181b",
                border: "none",
                borderRadius: 10,
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {t("posView.newOrder")}
            </button>
          </div>
        </div>
      )}

      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  );
}
