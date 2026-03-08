/**
 * OPERACAO MINIMAL — Centro de Configuração Operacional
 *
 * Núcleo único de configuração: Menu, Tarefas, Mapa, Equipe.
 * Tudo versionado e integrado.
 */

import { useEffect, useState } from "react";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { MenuBuilderMinimal } from "../MenuBuilder/MenuBuilderMinimal";
import { MapBuilderMinimal } from "./MapBuilderMinimal";
import styles from "./OperacaoMinimal.module.css";
import { TaskBuilderMinimal } from "./TaskBuilderMinimal";

type OperacaoTab = "menu" | "tarefas" | "mapa" | "equipe";

export function OperacaoMinimal() {
  const { identity } = useRestaurantIdentity();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OperacaoTab>("menu");

  const DEFAULT_RESTAURANT_ID = "bbce08c7-63c0-473d-b693-ec2997f73a68";

  useEffect(() => {
    const id =
      identity.id ||
      getTabIsolated("chefiapp_restaurant_id") ||
      DEFAULT_RESTAURANT_ID;
    setRestaurantId(id);
    setLoading(false);
  }, [identity.id]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div>Carregando...</div>
      </div>
    );
  }

  const finalRestaurantId = restaurantId || DEFAULT_RESTAURANT_ID;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>⛙️ Configuração Operacional</h1>
        <div className={styles.subtitle}>
          Restaurante: {finalRestaurantId.slice(0, 8)}...
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab("menu")}
          className={activeTab === "menu" ? styles.tabActive : styles.tab}
        >
          🍽️ Menu
        </button>
        <button
          onClick={() => setActiveTab("tarefas")}
          className={activeTab === "tarefas" ? styles.tabActive : styles.tab}
        >
          🧠 Tarefas
        </button>
        <button
          onClick={() => setActiveTab("mapa")}
          className={activeTab === "mapa" ? styles.tabActive : styles.tab}
        >
          🗺️ Mapa
        </button>
        <button
          onClick={() => setActiveTab("equipe")}
          className={activeTab === "equipe" ? styles.tabActive : styles.tab}
        >
          👥 Equipe
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === "menu" && (
        <div className={styles.tabContent}>
          <MenuBuilderMinimal />
        </div>
      )}

      {activeTab === "tarefas" && (
        <div className={styles.tabContent}>
          <TaskBuilderMinimal restaurantId={finalRestaurantId} />
        </div>
      )}

      {activeTab === "mapa" && (
        <div className={styles.tabContent}>
          <MapBuilderMinimal restaurantId={finalRestaurantId} />
        </div>
      )}

      {activeTab === "equipe" && (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>👥 Equipe / Cargos</h2>
          <p className={styles.emptyText}>
            Configuração de equipe e cargos será implementada na próxima fase.
          </p>
        </div>
      )}
    </div>
  );
}
