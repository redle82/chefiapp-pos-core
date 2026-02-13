/**
 * Owner Stock Real - Estoque Real
 *
 * Pergunta: "O que vai acabar e quando?"
 *
 * Componentes:
 * - Estoque atual
 * - Consumo real
 * - Previsão de ruptura
 * - Histórico de falhas
 * - Acesso direto a compras
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataModeBanner } from "../../components/DataModeBanner";
import { BottomTabs } from "../../components/navigation/BottomTabs";
import { Header } from "../../components/navigation/Header";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import styles from "./StockRealPage.module.css";

export function OwnerStockRealPage() {
  const navigate = useNavigate();
  const { runtime } = useRestaurantRuntime();
  const [filter, setFilter] = useState<"critical" | "attention" | "all">(
    "critical",
  );

  // TODO: Integrar com Core para buscar estoque real
  // TODO: Calcular consumo real
  // TODO: Prever ruptura
  // TODO: Buscar histórico de falhas

  const criticalItems = [
    {
      id: "1",
      name: "Tomate",
      current: 0,
      minimum: 10,
      unit: "kg",
      rupture: "AGORA",
      consumption: "2kg/hora",
    },
  ];

  const attentionItems = [
    {
      id: "2",
      name: "Limão",
      current: 2,
      minimum: 5,
      unit: "kg",
      rupture: "2h",
      consumption: "1kg/hora",
    },
  ];

  const consumptionHistory = [
    {
      name: "Tomate",
      consumed: 48,
      unit: "kg",
      average: "2kg/hora",
      peak: "4kg/hora (20h)",
    },
  ];

  const ruptureForecast = [
    { name: "Limão", time: "2h" },
    { name: "Cebola", time: "8h" },
    { name: "Alho", time: "12h" },
  ];

  const failureHistory = [
    {
      name: "Tomate",
      count: 3,
      period: "esta semana",
      last: "Hoje 14:30",
      cause: "Consumo acima do previsto",
    },
  ];

  const displayItems =
    filter === "critical"
      ? criticalItems
      : filter === "attention"
      ? attentionItems
      : [...criticalItems, ...attentionItems];

  return (
    <div className={styles.pageRoot}>
      <DataModeBanner dataMode={runtime.dataMode} />
      <Header
        title="Estoque Real"
        subtitle="O que vai acabar e quando"
        actions={
          <div className={styles.filterRow}>
            <button
              onClick={() => setFilter("critical")}
              className={`${styles.filterButton} ${
                filter === "critical"
                  ? styles.filterButtonCritical
                  : styles.filterButtonInactive
              }`}
            >
              Crítico
            </button>
            <button
              onClick={() => setFilter("attention")}
              className={`${styles.filterButton} ${
                filter === "attention"
                  ? styles.filterButtonAttention
                  : styles.filterButtonInactive
              }`}
            >
              Atenção
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`${styles.filterButton} ${
                filter === "all"
                  ? styles.filterButtonAll
                  : styles.filterButtonInactive
              }`}
            >
              Todos
            </button>
          </div>
        }
      />

      <div className={styles.pageContent}>
        {/* Itens Críticos/Atenção */}
        {displayItems.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {filter === "critical"
                ? "🔴 CRÍTICO"
                : filter === "attention"
                ? "🟡 ATENÇÃO"
                : "📦 ESTOQUE"}{" "}
              ({displayItems.length})
            </h3>
            <div className={styles.itemList}>
              {displayItems.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.itemCard} ${
                    item.current === 0
                      ? styles.itemCardCritical
                      : styles.itemCardAttention
                  }`}
                >
                  <div className={styles.itemHeader}>
                    <div>
                      <div className={styles.itemName}>
                        {item.name}: {item.current}
                        {item.unit} / {item.minimum}
                        {item.unit} mínimo
                      </div>
                      <div className={styles.itemMeta}>
                        Ruptura: {item.rupture}
                      </div>
                      <div className={styles.itemMeta}>
                        Consumo: {item.consumption}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/owner/purchases")}
                    className={`${styles.itemActionButton} ${
                      item.current === 0
                        ? styles.itemActionButtonCritical
                        : styles.itemActionButtonAttention
                    }`}
                  >
                    {item.current === 0 ? "Comprar agora" : "Adicionar à lista"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consumo Real */}
        {consumptionHistory.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              📊 CONSUMO REAL (últimas 24h)
            </h3>
            <div className={styles.consumptionList}>
              {consumptionHistory.map((item, index) => (
                <div key={index} className={styles.consumptionCard}>
                  <div className={styles.consumptionTitle}>
                    {item.name}: {item.consumed}
                    {item.unit} consumidos
                  </div>
                  <div className={styles.consumptionMeta}>
                    Média: {item.average}
                  </div>
                  <div className={styles.consumptionMeta}>
                    Pico: {item.peak}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previsão de Ruptura */}
        {ruptureForecast.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📈 PREVISÃO DE RUPTURA</h3>
            <div className={styles.ruptureCard}>
              <div className={styles.ruptureTitle}>Próximas 24h:</div>
              <div className={styles.ruptureList}>
                {ruptureForecast.map((item, index) => (
                  <div key={index} className={styles.ruptureItem}>
                    {item.name}: {item.time}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Histórico de Falhas */}
        {failureHistory.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📋 HISTÓRICO DE FALHAS</h3>
            <div className={styles.failureList}>
              {failureHistory.map((item, index) => (
                <div key={index} className={styles.failureCard}>
                  <div className={styles.failureTitle}>
                    {item.name}: {item.count}x {item.period}
                  </div>
                  <div className={styles.failureMeta}>Última: {item.last}</div>
                  <div className={styles.failureMeta}>Causa: {item.cause}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acesso Rápido */}
        <div className={styles.quickActions}>
          <button
            onClick={() => navigate("/owner/purchases")}
            className={styles.primaryActionButton}
          >
            Compras
          </button>
          <button
            onClick={() => navigate("/owner/purchases/suppliers")}
            className={styles.secondaryActionButton}
          >
            Fornecedores
          </button>
        </div>
      </div>

      <BottomTabs role="owner" />
    </div>
  );
}
