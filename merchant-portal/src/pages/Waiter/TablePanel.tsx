/**
 * TablePanel — Painel da Mesa (modo Adicionar Pedido)
 * Princípio: Topo fixo, grupos expandem, produtos aparecem, zero navegação profunda.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../ui/design-system/primitives/Button";
import { Text } from "../../ui/design-system/primitives/Text";
import { BottomNavBar } from "./components/BottomNavBar";
import type { Table } from "./types";
import { TableStatus } from "./types";
// import type { Category } from './components/CategoryStrip';
import {
  tpvEventBus,
  type DecisionMadePayload,
} from "../../core/tpv/TPVCentralEvents";
import { colors } from "../../ui/design-system/tokens/colors";
import { spacing } from "../../ui/design-system/tokens/spacing";
import { AlertSystem } from "./components/AlertSystem";
import { CategoryStrip } from "./components/CategoryStrip";
import { ExceptionReportModal } from "./components/ExceptionReportModal";
import { MiniMap } from "./components/MiniMap";
import type { /* Product, */ ProductComment } from "./components/ProductCard";
import { ProductCard } from "./components/ProductCard";
import { useWaiterCalls } from "./hooks/useWaiterCalls";

import { useTenant } from "../../core/tenant/TenantContext";
import { useMenuItems } from "../../hooks/useMenuItems";
import { useToast } from "../../ui/design-system";
import { useOrders } from "../TPV/context/OrderContextReal";
import { useTables } from "../TPV/context/TableContext";
// LEGACY / LAB — blocked in Docker mode
import { supabase } from "../../core/supabase";

import { useContextEngine } from "../../core/context";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  comments: string[];
  price: number;
}

interface TablePanelProps {
  tableId?: string;
}

