/**
 * SHOPPING LIST MINIMAL — Lista de Compras Automática
 *
 * Gera e exibe lista de compras baseada em estoque abaixo do mínimo.
 * Conectado ao sistema de estoque (gm_stock_levels).
 */
// @ts-nocheck


import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import type { ShoppingListItem } from "../../infra/readers/ShoppingListReader";
import { generateShoppingList } from "../../infra/readers/ShoppingListReader";
import { confirmPurchase } from "../../infra/writers/StockWriter";

export function ShoppingListMinimal() {
  const { runtime } = useRestaurantRuntime();
  const finalRestaurantId = runtime.restaurant_id;

  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null); // ingredient_id sendo confirmado
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null); // ingredient_id do modal aberto
  const [confirmQty, setConfirmQty] = useState<number>(0);

  const loadShoppingList = async () => {
    if (!finalRestaurantId) return;

    try {
      setLoading(true);
      setError(null);
      const list = await generateShoppingList(finalRestaurantId);
      setItems(list);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao gerar lista de compras",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (runtime.loading || !finalRestaurantId) return;
    loadShoppingList();
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadShoppingList, 30000);
    return () => clearInterval(interval);
  }, [finalRestaurantId, runtime.loading]);

  const handleConfirmPurchase = async (item: ShoppingListItem) => {
    if (!finalRestaurantId) return;

    try {
      setConfirming(item.ingredient_id);
      setError(null);

      const qtyToConfirm =
        confirmQty > 0 ? confirmQty : item.suggested_qty ?? 0;

      const result = await confirmPurchase(
        finalRestaurantId,
        item.ingredient_id,
        item.location_id,
        qtyToConfirm,
      );

      // Feedback visual
      if (result.tasks_closed > 0) {
        console.log(
          `✅ Compra confirmada! ${result.tasks_closed} tarefa(s) fechada(s).`,
        );
      }

      // Fechar modal e recarregar lista
      setShowConfirmModal(null);
      setConfirmQty(0);
      await loadShoppingList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao confirmar compra");
    } finally {
      setConfirming(null);
    }
  };

  const getUrgencyColor = (urgency: string | undefined) => {
    switch (urgency) {
      case "CRITICAL":
        return "#dc2626";
      case "HIGH":
        return "#ea580c";
      case "MEDIUM":
        return "#ca8a04";
      default:
        return "#6b7280";
    }
  };

  const getUrgencyLabel = (urgency: string | undefined) => {
    switch (urgency) {
      case "CRITICAL":
        return "🔴 Crítico";
      case "HIGH":
        return "🟠 Alto";
      case "MEDIUM":
        return "🟡 Médio";
      default:
        return "⚪ Normal";
    }
  };

  const criticalCount = items.filter((i) => i.urgency === "CRITICAL").length;
  const highCount = items.filter((i) => i.urgency === "HIGH").length;
  const totalCount = items.length;

  if (runtime.loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Carregando identidade do restaurante...</p>
      </div>
    );
  }

  if (!finalRestaurantId) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Restaurante não identificado. Faça login novamente.</p>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Gerando lista de compras...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
          🛒 Lista de Compras
        </h1>
        <button
          onClick={loadShoppingList}
          style={{
            padding: "8px 16px",
            backgroundColor: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          🔄 Atualizar
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fef2f2",
            borderRadius: "8px",
            border: "1px solid #fca5a5",
          }}
        >
          <div
            style={{ fontSize: "24px", fontWeight: "bold", color: "#dc2626" }}
          >
            {criticalCount}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Críticos</div>
        </div>
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fff7ed",
            borderRadius: "8px",
            border: "1px solid #fdba74",
          }}
        >
          <div
            style={{ fontSize: "24px", fontWeight: "bold", color: "#ea580c" }}
          >
            {highCount}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Altos</div>
        </div>
        <div
          style={{
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{ fontSize: "24px", fontWeight: "bold", color: "#374151" }}
          >
            {totalCount}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Total</div>
        </div>
      </div>

      {/* Shopping List */}
      {items.length === 0 ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            color: "#666",
          }}
        >
          <p style={{ fontSize: "18px", marginBottom: "8px" }}>
            ✅ Estoque em dia!
          </p>
          <p style={{ fontSize: "14px" }}>
            Todos os ingredientes estão acima do mínimo. Nenhuma compra
            necessária no momento.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {items.map((item) => (
            <div
              key={item.ingredient_id}
              style={{
                padding: "20px",
                backgroundColor: "#fff",
                border: `2px solid ${getUrgencyColor(item.urgency)}`,
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                      {item.ingredient_name}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: getUrgencyColor(item.urgency),
                        backgroundColor: `${getUrgencyColor(item.urgency)}20`,
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {getUrgencyLabel(item.urgency)}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginBottom: "8px",
                    }}
                  >
                    <div>
                      📊 Atual:{" "}
                      <strong>
                        {item.current_qty ?? item.qty} {item.unit}
                      </strong>
                    </div>
                    <div>
                      📉 Mínimo:{" "}
                      <strong>
                        {item.min_qty} {item.unit}
                      </strong>
                    </div>
                    <div>
                      📦 Déficit:{" "}
                      <strong>
                        {item.deficit ?? Math.max(0, item.min_qty - item.qty)}{" "}
                        {item.unit}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: getUrgencyColor(item.urgency),
                      padding: "8px",
                      backgroundColor: `${getUrgencyColor(item.urgency)}10`,
                      borderRadius: "4px",
                      marginTop: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    💡 Sugestão: Comprar{" "}
                    <strong>
                      {item.suggested_qty} {item.unit}
                    </strong>
                  </div>

                  <button
                    onClick={() => {
                      setConfirmQty(item.suggested_qty ?? 0);
                      setShowConfirmModal(item.ingredient_id);
                    }}
                    disabled={confirming === item.ingredient_id}
                    style={{
                      padding: "10px 20px",
                      backgroundColor:
                        confirming === item.ingredient_id
                          ? "#9ca3af"
                          : "#10b981",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor:
                        confirming === item.ingredient_id
                          ? "not-allowed"
                          : "pointer",
                      fontSize: "14px",
                      fontWeight: "bold",
                      width: "100%",
                    }}
                  >
                    {confirming === item.ingredient_id
                      ? "⏳ Confirmando..."
                      : "✅ Comprei"}
                  </button>
                </div>
              </div>

              {/* Modal de Confirmação */}
              {showConfirmModal === item.ingredient_id && (
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#fff",
                      padding: "24px",
                      borderRadius: "8px",
                      maxWidth: "400px",
                      width: "90%",
                    }}
                  >
                    <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
                      Confirmar Compra: {item.ingredient_name}
                    </h3>

                    <div style={{ marginBottom: "16px" }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          fontWeight: "bold",
                        }}
                      >
                        Quantidade recebida ({item.unit}):
                      </label>
                      <input
                        type="number"
                        value={confirmQty}
                        onChange={(e) =>
                          setConfirmQty(parseFloat(e.target.value) || 0)
                        }
                        min="0"
                        step="0.1"
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          fontSize: "16px",
                        }}
                        autoFocus
                      />
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginTop: "4px",
                        }}
                      >
                        Sugestão: {item.suggested_qty} {item.unit}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => {
                          setShowConfirmModal(null);
                          setConfirmQty(0);
                        }}
                        style={{
                          flex: 1,
                          padding: "10px",
                          backgroundColor: "#6b7280",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleConfirmPurchase(item)}
                        disabled={
                          confirmQty <= 0 || confirming === item.ingredient_id
                        }
                        style={{
                          flex: 1,
                          padding: "10px",
                          backgroundColor:
                            confirming === item.ingredient_id
                              ? "#9ca3af"
                              : "#10b981",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor:
                            confirming === item.ingredient_id
                              ? "not-allowed"
                              : "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        {confirming === item.ingredient_id
                          ? "Confirmando..."
                          : "Confirmar"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
