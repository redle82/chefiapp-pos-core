/**
 * TableActionsModal — Gap #10 (Competitive)
 *
 * Modal for table operations: Transfer, Merge, Split.
 *
 * - **Transfer**: Move entire order from source table to destination table.
 * - **Merge**: Combine two table orders into one (items from B added to A).
 * - **Split**: Move selected items from an order to a new order on another table.
 *
 * All operations use PostgREST PATCH on gm_orders / gm_order_items.
 */

import React, { useCallback, useMemo, useState } from "react";
import type { Order } from "../../../core/contracts/Order";
import { useCurrency } from "../../../core/currency/useCurrency";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import { colors } from "../../../ui/design-system/tokens/colors";
import { spacing } from "../../../ui/design-system/tokens/spacing";
import type { Table } from "../context/TableContext";

type TableAction = "transfer" | "merge" | "split";

interface TableActionsModalProps {
  /** The table the user long-pressed / right-clicked */
  sourceTable: Table;
  /** All tables from context */
  tables: Table[];
  /** All active (non-paid / non-cancelled) orders */
  orders: Order[];
  /** Refresh orders + tables after mutation */
  onComplete: () => void;
  /** Close modal */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const btnStyle = (bg: string, active = true): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  padding: "12px 16px",
  fontSize: 14,
  fontWeight: 600,
  border: "none",
  borderRadius: 8,
  cursor: active ? "pointer" : "not-allowed",
  backgroundColor: active ? bg : "#d1d5db",
  color: "#fff",
  opacity: active ? 1 : 0.5,
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TableActionsModal: React.FC<TableActionsModalProps> = ({
  sourceTable,
  tables,
  orders,
  onComplete,
  onClose,
}) => {
  const { formatAmount } = useCurrency();
  const [action, setAction] = useState<TableAction | null>(null);
  const [targetTableId, setTargetTableId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(),
  );
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Source order (active order on source table)
  const sourceOrder = useMemo(
    () =>
      orders.find(
        (o) =>
          o.tableId === sourceTable.id &&
          o.status !== "paid" &&
          o.status !== "cancelled",
      ),
    [orders, sourceTable.id],
  );

  // Target table object
  const targetTable = useMemo(
    () => tables.find((t) => t.id === targetTableId),
    [tables, targetTableId],
  );

  // Target order (active order on target table, for merge)
  const targetOrder = useMemo(
    () =>
      targetTableId
        ? orders.find(
            (o) =>
              o.tableId === targetTableId &&
              o.status !== "paid" &&
              o.status !== "cancelled",
          )
        : null,
    [orders, targetTableId],
  );

  // Available target tables (exclude source)
  const availableTargets = useMemo(
    () => tables.filter((t) => t.id !== sourceTable.id),
    [tables, sourceTable.id],
  );

  // ── Transfer ──────────────────────────────────────────

  const handleTransfer = useCallback(async () => {
    if (!sourceOrder || !targetTableId || !targetTable) return;
    setBusy(true);
    setFeedback(null);

    try {
      // PATCH order: update table_id + table_number
      const { error } = await dockerCoreClient
        .from("gm_orders")
        .update({
          table_id: targetTableId,
          table_number: targetTable.number,
        })
        .eq("id", sourceOrder.id);

      if (error) throw error;

      // Update table statuses
      await dockerCoreClient
        .from("gm_tables")
        .update({ status: "free", seated_at: null })
        .eq("id", sourceTable.id);

      await dockerCoreClient
        .from("gm_tables")
        .update({ status: "occupied", seated_at: new Date().toISOString() })
        .eq("id", targetTableId);

      setFeedback(
        `Pedido transferido da Mesa ${sourceTable.number} para Mesa ${targetTable.number}`,
      );
      setTimeout(() => {
        onComplete();
        onClose();
      }, 800);
    } catch (err) {
      console.error("[TableActions] Transfer failed:", err);
      setFeedback("Erro ao transferir pedido");
    } finally {
      setBusy(false);
    }
  }, [
    sourceOrder,
    targetTableId,
    targetTable,
    sourceTable,
    onComplete,
    onClose,
  ]);

  // ── Merge ─────────────────────────────────────────────

  const handleMerge = useCallback(async () => {
    if (!sourceOrder || !targetOrder) return;
    setBusy(true);
    setFeedback(null);

    try {
      // Move all items from source order to target order
      const { error: itemsErr } = await dockerCoreClient
        .from("gm_order_items")
        .update({ order_id: targetOrder.id })
        .eq("order_id", sourceOrder.id);

      if (itemsErr) throw itemsErr;

      // Cancel the now-empty source order
      const { error: cancelErr } = await dockerCoreClient
        .from("gm_orders")
        .update({ status: "CANCELLED" })
        .eq("id", sourceOrder.id);

      if (cancelErr) throw cancelErr;

      // Free source table
      await dockerCoreClient
        .from("gm_tables")
        .update({ status: "free", seated_at: null })
        .eq("id", sourceTable.id);

      setFeedback(
        `Pedido da Mesa ${sourceTable.number} fundido com Mesa ${targetTable?.number}`,
      );
      setTimeout(() => {
        onComplete();
        onClose();
      }, 800);
    } catch (err) {
      console.error("[TableActions] Merge failed:", err);
      setFeedback("Erro ao fundir pedidos");
    } finally {
      setBusy(false);
    }
  }, [sourceOrder, targetOrder, sourceTable, targetTable, onComplete, onClose]);

  // ── Split ─────────────────────────────────────────────

  const handleSplit = useCallback(async () => {
    if (
      !sourceOrder ||
      !targetTableId ||
      !targetTable ||
      selectedItemIds.size === 0
    )
      return;
    setBusy(true);
    setFeedback(null);

    try {
      // 1. Create a new order on the target table
      const newOrderPayload = {
        restaurant_id: sourceTable.restaurant_id,
        table_id: targetTableId,
        table_number: targetTable.number,
        status: "OPEN",
      };

      const { data: newOrderData, error: newOrderErr } = await dockerCoreClient
        .from("gm_orders")
        .insert(newOrderPayload)
        .select("id")
        .single();

      if (newOrderErr || !newOrderData)
        throw newOrderErr || new Error("No order returned");

      const newOrderId = (newOrderData as { id: string }).id;

      // 2. Move selected items to the new order
      for (const itemId of selectedItemIds) {
        await dockerCoreClient
          .from("gm_order_items")
          .update({ order_id: newOrderId })
          .eq("id", itemId);
      }

      // 3. Mark target table as occupied
      await dockerCoreClient
        .from("gm_tables")
        .update({ status: "occupied", seated_at: new Date().toISOString() })
        .eq("id", targetTableId);

      // 4. If all items moved, cancel source order + free table
      const remainingItems = sourceOrder.items.filter(
        (i) => !selectedItemIds.has(i.id),
      );

      if (remainingItems.length === 0) {
        await dockerCoreClient
          .from("gm_orders")
          .update({ status: "CANCELLED" })
          .eq("id", sourceOrder.id);

        await dockerCoreClient
          .from("gm_tables")
          .update({ status: "free", seated_at: null })
          .eq("id", sourceTable.id);
      }

      setFeedback(
        `${selectedItemIds.size} item(ns) movido(s) para Mesa ${targetTable.number}`,
      );
      setTimeout(() => {
        onComplete();
        onClose();
      }, 800);
    } catch (err) {
      console.error("[TableActions] Split failed:", err);
      setFeedback("Erro ao dividir pedido");
    } finally {
      setBusy(false);
    }
  }, [
    sourceOrder,
    targetTableId,
    targetTable,
    selectedItemIds,
    sourceTable,
    onComplete,
    onClose,
  ]);

  // Toggle item selection for split
  const toggleItem = (itemId: string) =>
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });

  // ── Render ──────────────────────────────────────────────

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: colors.surface.layer1,
          borderRadius: 12,
          padding: spacing[6],
          width: 440,
          maxWidth: "90vw",
          maxHeight: "80vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: spacing[4],
        }}
      >
        {/* Header */}
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: colors.text.primary,
            }}
          >
            Ações da Mesa {sourceTable.number}
          </div>
          <div style={{ fontSize: 13, color: colors.text.secondary }}>
            {sourceOrder
              ? `Pedido ativo: ${sourceOrder.items.length} item(ns)`
              : "Sem pedido ativo"}
          </div>
        </div>

        {/* No order guard */}
        {!sourceOrder && (
          <div
            style={{
              textAlign: "center",
              padding: 20,
              color: colors.text.secondary,
              fontSize: 14,
            }}
          >
            Esta mesa não tem pedido ativo para transferir, fundir ou dividir.
          </div>
        )}

        {/* Action selection */}
        {sourceOrder && !action && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing[2],
            }}
          >
            <button
              onClick={() => setAction("transfer")}
              style={btnStyle("#6366f1")}
            >
              🔀 Transferir Mesa
            </button>
            <button
              onClick={() => setAction("merge")}
              style={btnStyle("#10b981")}
            >
              🔗 Fundir com Outra Mesa
            </button>
            <button
              onClick={() => setAction("split")}
              style={btnStyle("#f59e0b")}
            >
              ✂️ Dividir Pedido
            </button>
          </div>
        )}

        {/* ── Transfer panel ── */}
        {action === "transfer" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing[3],
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: colors.text.primary,
              }}
            >
              Transferir pedido para qual mesa?
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: 8,
              }}
            >
              {availableTargets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTargetTableId(t.id)}
                  style={{
                    padding: "10px 8px",
                    fontSize: 13,
                    fontWeight: 600,
                    border:
                      targetTableId === t.id
                        ? "2px solid #6366f1"
                        : `1px solid ${colors.border.subtle}`,
                    borderRadius: 8,
                    backgroundColor:
                      targetTableId === t.id ? "#eef2ff" : "transparent",
                    cursor: "pointer",
                    color: colors.text.primary,
                  }}
                >
                  Mesa {t.number}
                </button>
              ))}
            </div>
            <button
              onClick={handleTransfer}
              disabled={!targetTableId || busy}
              style={btnStyle("#6366f1", !!targetTableId && !busy)}
            >
              {busy ? "Transferindo..." : "Confirmar Transferência"}
            </button>
          </div>
        )}

        {/* ── Merge panel ── */}
        {action === "merge" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing[3],
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: colors.text.primary,
              }}
            >
              Fundir com qual mesa? (deve ter pedido ativo)
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: 8,
              }}
            >
              {availableTargets
                .filter((t) => t.status === "occupied")
                .map((t) => {
                  const hasOrder = orders.some(
                    (o) =>
                      o.tableId === t.id &&
                      o.status !== "paid" &&
                      o.status !== "cancelled",
                  );
                  return (
                    <button
                      key={t.id}
                      onClick={() => hasOrder && setTargetTableId(t.id)}
                      disabled={!hasOrder}
                      style={{
                        padding: "10px 8px",
                        fontSize: 13,
                        fontWeight: 600,
                        border:
                          targetTableId === t.id
                            ? "2px solid #10b981"
                            : `1px solid ${colors.border.subtle}`,
                        borderRadius: 8,
                        backgroundColor:
                          targetTableId === t.id ? "#ecfdf5" : "transparent",
                        cursor: hasOrder ? "pointer" : "not-allowed",
                        color: hasOrder
                          ? colors.text.primary
                          : colors.text.secondary,
                        opacity: hasOrder ? 1 : 0.5,
                      }}
                    >
                      Mesa {t.number}
                    </button>
                  );
                })}
            </div>
            {targetTableId && targetOrder && (
              <div
                style={{
                  fontSize: 12,
                  color: colors.text.secondary,
                  padding: 8,
                  borderRadius: 6,
                  backgroundColor: colors.surface.layer2,
                }}
              >
                Mesa {sourceTable.number} ({sourceOrder?.items.length} itens) →
                Mesa {targetTable?.number} ({targetOrder.items.length} itens)
              </div>
            )}
            <button
              onClick={handleMerge}
              disabled={!targetOrder || busy}
              style={btnStyle("#10b981", !!targetOrder && !busy)}
            >
              {busy ? "Fundindo..." : "Confirmar Fusão"}
            </button>
          </div>
        )}

        {/* ── Split panel ── */}
        {action === "split" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing[3],
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: colors.text.primary,
              }}
            >
              Selecione itens para mover
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                maxHeight: 200,
                overflowY: "auto",
              }}
            >
              {sourceOrder?.items.map((item) => {
                const selected = selectedItemIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      fontSize: 13,
                      border: selected
                        ? "2px solid #f59e0b"
                        : `1px solid ${colors.border.subtle}`,
                      borderRadius: 8,
                      backgroundColor: selected ? "#fffbeb" : "transparent",
                      cursor: "pointer",
                      color: colors.text.primary,
                      textAlign: "left",
                    }}
                  >
                    <span>
                      {selected ? "☑ " : "☐ "}
                      {item.quantity}x {item.name}
                    </span>
                    <span
                      style={{ fontSize: 12, color: colors.text.secondary }}
                    >
                      {formatAmount(item.price)}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedItemIds.size > 0 && (
              <>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: colors.text.primary,
                  }}
                >
                  Mover para qual mesa?
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(100px, 1fr))",
                    gap: 8,
                  }}
                >
                  {availableTargets
                    .filter((t) => t.status === "free")
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTargetTableId(t.id)}
                        style={{
                          padding: "10px 8px",
                          fontSize: 13,
                          fontWeight: 600,
                          border:
                            targetTableId === t.id
                              ? "2px solid #f59e0b"
                              : `1px solid ${colors.border.subtle}`,
                          borderRadius: 8,
                          backgroundColor:
                            targetTableId === t.id ? "#fffbeb" : "transparent",
                          cursor: "pointer",
                          color: colors.text.primary,
                        }}
                      >
                        Mesa {t.number}
                      </button>
                    ))}
                </div>
              </>
            )}

            <button
              onClick={handleSplit}
              disabled={selectedItemIds.size === 0 || !targetTableId || busy}
              style={btnStyle(
                "#f59e0b",
                selectedItemIds.size > 0 && !!targetTableId && !busy,
              )}
            >
              {busy ? "Dividindo..." : `Mover ${selectedItemIds.size} item(ns)`}
            </button>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div
            style={{
              textAlign: "center",
              fontSize: 13,
              fontWeight: 600,
              color: feedback.startsWith("Erro")
                ? "#ef4444"
                : colors.success.base,
            }}
          >
            {feedback}
          </div>
        )}

        {/* Back / Close */}
        <div style={{ display: "flex", gap: 8 }}>
          {action && (
            <button
              onClick={() => {
                setAction(null);
                setTargetTableId(null);
                setSelectedItemIds(new Set());
                setFeedback(null);
              }}
              style={{
                flex: 1,
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 600,
                border: `1px solid ${colors.border.subtle}`,
                borderRadius: 8,
                cursor: "pointer",
                backgroundColor: "transparent",
                color: colors.text.secondary,
              }}
            >
              ← Voltar
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 600,
              border: `1px solid ${colors.border.subtle}`,
              borderRadius: 8,
              cursor: "pointer",
              backgroundColor: "transparent",
              color: colors.text.secondary,
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
