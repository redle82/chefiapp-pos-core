/**
 * Employee KDS Intelligent - KDS Inteligente
 *
 * Pergunta: "Onde está o gargalo?"
 *
 * Componentes:
 * - Itens por estação (BAR / KITCHEN / etc.)
 * - Tempo por item
 * - Agrupamento inteligente
 * - Destaque automático de risco
 * - Sugestão de ação (IA)
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomTabs } from "../../components/navigation/BottomTabs";
import { Header } from "../../components/navigation/Header";
import styles from "./KDSIntelligentPage.module.css";

export function EmployeeKDSIntelligentPage() {
  const navigate = useNavigate();
  const [selectedStation, setSelectedStation] = useState<
    "BAR" | "KITCHEN" | "DESSERT"
  >("BAR");

  // TODO: Integrar com KDS real
  // TODO: Buscar itens por estação
  // TODO: Calcular tempo por item
  // TODO: Agrupamento inteligente
  // TODO: Buscar sugestões da IA

  const items = {
    BAR: [
      {
        id: "1",
        name: "Caipirinha",
        table: "Mesa 5",
        time: "18min / 10min",
        status: "delayed",
        canGroup: false,
      },
      {
        id: "2",
        name: "Mojito",
        table: "Mesa 12",
        time: "8min / 10min",
        status: "warning",
        canGroup: false,
      },
      {
        id: "3",
        name: "Gin Tônica",
        table: "Mesa 8",
        time: "5min / 10min",
        status: "ready",
        canGroup: false,
      },
    ],
    KITCHEN: [
      {
        id: "4",
        name: "Hambúrguer",
        table: "Mesa 3",
        time: "12min / 15min",
        status: "in_progress",
        canGroup: true,
      },
      {
        id: "5",
        name: "Hambúrguer",
        table: "Mesa 7",
        time: "10min / 15min",
        status: "in_progress",
        canGroup: true,
      },
    ],
    DESSERT: [],
  };

  const currentItems = items[selectedStation];
  const delayedItems = currentItems.filter((item) => item.status === "delayed");
  const groupedItems = currentItems.filter((item) => item.canGroup);

  const aiSuggestion =
    delayedItems.length > 0
      ? {
          message: `${delayedItems[0].name} atrasado: falta limão. Repor estoque urgente.`,
          actions: ["Ver estoque", "Bloquear item"],
        }
      : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delayed":
        return "#dc3545";
      case "warning":
        return "#ffc107";
      case "ready":
        return "#28a745";
      default:
        return "#667eea";
    }
  };

  const getStatusClassName = (status: string) => {
    switch (status) {
      case "delayed":
        return styles.statusDelayed;
      case "warning":
        return styles.statusWarning;
      case "ready":
        return styles.statusReady;
      default:
        return styles.statusDefault;
    }
  };

  const getStatusBorderClassName = (status: string) => {
    switch (status) {
      case "delayed":
        return styles.borderDelayed;
      case "warning":
        return styles.borderWarning;
      case "ready":
        return styles.borderReady;
      default:
        return styles.borderDefault;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "delayed":
        return "ATRASADO";
      case "warning":
        return "Em preparo";
      case "ready":
        return "Pronto";
      default:
        return "Em preparo";
    }
  };

  return (
    <div className={styles.page}>
      <Header
        title="KDS Inteligente"
        subtitle="Onde está o gargalo"
        onBack={() => navigate("/employee/operation")}
      />

      <div className={styles.content}>
        {/* Seleção de Estação */}
        <div className={styles.stationSelector}>
          {(["BAR", "KITCHEN", "DESSERT"] as const).map((station) => (
            <button
              key={station}
              onClick={() => setSelectedStation(station)}
              className={`${styles.stationButton} ${
                selectedStation === station ? styles.stationButtonActive : ""
              }`}
            >
              {station}
            </button>
          ))}
        </div>

        {/* Sugestão IA */}
        {aiSuggestion && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>💡 SUGESTÃO (IA)</h3>
            <div className={styles.aiSuggestionCard}>
              <div className={styles.aiSuggestionMessage}>
                {aiSuggestion.message}
              </div>
              <div className={styles.actionsRow}>
                {aiSuggestion.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (action === "Ver estoque") {
                        navigate("/owner/purchases");
                      } else if (action === "Bloquear item") {
                        // TODO: Bloquear item
                      }
                    }}
                    className={styles.primarySmallButton}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Itens */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            {selectedStation} ({currentItems.length} itens)
          </h3>
          {currentItems.length === 0 ? (
            <div className={styles.emptyItemsCard}>Nenhum item pendente</div>
          ) : (
            <div className={styles.itemsList}>
              {/* Itens atrasados primeiro */}
              {currentItems
                .filter((item) => item.status === "delayed")
                .map((item) => (
                  <div
                    key={item.id}
                    className={`${styles.itemCard} ${
                      styles.itemCardDelayed
                    } ${getStatusBorderClassName(item.status)}`}
                  >
                    <div className={styles.itemHeader}>
                      <div>
                        <div className={styles.itemTitle}>
                          ⚠️ {item.name} - {item.table}
                        </div>
                        <div className={styles.itemMeta}>
                          Tempo: {item.time}
                        </div>
                      </div>
                      <span
                        className={`${styles.statusBadge} ${getStatusClassName(
                          item.status,
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        // TODO: Marcar como pronto
                      }}
                      className={`${
                        styles.itemActionButton
                      } ${getStatusClassName(item.status)}`}
                    >
                      Marcar pronto
                    </button>
                  </div>
                ))}

              {/* Outros itens */}
              {currentItems
                .filter((item) => item.status !== "delayed")
                .map((item) => (
                  <div
                    key={item.id}
                    className={`${styles.itemCard} ${getStatusBorderClassName(
                      item.status,
                    )}`}
                  >
                    <div className={styles.itemHeader}>
                      <div>
                        <div className={styles.itemTitle}>
                          {item.status === "ready" ? "✅" : "🟡"} {item.name} -{" "}
                          {item.table}
                        </div>
                        <div className={styles.itemMeta}>
                          Tempo: {item.time}
                        </div>
                      </div>
                      <span
                        className={`${styles.statusBadge} ${getStatusClassName(
                          item.status,
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (item.status === "ready") {
                          // TODO: Entregar
                        } else {
                          // TODO: Marcar como pronto
                        }
                      }}
                      className={`${
                        styles.itemActionButton
                      } ${getStatusClassName(item.status)}`}
                    >
                      {item.status === "ready" ? "Entregar" : "Marcar pronto"}
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Agrupamento Inteligente */}
        {groupedItems.length > 1 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📊 AGRUPAMENTO INTELIGENTE</h3>
            <div className={styles.groupingCard}>
              <div className={styles.groupingLead}>
                {groupedItems.length} {groupedItems[0].name} (mesmas mesas)
              </div>
              <div className={styles.groupingText}>Preparar juntas?</div>
              <div className={styles.actionsRow}>
                <button
                  onClick={() => {
                    // TODO: Agrupar e preparar
                  }}
                  className={styles.primarySmallButton}
                >
                  Sim
                </button>
                <button
                  onClick={() => {
                    // TODO: Não agrupar
                  }}
                  className={styles.secondarySmallButton}
                >
                  Não
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomTabs role="employee" />
    </div>
  );
}
