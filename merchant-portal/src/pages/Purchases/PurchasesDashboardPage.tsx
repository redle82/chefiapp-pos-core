/**
 * PurchasesDashboardPage - Dashboard de Compras
 *
 * Mostra sugestões, pedidos e fornecedores
 */

import { useEffect, useState } from "react";
import { DataModeBanner } from "../../components/DataModeBanner";
import { PurchaseOrdersList } from "../../components/Purchases/PurchaseOrdersList";
import { PurchaseSuggestions } from "../../components/Purchases/PurchaseSuggestions";
import { SuppliersList } from "../../components/Purchases/SuppliersList";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import {
  purchaseEngine,
  type PurchaseOrder,
  type Supplier,
} from "../../core/purchases/PurchaseEngine";
import { GlobalLoadingView } from "../../ui/design-system/components";

export function PurchasesDashboardPage() {
  const { runtime } = useRestaurantRuntime();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string>("");

  useEffect(() => {
    const loadData = async (id: string) => {
      try {
        const [ordersData, suppliersData] = await Promise.all([
          purchaseEngine.listPurchaseOrders(id, { limit: 10 }),
          purchaseEngine.listSuppliers(id),
        ]);

        setOrders(ordersData);
        setSuppliers(suppliersData);
      } catch (error) {
        console.error("Error loading purchases data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (runtime.restaurant_id) {
      setRestaurantId(runtime.restaurant_id);
      loadData(runtime.restaurant_id);
    }
  }, [runtime.restaurant_id]);

  const handleGenerateSuggestions = async () => {
    if (!restaurantId) return;

    try {
      const count = await purchaseEngine.generateSuggestions(restaurantId);
      alert(`${count} sugestões geradas`);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      alert("Erro ao gerar sugestões");
    }
  };

  if (loading || runtime.loading || !restaurantId) {
    return (
      <GlobalLoadingView
        message="Carregando compras..."
        layout="portal"
        variant="fullscreen"
      />
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <DataModeBanner dataMode={runtime.dataMode} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 600 }}>Compras</h1>
        <button
          onClick={handleGenerateSuggestions}
          style={{
            padding: "8px 16px",
            backgroundColor: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🔍 Gerar Sugestões
        </button>
      </div>

      {/* Sugestões */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
          Sugestões de Compra
        </h2>
        <PurchaseSuggestions restaurantId={restaurantId} />
      </div>

      {/* Pedidos */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
          Pedidos de Compra
        </h2>
        <PurchaseOrdersList orders={orders} />
      </div>

      {/* Fornecedores */}
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
          Fornecedores
        </h2>
        <SuppliersList suppliers={suppliers} />
      </div>
    </div>
  );
}
