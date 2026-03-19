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
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { OrderStatusPanel } from "../../components/pos/OrderStatusPanel";
import { CONFIG } from "../../config";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useCatalogStore } from "../../core/catalog/catalogStore";
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
import {
  ModifierSelectorModal,
  type SelectedModifier,
} from "../TPV/components/ModifierSelectorModal";
import { SplitBillModalWrapper } from "../TPV/components/SplitBillModalWrapper";
import { ToastContainer, useToast } from "../../ui/design-system/Toast";
import { isPlaceholderPhoto } from "../../utils/isPlaceholderPhoto";
import { OrderContextGate } from "./components/OrderContextGate";
import type { OrderMode } from "./components/OrderModeSelector";
import {
  OrderSummaryPanel,
  type OrderSummaryItem,
  type CartItemModifier,
} from "./components/OrderSummaryPanel";
import {
  ProductCategoryFilter,
  type TPVCategory,
} from "./components/ProductCategoryFilter";
import { TPVProductCard } from "./components/TPVProductCard";
import { getFoodPhotoUrl } from "./foodPhotoUrls";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { FiscalReceipt } from "./components/FiscalReceipt";
import type { ReceiptData, ReceiptLineItem, ReceiptTaxLine } from "./types/ReceiptData";
import { mapReceiptForPrint } from "./types/ReceiptData";
import { PrintService } from "../../core/printing/PrintService";
import { loadLogoRaster } from "../../core/printing/templates/OrderReceipt";
import { saveReceipt } from "../../core/receipt/ReceiptHistoryService";
import { sendReceiptEmail, getEmailSettings } from "../../core/notifications/EmailService";
import { useOperator } from "./context/OperatorContext";
import { saveTip } from "../../core/payment/TipService";
import type { TipType } from "../../core/payment/TipService";
import { reopenOrder } from "../../core/orders/reopenOrder";
import { TipSelector } from "./components/TipSelector";
import "./TPVPOSView.css";

const DEFAULT_RESTAURANT_ID = "00000000-0000-0000-0000-000000000100";

