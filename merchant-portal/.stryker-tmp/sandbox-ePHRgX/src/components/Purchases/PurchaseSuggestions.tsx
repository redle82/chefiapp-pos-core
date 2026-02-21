/**
 * PurchaseSuggestions - Lista de Sugestões de Compra
 */
// @ts-nocheck


import { useEffect, useState } from "react";
import {
  purchaseEngine,
  type PurchaseSuggestion,
} from "../../core/purchases/PurchaseEngine";
import styles from "./PurchaseSuggestions.module.css";

interface Props {
  restaurantId: string;
}

export function PurchaseSuggestions({ restaurantId }: Props) {
  const [suggestions, setSuggestions] = useState<PurchaseSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const data = await purchaseEngine.listSuggestions(restaurantId, {
          status: ["pending"],
        });
        setSuggestions(data);
      } catch (error) {
        console.error("Error loading suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      loadSuggestions();
    }
  }, [restaurantId]);

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  if (suggestions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>✅</div>
        <p>Nenhuma sugestão pendente</p>
      </div>
    );
  }

  return (
    <div className={styles.suggestionsList}>
      {suggestions.map((suggestion) => (
        <div key={suggestion.id} className={styles.suggestionCard}>
          <div className={styles.cardContent}>
            <div className={styles.cardBody}>
              <h3 className={styles.suggestionTitle}>{suggestion.reason}</h3>
              <p className={styles.suggestionDetails}>
                Quantidade sugerida: {suggestion.suggestedQuantity}{" "}
                {suggestion.currentStock !== undefined &&
                  `(Estoque atual: ${suggestion.currentStock})`}
              </p>
              {suggestion.priority === "urgent" && (
                <span className={styles.urgentBadge}>URGENTE</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
