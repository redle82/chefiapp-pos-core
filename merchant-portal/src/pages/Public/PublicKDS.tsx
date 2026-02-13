/**
 * PUBLIC KDS — KDS Público (Pedidos Prontos)
 *
 * REGRAS:
 * - Só mostra pedidos com status READY
 * - Nunca mostra tempo
 * - Nunca mostra atraso
 * - Nunca mostra em preparo
 * - Nunca mostra outros pedidos (só prontos)
 * - Identificação curta: número do pedido + mesa (se fizer sentido)
 *
 * Onde fica:
 * - Tela fora do restaurante
 * - TV
 * - Painel público
 * - Página web pública (sem login)
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type {
  CoreOrder,
  CoreOrderItem,
} from "../../core-boundary/docker-core/types";
import {
  readActiveOrders,
  readOrderItems,
} from "../../core-boundary/readers/OrderReader";
import styles from "./PublicKDS.module.css";

export function PublicKDS() {
  const { slug } = useParams<{ slug: string }>();
  const [readyOrders, setReadyOrders] = useState<
    (CoreOrder & { items: CoreOrderItem[] })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("Restaurante não encontrado");
      setLoading(false);
      return;
    }

    const loadReadyOrders = async () => {
      try {
        // Buscar restaurante por slug primeiro
        const { readRestaurantBySlug } = await import(
          "../../core-boundary/readers/RestaurantReader"
        );
        const restaurant = await readRestaurantBySlug(slug);

        if (!restaurant) {
          setError("Restaurante não encontrado");
          return;
        }

        // Buscar pedidos ativos
        const orders = await readActiveOrders(restaurant.id);

        // Filtrar apenas pedidos READY
        const ready = orders.filter((o) => o.status === "READY");

        // Carregar itens de cada pedido
        const ordersWithItems = await Promise.all(
          ready.map(async (order) => {
            const items = await readOrderItems(order.id);
            return {
              ...order,
              items: items || [],
            };
          }),
        );

        setReadyOrders(ordersWithItems);
        setError(null);
      } catch (e) {
        console.error("Error loading ready orders:", e);
        setError("Erro ao carregar pedidos prontos");
      } finally {
        setLoading(false);
      }
    };

    loadReadyOrders();

    // Polling a cada 10 segundos
    const interval = setInterval(loadReadyOrders, 10000);

    return () => clearInterval(interval);
  }, [slug]);

  if (loading) {
    return (
      <div className={styles.centerScreen}>
        <p className={styles.loadingText}>Carregando pedidos prontos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorScreen}>
        <p className={styles.errorText}>{error}</p>
      </div>
    );
  }

  if (readyOrders.length === 0) {
    return (
      <div className={styles.centerScreen}>
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon}>🔔</p>
          <p className={styles.emptyText}>Nenhum pedido pronto no momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageRoot}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Pedidos Prontos</h1>
          <p className={styles.headerCount}>
            {readyOrders.length} pedido{readyOrders.length !== 1 ? "s" : ""}{" "}
            pronto{readyOrders.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Orders Grid */}
        <div className={styles.ordersGrid}>
          {readyOrders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div>
                  <div className={styles.orderNumber}>
                    🔔 Pedido #
                    {order.number || order.short_id || order.id.slice(0, 8)}
                  </div>
                  {order.table_number && (
                    <div className={styles.orderTable}>
                      Mesa {order.table_number}
                    </div>
                  )}
                </div>
              </div>

              {/* Items (opcional - pode ser simplificado) */}
              {order.items.length > 0 && (
                <div className={styles.orderItems}>
                  <div className={styles.orderItemsCount}>
                    {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
