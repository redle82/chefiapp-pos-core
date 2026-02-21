/**
 * Owner Purchases - Lista de Compras (Auto)
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataModeBanner } from "../../components/DataModeBanner";
import { BottomTabs } from "../../components/navigation/BottomTabs";
import { Header } from "../../components/navigation/Header";
import { EmptyState } from "../../components/ui/EmptyState";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import type { ShoppingListItem } from "../../types/purchases";
import styles from "./PurchasesPage.module.css";

export function OwnerPurchasesPage() {
  const navigate = useNavigate();
  const { runtime } = useRestaurantRuntime();
  const [filter, setFilter] = useState<"auto" | "manual" | "all">("auto");

  // TODO: Integrar com generate_shopping_list
  // TODO: Buscar lista de compras
  // TODO: Integrar com estoque crítico
  const items: ShoppingListItem[] = []; // Placeholder

  return (
    <div className={styles.pageWrapper}>
      <DataModeBanner dataMode={runtime.dataMode} />
      <Header
        title="Compras"
        actions={
          <div className={styles.filterButtons}>
            <button
              onClick={() => setFilter("auto")}
              className={
                filter === "auto"
                  ? styles.filterButtonActive
                  : styles.filterButton
              }
            >
              Auto
            </button>
            <button
              onClick={() => setFilter("all")}
              className={
                filter === "all"
                  ? styles.filterButtonActive
                  : styles.filterButton
              }
            >
              Todas
            </button>
          </div>
        }
      />

      <div className={styles.content}>
        {items.length === 0 ? (
          <EmptyState
            title="Nenhum item na lista"
            message="A lista automática será gerada quando houver estoque crítico"
            action={{
              label: "Gerar lista automática",
              onPress: () => {
                // TODO: Gerar lista automática
              },
            }}
          />
        ) : (
          <>
            <div className={styles.itemsList}>
              {items.map((item) => (
                <div key={item.id} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <div>
                      <h3 className={styles.itemTitle}>
                        {item.ingredient_name}
                      </h3>
                      <div className={styles.itemQuantity}>
                        {item.quantity} {item.unit}
                      </div>
                    </div>
                    <span
                      className={`${styles.priorityBadge} ${
                        item.priority === "HIGH"
                          ? styles.priorityHigh
                          : item.priority === "MEDIUM"
                          ? styles.priorityMedium
                          : styles.priorityLow
                      }`}
                    >
                      {item.priority === "HIGH"
                        ? "Alta"
                        : item.priority === "MEDIUM"
                        ? "Média"
                        : "Baixa"}
                    </span>
                  </div>
                  <div className={styles.itemDetails}>
                    Motivo:{" "}
                    {item.reason === "STOCK_CRITICAL"
                      ? "Estoque crítico"
                      : item.reason === "DEMAND_FORECAST"
                      ? "Previsão de demanda"
                      : "Manual"}
                    {item.supplier_id &&
                      ` • Fornecedor: ${item.supplier_id.substring(0, 8)}`}
                  </div>
                  <button
                    onClick={() =>
                      navigate("/owner/purchases/create", { state: { item } })
                    }
                    className={styles.createOrderButton}
                  >
                    Criar Pedido
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.bottomActions}>
              <button
                onClick={() => navigate("/owner/purchases/suppliers")}
                className={styles.bottomButton}
              >
                Fornecedores
              </button>
              <button
                onClick={() => navigate("/owner/purchases/costs")}
                className={styles.bottomButton}
              >
                Custos & Margem
              </button>
            </div>
          </>
        )}
      </div>

      <BottomTabs role="owner" />
    </div>
  );
}