export function TablePanel({ tableId: propTableId }: TablePanelProps) {
  const navigate = useNavigate();
  const params = useParams<{ tableId: string }>();
  // Resolve tableId from Prop or URL
  const tableId = propTableId || params.tableId;

  const { tenantId } = useTenant(); // Needed for hooks
  console.log("[TablePanel] Rendering. Tenant:", tenantId);
  const { permissions, role } = useContextEngine(); // 🧠 CONTEXT ENGINE
  console.log("[TablePanel] Context Role:", role);

  // Derived State
  const isStandalone = role === "owner" || role === "manager";

  // --- ACTIONS ---
  const handleCloseBill = () => {
    // STANDALONE MODE: Process payment directly
    if (
      confirm("💰 MODO STANDALONE: Processar pagamento e fechar mesa agora?")
    ) {
      success("✅ Pagamento Confirmado! Mesa Liberada.");
      // In real implementation: router.push('/payment/checkout')
    }
  };

  const handleRequestBill = () => {
    // EXECUTION MODE: Request bill from Central TPV
    success("Conta solicitada ao Caixa (TPV Central).");
    // TODO: Emit real event
  };

  // Real Hooks
  const { tables, loading: tablesLoading } = useTables();
  const { items: menuItems } = useMenuItems(tenantId);
  const { orders, createOrder, addItemToOrder } = useOrders(); // Inject Order Context

  // Resolve Table
  const table = useMemo(
    () => tables.find((t) => t.id === tableId),
    [tables, tableId]
  );

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [sending, setSending] = useState(false); // Loading state

  // Exception Reporting State
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [pendingException, setPendingException] = useState(false);
  const { success, warning } = useToast();

  // Resolve Active Order
  const activeOrder = useMemo(
    () =>
      orders.find(
        (o) =>
          o.tableId === tableId &&
          o.status !== "paid" &&
          o.status !== "cancelled"
      ),
    [orders, tableId]
  );

  // Listen for operator decisions on this table's orders
  useEffect(() => {
    const handleDecision = (event: any) => {
      const decision = event.payload as DecisionMadePayload;
      if (decision.tableNumber === table?.number) {
        // Decision received for this table
        setPendingException(false);
        success(
          `✅ Decisão: ${decision.action}${
            decision.message ? ` - ${decision.message}` : ""
          }`
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

  // Produtos da categoria selecionada
  const visibleProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return menuItems
      .filter((i) => i.category === selectedCategory)
      .map((i) => ({
        id: i.id,
        name: i.name,
        price: i.priceCents, // ProductCard expects price in cents (number)
        description: i.description,
        currency: "EUR",
        imageUrl: i.photoUrl,
        trackStock: i.trackStock,
        stockQuantity: i.stockQuantity,
      }));
  }, [selectedCategory, menuItems]);

  // Comentários da categoria selecionada (Mock for now)
  const visibleComments: ProductComment[] = [];

  if (!table) {
    if (tablesLoading) {
      return (
        <div style={{ padding: spacing[6], color: "white" }}>
          Carregando mesa...
        </div>
      );
    }
    return (
      <div style={{ padding: spacing[6] }}>
        <Text size="lg" color="destructive">
          Mesa não encontrada
        </Text>
        <Button
          onClick={() => navigate("/app/waiter")}
          style={{ marginTop: spacing[4] }}
        >
          Voltar ao Mapa
        </Button>
      </div>
    );
  }

  const seatedMinutes =
    table.status === "occupied" // Check lowercase if from DB? Type is 'free'|'occupied'
      ? 0 // TODO: DB doesn't store seatedAt? Table struct here has seats. Check TableContext.
      : null; // TableContext Table interface: status: 'free' | 'occupied' | 'reserved'.

  // Helper handling
  const handleAddItem = (
    productId: string,
    quantity: number,
    commentIds: string[]
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
    };

    setOrderItems((prev) => [...prev, newItem]);

    // Feedback: vibração simulada (visual)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleSendOrder = async () => {
    if (!table || orderItems.length === 0) return;
    setSending(true);

    try {
      // Obter autoria (user_id e role) para divisão de conta
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id || null;

      // Detectar contexto e role
      const isAppStaff =
        window.location.pathname.includes("/app/staff") ||
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
            })
          )
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
        success("💸 Venda Registrada! (Pagamento Confirmado)");
        // Future: Open Payment Selection Modal here
      } else {
        success("Pedido enviado para a cozinha! 👨‍🍳");
      }
    } catch (error) {
      console.error("Failed to send order:", error);
      warning("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleTableClickFromMap = (t: Table) => {
    if (t.id !== tableId) {
      navigate(`/app/waiter/table/${t.id}`);
    }
  };

  return (
    <div
      style={{
        paddingBottom: 100, // Espaço para barra inferior
        minHeight: "100vh",
        background: "#000",
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      {/* Sistema de Alertas */}
      <AlertSystem
        alerts={deduplicatedAlerts}
        onAcknowledge={handleAcknowledgeAlert}
        onSnooze={handleSnoozeAlert}
      />

      {/* Mini-Mapa Fixo no Topo - Hide in STANDALONE (Solo Mode) */}
      {!isStandalone && (
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

      {/* Topo Fixo */}
      <div
        style={{
          position: "sticky",
          top: isStandalone ? 0 : 120, // Adjust top if map is hidden
          background: colors.surface.base,
          borderBottom: `1px solid ${colors.border.subtle}`,
          zIndex: 100,
          padding: spacing[4],
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: spacing[2],
          }}
        >
          <button
            onClick={() => navigate("/app/waiter")}
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              color: colors.text.primary,
            }}
          >
            ←
          </button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <Text size="xl" weight="bold" color="primary">
              {isStandalone ? "Venda Balcão" : `Mesa ${table.number}`}
            </Text>
            {!isStandalone && (
              <Text size="sm" color="secondary">
                {table.status === TableStatus.OCCUPIED && seatedMinutes !== null
                  ? `Ocupada · ${seatedMinutes} min`
                  : "Livre"}
              </Text>
            )}
          </div>
          <div style={{ display: "flex", gap: spacing[2] }}>
            {/* Report Exception Button */}
            <button
              onClick={() => setShowExceptionModal(true)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                border: pendingException
                  ? `2px solid ${colors.warning.base}`
                  : "none",
                background: pendingException
                  ? `${colors.warning.base}30`
                  : "transparent",
                cursor: "pointer",
                fontSize: 20,
                color: pendingException
                  ? colors.warning.base
                  : colors.destructive.base,
                position: "relative",
              }}
              title="Reportar Problema"
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
            {/* CONTEXT ENGINE: Dynamic Action Button */}
            <Button
              tone={permissions.canCloseRegister ? "destructive" : "neutral"}
              onClick={
                permissions.canCloseRegister
                  ? handleCloseBill
                  : handleRequestBill
              }
              style={{ height: 44 }}
            >
              {permissions.canCloseRegister ? "💰 Fechar" : "✋ Conta"}
            </Button>
          </div>
        </div>

        {/* Resumo do Pedido */}
        {orderItems.length > 0 && (
          <div
            style={{
              padding: spacing[3],
              background: colors.surface.layer1,
              borderRadius: 8,
              marginTop: spacing[2],
              border: `1px solid ${colors.action.base}`,
            }}
          >
            <Text
              size="sm"
              weight="bold"
              color="primary"
              style={{ marginBottom: spacing[2] }}
            >
              Novo Pedido ({orderItems.length} itens)
            </Text>
            {orderItems.map((item) => (
              <Text
                key={item.id}
                size="xs"
                color="secondary"
                style={{ marginBottom: spacing[1] }}
              >
                {item.quantity}x {item.productName}
                {item.comments.length > 0 && ` (${item.comments.join(", ")})`}
              </Text>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: spacing[3],
                borderTop: `1px solid ${colors.border.subtle}`,
                paddingTop: spacing[2],
              }}
            >
              <Text size="lg" weight="bold" color="primary">
                Total:{" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "EUR",
                }).format(totalAmount / 100)}
              </Text>

              <Button
                tone={isStandalone ? "action" : "action"}
                onClick={handleSendOrder}
                disabled={sending}
              >
                {sending
                  ? "Processando..."
                  : isStandalone
                  ? "💸 Cobrar"
                  : "Enviar Pedido 🚀"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Grupos/Categorias */}
      <CategoryStrip
        categories={categories}
        selectedId={selectedCategory || undefined}
        onSelect={(categoryId) => {
          setSelectedCategory(
            categoryId === selectedCategory ? null : categoryId
          );
        }}
      />

      {/* Produtos da Categoria Selecionada */}
      {selectedCategory && (
        <div style={{ padding: spacing[4] }}>
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              comments={visibleComments}
              onAdd={(quantity, commentIds) =>
                handleAddItem(product.id, quantity, commentIds)
              }
            />
          ))}
        </div>
      )}

      {/* Estado Vazio: Selecionar Categoria */}
      {!selectedCategory && (
        <div
          style={{
            padding: spacing[8],
            textAlign: "center",
            color: colors.text.tertiary,
          }}
        >
          <Text size="lg" color="tertiary">
            👆 Selecione uma categoria acima
          </Text>
        </div>
      )}

      {/* Exception Report Modal */}
      <ExceptionReportModal
        isOpen={showExceptionModal}
        onClose={() => {
          setShowExceptionModal(false);
          setPendingException(true); // Mark as pending until decision received
          warning("Aguardando decisão do operador...");
        }}
        orderId={activeOrder?.id || `table-${tableId}`}
        tableNumber={table?.number || 0}
        items={
          activeOrder?.items.map((i) => ({ id: i.id, name: i.name })) || []
        }
      />

      <BottomNavBar />
    </div>
  );
}