export function TPVPOSView() {
  const { t } = useTranslation("tpv");
  const navigate = useNavigate();
  const runtimeContext = useRestaurantRuntime();
  const runtime = runtimeContext?.runtime;
  const bootstrap = useBootstrapState();
  const toast = useToast();
  const { formatAmount } = useCurrency();
  const { identity } = useRestaurantIdentity();
  const { operator } = useOperator();
  const outletContext = useOutletContext<{ searchQuery?: string }>();
  const searchQuery = outletContext?.searchQuery ?? "";
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get("demo") === "1";
  const tableParam = searchParams.get("table") ?? null;
  const tableIdParam = searchParams.get("tableId") ?? null;

  // Orchestrador operacional: estável por toda a vida do componente
  const lifecycle = useMemo(() => createOrderLifecycle(), []);
  // Serviço de impressão ESC/POS (singleton por componente)
  const printService = useMemo(() => new PrintService(), []);

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
  const [orderMode, setOrderMode] = useState<OrderMode | null>(null);
  const [contextChosen, setContextChosen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [sending, setSending] = useState(false);
  // Split bill modal state
  const [splitBillOpen, setSplitBillOpen] = useState(false);
  const [splitPayProcessing, setSplitPayProcessing] = useState(false);
  // Tip & payment method state
  const [tipCents, setTipCents] = useState(0);
  const [tipType, setTipType] = useState<TipType>("fixed");
  const [payMethod, setPayMethod] = useState<"cash" | "card" | "pix" | "mbway" | "sumup_eur">("cash");
  const [tipModalOpen, setTipModalOpen] = useState(false);
  // Receipt state (full fiscal receipt snapshot)
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  // Discount state
  const [discountCents, setDiscountCents] = useState(0);
  const [discountReason, setDiscountReason] = useState<string | undefined>();
  // Mobile cart drawer state
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // --- Modifier modal state ---
  const [modifierModalProduct, setModifierModalProduct] = useState<CoreProduct | null>(null);

  // Catalog store: modifier groups + modifiers (loaded once)
  const catalogModifierGroups = useCatalogStore((s) => s.modifierGroups);
  const catalogModifiers = useCatalogStore((s) => s.modifiers);
  const catalogProducts = useCatalogStore((s) => s.products);
  const catalogLoadAll = useCatalogStore((s) => s.loadAll);

  // Load catalog data (modifier groups, modifiers, catalog products) once
  useEffect(() => {
    catalogLoadAll(restaurantId).catch(() => {});
  }, [restaurantId, catalogLoadAll]);

  // Flag: pedido já enviado para cozinha (tem ID real no backend)
  const isSentToKitchen = currentOrderStatus === "SENT";

  // Auto-set dine_in mode and skip gate when navigating from table map
  useEffect(() => {
    if (tableParam) {
      setOrderMode("dine_in");
      setContextChosen(true);
    }
  }, [tableParam]);

  // Skip gate in demo mode
  useEffect(() => {
    if (isDemoMode) {
      setOrderMode("take_away");
      setContextChosen(true);
    }
  }, [isDemoMode]);

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

  // --- Resolve modifier group IDs for a product ---
  const getModifierGroupIds = useCallback(
    (productId: string): string[] => {
      const catProduct = catalogProducts.find((p) => p.id === productId);
      return catProduct?.modifierGroupIds ?? [];
    },
    [catalogProducts],
  );

  // --- Add to cart (with modifier interception) ---
  const addToCart = (product: CoreProduct, selectedModifiers?: CartItemModifier[]) => {
    if (isSentToKitchen) {
      toast.warning(t("posView.orderAlreadySentToKitchen"));
      return;
    }

    // Check if this product has modifier groups and none were selected yet
    const modGroupIds = getModifierGroupIds(product.id);
    if (modGroupIds.length > 0 && !selectedModifiers) {
      setModifierModalProduct(product);
      return;
    }

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

    // Calculate modifier price delta for lifecycle tracking
    const modDelta = (selectedModifiers ?? []).reduce(
      (sum, m) => sum + m.priceDeltaCents,
      0,
    );

    // Iniciar pedido operacional se for o primeiro item
    if (cart.length === 0) {
      lifecycle.startOrder(orderMode ?? "take_away", tableParam, tableIdParam);
    }

    // Build modifier input for backend persistence
    const modifierInputs = (selectedModifiers ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      group_id: m.groupId,
      group_name: m.groupName,
      price_delta_cents: m.priceDeltaCents,
    }));

    // Reservar estoque operacional (include modifier delta in price)
    lifecycle.addItem({
      id: product.id,
      name: product.name,
      priceCents: product.price_cents + modDelta,
      costCents: Math.round(product.price_cents * 0.35),
      ...(modifierInputs.length > 0 ? { modifiers: modifierInputs } : {}),
    });

    // When modifiers are selected, always add as new line
    const hasModifiers = selectedModifiers && selectedModifiers.length > 0;
    const existing = hasModifiers
      ? undefined
      : cart.find((i) => i.product_id === product.id && !i.modifiers?.length);

    if (existing) {
      setCart(
        cart.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: hasModifiers
            ? `${product.id}__${Date.now()}`
            : product.id,
          name: product.name,
          subtitle: categoryName ?? undefined,
          quantity: 1,
          unit_price: product.price_cents,
          image_url: imageUrl,
          modifiers: selectedModifiers,
        },
      ]);
    }
  };

  // --- Modifier modal confirm handler ---
  const handleModifierConfirm = (selected: SelectedModifier[]) => {
    if (!modifierModalProduct) return;
    const cartModifiers: CartItemModifier[] = selected.map((s) => ({
      id: s.id,
      name: s.name,
      groupId: s.groupId,
      groupName: s.groupName,
      priceDeltaCents: s.priceDeltaCents,
    }));
    addToCart(modifierModalProduct, cartModifiers);
    setModifierModalProduct(null);
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

  // Subtotal includes modifier deltas
  const subtotalCents = cart.reduce((sum, i) => {
    const modDelta = (i.modifiers ?? []).reduce(
      (s, m) => s + m.priceDeltaCents,
      0,
    );
    return sum + (i.unit_price + modDelta) * i.quantity;
  }, 0);
  const taxRate = parseFloat(localStorage.getItem("chefiapp_tax_rate") || "0.05");
  const taxCents = Math.round(subtotalCents * taxRate);
  const totalCents = subtotalCents + taxCents - discountCents;
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

    // Demo mode: simulate payment without backend — show full receipt
    if (isDemoMode) {
      const demoOrderId = `DEMO-${Date.now().toString(36)}`;
      const receiptSnapshot = buildReceiptSnapshot(demoOrderId);
      setLastReceipt(receiptSnapshot);
      saveReceipt(restaurantId, receiptSnapshot).catch(() => {});
      setCart([]);
      setTipCents(0);
      setDiscountCents(0);
      setDiscountReason(undefined);
      return;
    }

    // Show tip selection before payment
    setTipModalOpen(true);
  };

  // Build full receipt snapshot from current cart + identity (before cart is cleared)
  const buildReceiptSnapshot = (orderId: string): ReceiptData => {
    const items: ReceiptLineItem[] = cart.map((item) => {
      const modDelta = (item.modifiers ?? []).reduce(
        (sum, m) => sum + m.priceDeltaCents,
        0,
      );
      return {
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: (item.unit_price + modDelta) * item.quantity,
        modifiers: item.modifiers?.map((m) => ({
          name: m.name,
          priceDeltaCents: m.priceDeltaCents,
        })),
      };
    });

    // Tax breakdown: single line from stored tax rate (MVP)
    const taxBreakdown: ReceiptTaxLine[] = taxCents > 0
      ? [{
          rateLabel: `${Math.round(taxRate * 100)}%`,
          rate: taxRate,
          baseAmount: subtotalCents,
          taxAmount: taxCents,
        }]
      : [];

    return {
      orderId,
      orderIdShort: orderId.slice(0, 8),
      timestamp: new Date().toISOString(),
      table: tableParam,
      orderMode: orderMode,
      restaurant: {
        name: identity.name || "Restaurante",
        legalName: identity.legalName,
        address: identity.address,
        taxId: identity.taxId,
        phone: identity.phone,
        logoUrl: identity.logoUrl,
        logoPrintUrl: identity.logoPrintUrl,
        receiptExtraText: identity.receiptExtraText,
      },
      items,
      subtotalCents,
      discountCents,
      discountReason,
      taxCents,
      taxBreakdown,
      tipCents,
      tipType: tipCents > 0 ? tipType : undefined,
      grandTotalCents,
      paymentMethod: payMethod,
    };
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
          const fullOrderId = result.orderId ?? "";
          // Snapshot cart BEFORE clearing — receipt needs itemized data
          const receiptSnapshot = buildReceiptSnapshot(fullOrderId);
          setLastReceipt(receiptSnapshot);
          // Persist receipt history (fire-and-forget)
          saveReceipt(restaurantId, receiptSnapshot).catch(() => {});
          // Persist tip record (fire-and-forget, tips are NOT taxed)
          if (tipCents > 0) {
            saveTip(restaurantId, {
              orderId: fullOrderId,
              amountCents: tipCents,
              type: tipType,
              operatorId: operator?.id ?? null,
              operatorName: operator?.name ?? null,
              createdAt: new Date().toISOString(),
            }).catch(() => {});
          }
          setCart([]);
          setTipCents(0);
          setDiscountCents(0);
          setDiscountReason(undefined);
        } else {
          toast.error(result.error ?? t("posView.errorFinalizeOrder"));
        }
      } else {
        const result = await lifecycle.confirmAndPay(restaurantId, payMethod);
        if (result.success) {
          const fullOrderId = result.orderId ?? "";
          // Snapshot cart BEFORE clearing — receipt needs itemized data
          const receiptSnapshot = buildReceiptSnapshot(fullOrderId);
          setLastReceipt(receiptSnapshot);
          // Persist receipt history (fire-and-forget)
          saveReceipt(restaurantId, receiptSnapshot).catch(() => {});
          // Persist tip record (fire-and-forget, tips are NOT taxed)
          if (tipCents > 0) {
            saveTip(restaurantId, {
              orderId: fullOrderId,
              amountCents: tipCents,
              type: tipType,
              operatorId: operator?.id ?? null,
              operatorName: operator?.name ?? null,
              createdAt: new Date().toISOString(),
            }).catch(() => {});
          }
          setCart([]);
          setTipCents(0);
          setDiscountCents(0);
          setDiscountReason(undefined);
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
    setDiscountCents(0);
    setDiscountReason(undefined);
    setContextChosen(false);
    setOrderMode(null);
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
  const handleApplyDiscount = (cents: number, reason?: string) => {
    setDiscountCents(cents);
    setDiscountReason(reason);
  };

  const handleRemoveDiscount = () => {
    setDiscountCents(0);
    setDiscountReason(undefined);
  };

  const orderPanelProps = {
    items: cart,
    subtotalCents,
    taxCents,
    discountCents,
    onClearAll: handleCancelOrder,
    onUpdateQuantity: updateQuantity,
    onPrintReceipt: () => toast.info(t("posView.printReceiptComingSoon")),
    onProceed: () => {
      handleProceed();
      setMobileCartOpen(false);
    },
    proceedDisabled: (cart.length === 0 && !isSentToKitchen) || sending,
    orderMode: orderMode ?? "take_away",
    onOrderModeChange: (mode: OrderMode) => setOrderMode(mode),
    tableNumber: tableParam,
    onApplyDiscount: handleApplyDiscount,
    onRemoveDiscount: handleRemoveDiscount,
    discountReason,
    operatorRole: operator?.role,
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

  // Resolve modifier groups for the modal product
  const modalModifierGroupIds = modifierModalProduct
    ? getModifierGroupIds(modifierModalProduct.id)
    : [];
  const modalGroups = catalogModifierGroups.filter((g) =>
    modalModifierGroupIds.includes(g.id),
  );
  const modalModifiers = catalogModifiers.filter((m) =>
    modalModifierGroupIds.includes(m.groupId),
  );

  return (
    <div className="tpv-container">
      {/* Demo mode banner — small, non-intrusive */}
      {isDemoMode && (
        <div
          style={{
            position: "fixed",
            top: 56,
            left: 72,
            right: 0,
            zIndex: 40,
            background: "rgba(254, 243, 199, 0.9)",
            backdropFilter: "blur(4px)",
            color: "#92400e",
            padding: "4px 16px",
            fontSize: "0.75rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderBottom: "1px solid #fbbf24",
          }}
        >
          <span>🧪</span>
          <span>
            {t("posView.demoBanner")}
          </span>
        </div>
      )}

      {/* Order Context Gate — shown when no context is chosen yet */}
      {!contextChosen ? (
        <OrderContextGate
          onSelect={(mode) => {
            setOrderMode(mode);
            setContextChosen(true);
          }}
          onNavigateToTables={() => navigate("/op/tpv/tables")}
        />
      ) : (
        <>
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
        </>
      )}

      {/* Mobile: Floating cart button — hidden when gate is showing */}
      <button
        className="tpv-mobile-cart-button"
        onClick={() => setMobileCartOpen(true)}
        aria-label={t("posView.viewCart")}
        style={contextChosen ? undefined : { display: "none" }}
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

      {/* Modifier Selector Modal */}
      {modifierModalProduct && modalGroups.length > 0 && (
        <ModifierSelectorModal
          productName={modifierModalProduct.name}
          groups={modalGroups}
          modifiers={modalModifiers}
          onConfirm={handleModifierConfirm}
          onCancel={() => setModifierModalProduct(null)}
        />
      )}

      {/* Split Bill Modal */}
      {splitBillOpen && currentOrderId && (
        <SplitBillModalWrapper
          orderId={currentOrderId}
          restaurantId={restaurantId}
          orderTotal={totalCents}
          taxCents={taxCents}
          items={cart}
          onPayPartial={handlePayPartial}
          onAllPaid={async () => {
            // All split parts paid — finalize order and reset
            try {
              await lifecycle.finalizeOrder(restaurantId, totalCents);
              const fullOrderId = currentOrderId;
              const receiptSnapshot = buildReceiptSnapshot(fullOrderId);
              setLastReceipt(receiptSnapshot);
              saveReceipt(restaurantId, receiptSnapshot).catch(() => {});
              setCart([]);
              setSplitBillOpen(false);
              setTipCents(0);
              setDiscountCents(0);
              setDiscountReason(undefined);
              toast.success(t("posView.billFullyPaid"));
            } catch (err) {
              Logger.error("[SplitBill] Finalize after all paid failed", err);
              toast.error(
                err instanceof Error ? err.message : t("posView.errorFinalizeOrder"),
              );
            }
          }}
          onCancel={() => setSplitBillOpen(false)}
          loading={splitPayProcessing}
        />
      )}

      {/* Tip + Payment Modal */}
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
              width: "min(440px, 92vw)",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Subtotal context */}
            <p style={{ color: "#a1a1aa", fontSize: 13, margin: 0 }}>
              Subtotal: {formatAmount(totalCents)}
            </p>

            {/* TipSelector component */}
            <TipSelector
              totalCents={totalCents}
              tipCents={tipCents}
              onTipChange={(cents) => {
                setTipCents(cents);
                if (cents === 0) {
                  setTipType("fixed");
                } else {
                  const roundUp = Math.ceil(totalCents / 100) * 100 - totalCents;
                  if (cents === roundUp && roundUp > 0) {
                    setTipType("round_up");
                  } else {
                    const matchesPct = [5, 10, 15, 20].some(
                      (p) => Math.round(totalCents * (p / 100)) === cents,
                    );
                    setTipType(matchesPct ? "percentage" : "fixed");
                  }
                }
              }}
            />

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
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(
                  [
                    { id: "cash" as const, label: t("posView.methodCash") },
                    { id: "card" as const, label: t("posView.methodCard") },
                    { id: "pix" as const, label: t("posView.methodPix") },
                    { id: "mbway" as const, label: t("posView.methodMBWay") },
                    { id: "sumup_eur" as const, label: t("posView.methodSumUp") },
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

      {/* Fiscal receipt overlay after successful payment */}
      {lastReceipt && (
        <FiscalReceipt
          receipt={lastReceipt}
          operatorRole={operator?.role}
          onEmailReceipt={
            getEmailSettings().emailReceiptsEnabled
              ? async (email: string) => {
                  if (!lastReceipt) return;
                  const result = await sendReceiptEmail(
                    restaurantId,
                    email,
                    lastReceipt,
                  );
                  if (!result.success) {
                    throw new Error(result.error ?? "Failed to send email");
                  }
                  toast.success(t("posView.receiptEmailed", "Receipt emailed"));
                }
              : undefined
          }
          onReopenOrder={async (reason: string) => {
            if (!operator) return;
            const result = await reopenOrder({
              orderId: lastReceipt.orderId,
              restaurantId,
              operatorId: operator.id,
              operatorName: operator.name,
              operatorRole: operator.role,
              reason,
            });
            if (!result.success) {
              throw new Error(result.error ?? "Failed to reopen order");
            }
            toast.success(
              t("posView.orderReopened", "Order reopened successfully"),
            );
            setLastReceipt(null);
            // Navigate to the order in the POS (reload with order context)
            navigate(`/op/tpv/pos?table=${lastReceipt.table ?? ""}&reopenedOrder=${lastReceipt.orderId}`);
          }}
          onNewOrder={() => {
            setLastReceipt(null);
            setContextChosen(false);
            setOrderMode(null);
          }}
          onPrint={async () => {
            if (!lastReceipt) return;
            try {
              if (!printService.isReady()) {
                // Try auto-reconnect to previously paired device
                const devices = await navigator.usb.getDevices();
                if (devices.length > 0) {
                  await printService.connectToDevice(devices[0]);
                } else {
                  // No paired device — request new pairing (requires user gesture)
                  await printService.connect();
                }
              }
              const { order, restaurant, paymentMethodLabel, options } =
                mapReceiptForPrint(lastReceipt);
              // Load logo for thermal printing (prefer mono version)
              const printLogoUrl = lastReceipt.restaurant.logoPrintUrl || lastReceipt.restaurant.logoUrl;
              if (printLogoUrl) {
                const raster = await loadLogoRaster(printLogoUrl, 200);
                if (raster) {
                  options.logoRaster = raster;
                }
              }
              await printService.printOrderReceipt(
                order,
                restaurant,
                paymentMethodLabel,
                options,
              );
              toast.info(t("posView.receiptPrinted", "Recibo impresso"));
            } catch (err) {
              Logger.warn("[TPV] Print failed", { error: err });
              toast.error(
                err instanceof Error ? err.message : "Erro ao imprimir",
              );
            }
          }}
        />
      )}

      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  );
}
