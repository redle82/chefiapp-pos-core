/**
 * TablePanel — Last.app-inspired order taking view
 * Header with status badge → CategoryStrip (pills) → Product photo grid (2 cols)
 * → Order bar with seat tabs + action buttons (Enviar/Cobrar/Print)
 */

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useCurrency } from "../../core/currency/useCurrency";
import {
  TPVCentralEmitters,
  tpvEventBus,
  type DecisionMadePayload,
} from "../../core/tpv/TPVCentralEvents";
import { Button } from "../../ui/design-system/Button";
import { Text } from "../../ui/design-system/primitives/Text";
import { colors } from "../../ui/design-system/tokens/colors";
import { spacing } from "../../ui/design-system/tokens/spacing";
import { AlertSystem } from "./components/AlertSystem";
import { BottomNavBar } from "./components/BottomNavBar";
import { CategoryStrip } from "./components/CategoryStrip";
import { ExceptionReportModal } from "./components/ExceptionReportModal";
import { MiniMap } from "./components/MiniMap";
import type { ProductComment } from "./components/ProductCard";
import { ProductCard } from "./components/ProductCard";
import { useWaiterCalls } from "./hooks/useWaiterCalls";
import type { Table } from "./types";
import { TableStatus } from "./types";

import { OfflineBanner } from "../../components/OfflineBanner";
import { db } from "../../core/db";
import { useTenant } from "../../core/tenant/TenantContext";
import { useMenuItems } from "../../hooks/useMenuItems";
import { useToast } from "../../ui/design-system";
import { PaymentModal } from "../TPV/components/PaymentModal";
import { useOrders } from "../TPV/context/OrderContextReal";
import { useTables } from "../TPV/context/TableContext";

import { useContextEngine } from "../../core/context";

/** Design tokens — Last.app style */
const ACCENT = "#6366f1";
const ACCENT_GREEN = "#10b981";
const SURFACE = "#18181b";
const BADGE_BLUE = "#3b82f6";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  comments: string[];
  price: number;
  seat?: string; // seat assignment for split billing
}

interface TablePanelProps {
  tableId?: string;
  onBack?: () => void;
}

export function TablePanel({ tableId: propTableId, onBack }: TablePanelProps) {
  const isEmbedded = !!onBack;
  const navigate = useNavigate();
  const params = useParams<{ tableId: string }>();
  // Resolve tableId from Prop or URL
  const tableId = propTableId || params.tableId;

  const { tenantId } = useTenant(); // Needed for hooks
  const { t } = useTranslation("waiter");
  const { currency, formatAmount } = useCurrency();
  console.log("[TablePanel] Rendering. Tenant:", tenantId);
  const { permissions, role } = useContextEngine(); // 🧠 CONTEXT ENGINE
  console.log("[TablePanel] Context Role:", role);

  // Derived State
  const isStandalone = role === "owner" || role === "manager";

  // --- ACTIONS ---
  const handleCloseBill = () => {
    if (!activeOrder) {
      warning(t("toast.noActiveOrder"));
      return;
    }
    setPaymentModalOrderId(activeOrder.id);
  };

  const handleRequestBill = () => {
    // EXECUTION MODE: Request bill from Central TPV
    if (!table) {
      warning(t("toast.tableNotFound"));
      return;
    }
    TPVCentralEmitters.alertTable({
      tableId: table.id,
      tableNumber: table.number,
      alertType: "waiting_payment",
      severity: "medium",
      message: t("toast.billRequestedToTable", { number: table.number }),
      timestamp: new Date(),
    });
    success(t("toast.billRequested"));
  };

  // Real Hooks
  const { tables, loading: tablesLoading } = useTables();
  const { items: menuItems } = useMenuItems(tenantId);
  const {
    orders,
    createOrder,
    addItemToOrder,
    performOrderAction,
    getActiveOrders,
  } = useOrders(); // Inject Order Context

  // Resolve Table
  const table = useMemo(
    () => tables.find((t) => t.id === tableId),
    [tables, tableId],
  );

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [sending, setSending] = useState(false);
  const [activeSeat, setActiveSeat] = useState("shared"); // seat tab: shared, seat-1, seat-2...
  const [seatCount, setSeatCount] = useState(2); // number of individual seats
  const [paymentModalOrderId, setPaymentModalOrderId] = useState<string | null>(
    null,
  );

  // Exception Reporting State
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [pendingException, setPendingException] = useState(false);
  const { success, warning } = useToast();

  // Timer tick — re-render every 60s so seatedMinutes stays fresh
  const [, setTimerTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTimerTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Resolve Active Order
  const activeOrder = useMemo(
    () =>
      orders.find(
        (o) =>
          o.tableId === tableId &&
          o.status !== "paid" &&
          o.status !== "cancelled",
      ),
    [orders, tableId],
  );

  // Listen for operator decisions on this table's orders
  useEffect(() => {
    const handleDecision = (event: any) => {
      const decision = event.payload as DecisionMadePayload;
      if (decision.tableNumber === table?.number) {
        // Decision received for this table
        setPendingException(false);
        success(
          `✅ ${t("toast.decision", { action: decision.action })}${
            decision.message ? ` - ${decision.message}` : ""
          }`,
        );
        console.log("[TablePanel] Decision received:", decision);
      }
    };

    const unsubscribe = tpvEventBus.on("order.decision_made", handleDecision);
    return () => {
      unsubscribe();
    };
  }, [table?.number, success]);

  // Mock: Alertas (Keep Mock for now as Phase 6 focuses on Tables/Menu first)
  // const mockAlerts: WaiterCall[] = [];

  const { calls: deduplicatedAlerts } = useWaiterCalls([]); // Changed from mockAlerts to empty array

  const handleAcknowledgeAlert = (alertId: string) => {
    console.log("Alert acknowledged:", alertId);
  };

  const handleSnoozeAlert = (alertId: string, minutes: number) => {
    console.log("Alert snoozed:", alertId, minutes);
  };

  // Extract Categories from Items
  const categories = useMemo(() => {
    // Filter out duplicate categories
    const uniqueCats = Array.from(new Set(menuItems.map((i) => i.category)));
    return uniqueCats.map((c) => ({
      id: c,
      name: c,
      icon: "🍽️", // Default icon for now
    }));
  }, [menuItems]);

  // Produtos filtrados por categoria + pesquisa
  const visibleProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // When searching, show ALL matching products regardless of category
    if (q.length >= 2) {
      return menuItems
        .filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            (i.description && i.description.toLowerCase().includes(q)),
        )
        .map((i) => ({
          id: i.id,
          name: i.name,
          price: i.priceCents,
          description: i.description,
          currency: currency,
          imageUrl: i.photoUrl,
          trackStock: i.trackStock,
          stockQuantity: i.stockQuantity,
        }));
    }

    // Default: filter by selected category
    if (!selectedCategory) return [];
    return menuItems
      .filter((i) => i.category === selectedCategory)
      .map((i) => ({
        id: i.id,
        name: i.name,
        price: i.priceCents,
        description: i.description,
        currency: currency,
        imageUrl: i.photoUrl,
        trackStock: i.trackStock,
        stockQuantity: i.stockQuantity,
      }));
  }, [selectedCategory, menuItems, searchQuery]);

  // Comentários da categoria selecionada (Mock for now)
  const visibleComments: ProductComment[] = [];

  if (!table) {
    if (tablesLoading) {
      return (
        <div style={{ padding: spacing[6], color: "white" }}>
          {t("tablePanel.loadingTable")}
        </div>
      );
    }
    return (
      <div style={{ padding: spacing[6] }}>
        <Text size="lg" color="destructive">
          {t("tablePanel.tableNotFound")}
        </Text>
        <Button
          onClick={() => navigate("/app/waiter")}
          style={{ marginTop: spacing[4] }}
        >
          {t("tablePanel.backToMap")}
        </Button>
      </div>
    );
  }

  const seatedMinutes =
    table.status === "occupied" && (table as any).seated_at
      ? Math.floor(
          (Date.now() - new Date((table as any).seated_at).getTime()) / 60000,
        )
      : table.status === "occupied"
      ? 0 // occupied but no seated_at yet (legacy rows)
      : null;

  // Helper handling
  const handleAddItem = (
    productId: string,
    quantity: number,
    commentIds: string[],
  ) => {
    const product = visibleProducts.find((p) => p.id === productId);
    if (!product) return;

    const comments = visibleComments
      .filter((c) => commentIds.includes(c.id))
      .map((c) => c.label);

    const newItem: OrderItem = {
      id: `item-${Date.now()}`,
      productId,
      productName: product.name,
      quantity,
      comments,
      price: product.price,
      seat: activeSeat, // assign to current seat tab
    };

    setOrderItems((prev) => [...prev, newItem]);

    // Feedback: vibração simulada (visual)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleSendOrder = async () => {
    if (!table || orderItems.length === 0) return;

    const hasMockItems = orderItems.some((item) =>
      item.productId.startsWith("mock-"),
    );
    if (hasMockItems) {
      warning(t("toast.mockMenuActive"));
      return;
    }
    setSending(true);

    try {
      // Obter autoria (user_id e role) para divisão de conta
      const {
        data: { user },
      } = await db.auth.getUser();
      const userId = user?.id || null;

      // Detectar contexto e role (incl. /app/waiter = Comandeiro/Garçom)
      const isAppStaff =
        window.location.pathname.includes("/app/staff") ||
        window.location.pathname.includes("/app/waiter") ||
        window.location.pathname.includes("/garcom");
      let userRole: string = "waiter"; // Default
      let orderOrigin: string = "CAIXA";

      if (isAppStaff) {
        // No AppStaff, usar role do contexto (waiter, manager, owner)
        // Se role do contexto engine for manager/owner, usar isso
        if (role === "manager") {
          userRole = "manager";
          orderOrigin = "APPSTAFF_MANAGER";
        } else if (role === "owner") {
          userRole = "owner";
          orderOrigin = "APPSTAFF_OWNER";
        } else {
          userRole = "waiter";
          orderOrigin = "APPSTAFF";
        }
      }

      // 1. Check for Active Order on Table (Already computed)
      if (activeOrder) {
        // Case A: Add to Existing Order
        // Parallelize requests for speed
        await Promise.all(
          orderItems.map((item) =>
            addItemToOrder(activeOrder.id, {
              productId: item.productId,
              name: item.productName,
              priceCents: item.price,
              quantity: item.quantity,
              notes: item.comments.join(", "),
            }),
          ),
        );
      } else {
        // Case B: Create New Order
        // Incluir autoria em cada item para divisão de conta
        await createOrder({
          tableId: table.id,
          tableNumber: table.number,
          items: orderItems.map((item) => ({
            id: `temp-${Date.now()}-${Math.random()}`,
            productId: item.productId,
            name: item.productName,
            price: item.price,
            quantity: item.quantity,
            notes: item.comments.join(", "),
            // Autoria do item (para divisão de conta)
            created_by_user_id: userId,
            created_by_role: userRole,
          })),
          syncMetadata: {
            origin: orderOrigin,
            // Incluir autoria também no sync_metadata para referência
            created_by_user_id: userId,
            created_by_role: userRole,
          },
        });
      }

      // Success
      setOrderItems([]);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

      // FEEDBACK BASED ON MODE
      if (isStandalone) {
        // In Solo Mode, "Send" implies "Charge" (Direct Sale)
        success(`💸 ${t("toast.saleRegistered")}`);
        // Future: Open Payment Selection Modal here
      } else {
        success(`${t("toast.orderSentToKitchen")} 👨‍🍳`);
      }
    } catch (error) {
      console.error("Failed to send order:", error);
      warning(t("toast.errorSendOrder"));
    } finally {
      setSending(false);
    }
  };

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleTableClickFromMap = (t: Table) => {
    if (t.id !== tableId) {
      navigate(`/app/waiter/table/${t.id}`);
    }
  };

  return (
    <div
      style={{
        paddingBottom: 100,
        minHeight: "100vh",
        background: "#0a0a0a",
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      <OfflineBanner />
      {/* Sistema de Alertas */}
      <AlertSystem
        alerts={deduplicatedAlerts}
        onAcknowledge={handleAcknowledgeAlert}
        onSnooze={handleSnoozeAlert}
      />

      {/* Mini-Mapa — hide in standalone / embedded */}
      {!isStandalone && !isEmbedded && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 200,
            background: colors.surface.base,
          }}
        >
          <MiniMap
            tables={tables}
            currentTableId={tableId}
            onTableClick={handleTableClickFromMap}
            area="Área 1"
          />
        </div>
      )}

      {/* ─── Last.app Header ─── */}
      <div
        style={{
          position: "sticky",
          top: isStandalone || isEmbedded ? 0 : 120,
          background: "#0a0a0a",
          borderBottom: `1px solid #27272a`,
          zIndex: 100,
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Back button */}
          <button
            onClick={() => (onBack ? onBack() : navigate("/app/waiter"))}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "none",
              background: SURFACE,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: "#e4e4e7",
              flexShrink: 0,
            }}
          >
            ←
          </button>

          {/* Table name + status badge */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#ffffff" }}>
              {isStandalone
                ? t("tablePanel.counterSale")
                : t("tablePanel.tableNumber", { number: table.number })}
            </div>
          </div>

          {!isStandalone && (
            <div
              style={{
                background:
                  table.status === TableStatus.OCCUPIED
                    ? BADGE_BLUE
                    : "#27272a",
                color:
                  table.status === TableStatus.OCCUPIED ? "#ffffff" : "#a1a1aa",
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 12,
                whiteSpace: "nowrap",
              }}
            >
              {table.status === TableStatus.OCCUPIED
                ? t("tablePanel.occupied", { minutes: seatedMinutes ?? 0 })
                : t("tablePanel.free")}
            </div>
          )}

          {/* Exception report button */}
          <button
            onClick={() => setShowExceptionModal(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: pendingException
                ? `2px solid ${colors.warning.base}`
                : "none",
              background: pendingException
                ? `${colors.warning.base}30`
                : SURFACE,
              cursor: "pointer",
              fontSize: 16,
              color: pendingException ? colors.warning.base : "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              position: "relative",
            }}
            title={t("tablePanel.reportProblem")}
          >
            ⚠️
            {pendingException && (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: colors.warning.base,
                }}
              />
            )}
          </button>

          {/* Conta button */}
          <button
            onClick={
              permissions.canCloseRegister ? handleCloseBill : handleRequestBill
            }
            style={{
              height: 40,
              padding: "0 14px",
              borderRadius: 10,
              border: "none",
              background: ACCENT_GREEN,
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {permissions.canCloseRegister
              ? `💰 ${t("tablePanel.closeBill")}`
              : t("tablePanel.requestBill")}
          </button>
        </div>
      </div>

      {/* ─── Category Strip (pill chips) ─── */}
      <CategoryStrip
        categories={categories}
        selectedId={selectedCategory || undefined}
        onSelect={(categoryId) => {
          setSelectedCategory(
            categoryId === selectedCategory ? null : categoryId,
          );
          setSearchQuery(""); // clear search when picking category
        }}
      />

      {/* ─── Product Search ─── */}
      <div style={{ padding: "0 16px 8px" }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            data-testid="sovereign-waiter-search"
            placeholder={t("tablePanel.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim().length >= 2) {
                setSelectedCategory(null); // clear category filter when searching
              }
            }}
            style={{
              width: "100%",
              height: 40,
              borderRadius: 10,
              border: "1px solid #27272a",
              background: SURFACE,
              color: "#e4e4e7",
              fontSize: 14,
              padding: "0 12px 0 36px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 16,
              color: "#71717a",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                width: 24,
                height: 24,
                borderRadius: 12,
                border: "none",
                background: "#3f3f46",
                color: "#a1a1aa",
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ─── Product Grid (2 columns, photo tiles) ─── */}
      {(selectedCategory || searchQuery.trim().length >= 2) &&
        visibleProducts.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
              padding: 16,
            }}
          >
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                comments={visibleComments}
                variant="tile"
                onAdd={(quantity, commentIds) =>
                  handleAddItem(product.id, quantity, commentIds)
                }
              />
            ))}
          </div>
        )}

      {/* Sem resultados de pesquisa */}
      {searchQuery.trim().length >= 2 && visibleProducts.length === 0 && (
        <div
          style={{
            padding: 48,
            textAlign: "center",
            color: "#52525b",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 14 }}>
            {t("tablePanel.noProductsFound", { query: searchQuery })}
          </div>
        </div>
      )}

      {/* Estado Vazio */}
      {!selectedCategory && searchQuery.trim().length < 2 && (
        <div
          style={{
            padding: 48,
            textAlign: "center",
            color: "#52525b",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>👆</div>
          <div style={{ fontSize: 14 }}>{t("tablePanel.selectCategory")}</div>
        </div>
      )}

      {/* ─── Order Bar (bottom panel) with Seat Tabs + Actions ─── */}
      {orderItems.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: isEmbedded ? 0 : 56,
            left: 0,
            right: 0,
            maxWidth: 600,
            margin: "0 auto",
            background: "#09090b",
            borderTop: `1px solid #27272a`,
            padding: "10px 16px 16px",
            zIndex: 150,
          }}
        >
          {/* Seat tabs */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 10,
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {[
              { id: "shared", label: t("tablePanel.shared") },
              ...Array.from({ length: seatCount }, (_, i) => ({
                id: `seat-${i + 1}`,
                label: t("tablePanel.seat", { number: i + 1 }),
              })),
            ].map((seat) => {
              const isActive = activeSeat === seat.id;
              const seatItems = orderItems.filter(
                (item) => item.seat === seat.id,
              );
              return (
                <button
                  key={seat.id}
                  onClick={() => setActiveSeat(seat.id)}
                  style={{
                    height: 28,
                    padding: "0 12px",
                    borderRadius: 14,
                    border: "none",
                    background: isActive ? ACCENT : "#27272a",
                    color: isActive ? "#ffffff" : "#a1a1aa",
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {seat.label}
                  {seatItems.length > 0 && (
                    <span
                      style={{
                        background: isActive
                          ? "rgba(255,255,255,0.25)"
                          : "#3f3f46",
                        borderRadius: 8,
                        padding: "0 5px",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {seatItems.length}
                    </span>
                  )}
                </button>
              );
            })}
            {/* + Lugar button */}
            <button
              onClick={() => setSeatCount((c) => c + 1)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                border: `1px dashed #3f3f46`,
                background: "transparent",
                color: "#71717a",
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              title={t("tablePanel.addSeat")}
            >
              +
            </button>
          </div>

          {/* Summary + total */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 12, color: "#a1a1aa" }}>
              {orderItems.length}{" "}
              {orderItems.length === 1
                ? t("tablePanel.itemCount_one", { count: 1 })
                : t("tablePanel.itemCount_other", { count: orderItems.length })}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#ffffff" }}>
              {formatAmount(totalAmount)}
            </div>
          </div>

          {/* Action buttons row */}
          <div style={{ display: "flex", gap: 8 }}>
            {/* Primary: Enviar Pedido */}
            <button
              type="button"
              data-testid="sovereign-waiter-send-order"
              onClick={handleSendOrder}
              disabled={sending}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                border: "none",
                background: ACCENT,
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 700,
                cursor: sending ? "wait" : "pointer",
                opacity: sending ? 0.7 : 1,
              }}
            >
              {sending
                ? t("tablePanel.processing")
                : isStandalone
                ? `💸 ${t("tablePanel.chargeButton")}`
                : t("tablePanel.sendOrder")}
            </button>

            {/* Secondary: Cobrar */}
            {!isStandalone && (
              <button
                onClick={
                  permissions.canCloseRegister
                    ? handleCloseBill
                    : handleRequestBill
                }
                style={{
                  width: 80,
                  height: 48,
                  borderRadius: 12,
                  border: "none",
                  background: ACCENT_GREEN,
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {t("tablePanel.chargeButton")}
              </button>
            )}

            {/* Print icon */}
            <button
              onClick={() => window.print()}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                border: "none",
                background: "#27272a",
                color: "#a1a1aa",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              title={t("tablePanel.print")}
            >
              🖨️
            </button>
          </div>
        </div>
      )}

      {paymentModalOrderId &&
        (() => {
          const order = orders.find((o) => o.id === paymentModalOrderId);
          if (!order) return null;
          return (
            <PaymentModal
              orderId={order.id}
              restaurantId={tenantId || ""}
              orderTotal={order.total}
              onPay={async (method, _intentId, tipCents) => {
                try {
                  const payload: any = { method };
                  if (tipCents && tipCents > 0) payload.tip_cents = tipCents;
                  await performOrderAction(order.id, "pay", payload);
                  await getActiveOrders();
                  success(t("toast.orderPaidSuccess"));
                  setPaymentModalOrderId(null);
                } catch (err: any) {
                  warning(err?.message || t("toast.errorPayment"));
                }
              }}
              onCancel={() => setPaymentModalOrderId(null)}
              isTrialMode={false}
            />
          );
        })()}

      {/* Exception Report Modal */}
      <ExceptionReportModal
        isOpen={showExceptionModal}
        onClose={() => {
          setShowExceptionModal(false);
          setPendingException(true);
          warning(t("toast.awaitingDecision"));
        }}
        orderId={activeOrder?.id || `table-${tableId}`}
        tableNumber={table?.number || 0}
        items={
          activeOrder?.items.map((i) => ({ id: i.id, name: i.name })) || []
        }
      />

      {!isEmbedded && <BottomNavBar />}
    </div>
  );
}
