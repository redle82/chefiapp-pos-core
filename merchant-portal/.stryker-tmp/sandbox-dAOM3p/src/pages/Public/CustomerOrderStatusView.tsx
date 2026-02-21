/**
 * CUSTOMER ORDER STATUS VIEW — Status Individual do Cliente
 *
 * REGRAS:
 * - Cliente vê APENAS o pedido dele
 * - Estados simplificados (sem tempo, sem atraso)
 * - Nunca mostra outros pedidos
 * - Nunca mostra tempo exato
 * - Nunca mostra atraso
 *
 * Estados permitidos:
 * - Recebido (OPEN)
 * - Em preparo (PREPARING/IN_PREP)
 * - Quase pronto (ALMOST_READY)
 * - Pronto (READY)
 * - Entregue (DELIVERED)
 */
// @ts-nocheck


import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type {
  CoreOrder,
  CoreOrderItem,
} from "../../infra/docker-core/types";
import { readOrderById } from "../../infra/readers/OrderReader";
import { GlobalLoadingView } from "../../ui/design-system/components";
import styles from "./CustomerOrderStatusView.module.css";

type CustomerStatus =
  | "received"
  | "preparing"
  | "almost_ready"
  | "ready"
  | "delivered";

interface CustomerStatusView {
  status: CustomerStatus;
  message: string;
  icon: string;
}

// Validação mínima de UUID para evitar chamadas inválidas ao core (ex.: "<orderId>" em DEV)
function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function mapOrderStatusToCustomerStatus(
  orderStatus: string,
): CustomerStatusView {
  switch (orderStatus) {
    case "OPEN":
      return {
        status: "received",
        message: "Pedido recebido",
        icon: "✅",
      };
    case "PREPARING":
    case "IN_PREP":
      return {
        status: "preparing",
        message: "Em preparo",
        icon: "🍳",
      };
    case "READY":
      return {
        status: "ready",
        message: "Pronto",
        icon: "🔔",
      };
    case "CLOSED":
      return {
        status: "delivered",
        message: "Entregue",
        icon: "✅",
      };
    default:
      return {
        status: "preparing",
        message: "Em preparo",
        icon: "🍳",
      };
  }
}

function getStatusClass(status: CustomerStatus): string {
  switch (status) {
    case "received":
    case "ready":
      return styles.statusOk;
    case "delivered":
      return styles.statusNeutral;
    case "preparing":
    case "almost_ready":
    default:
      return styles.statusInfo;
  }
}

export function CustomerOrderStatusView() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<
    (CoreOrder & { items: CoreOrderItem[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("ID do pedido não encontrado");
      setLoading(false);
      return;
    }

    if (!isValidUUID(orderId)) {
      // Em DEV é comum alguém colar "<orderId>" da doc.
      // Não batemos no core nesse caso; mostramos erro amigável.
      setError("LINK_INVALID");
      setLoading(false);
      return;
    }

    const loadOrder = async () => {
      try {
        const loadedOrder = await readOrderById(orderId);
        if (!loadedOrder) {
          setError("Pedido não encontrado");
          return;
        }

        const items = await import(
          "../../infra/readers/OrderReader"
        ).then((m) => m.readOrderItems(orderId));

        setOrder({
          ...loadedOrder,
          items: items || [],
        });
        setError(null);
      } catch (e) {
        console.error("Error loading order:", e);
        setError("Erro ao carregar pedido");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();

    // Polling a cada 5 segundos se pedido ainda não finalizado
    const interval = setInterval(() => {
      if (order && order.status !== "CLOSED" && order.status !== "CANCELLED") {
        loadOrder();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId, order?.status]);

  if (loading) {
    return (
      <GlobalLoadingView
        message="Carregando status do pedido..."
        layout="portal"
        variant="fullscreen"
      />
    );
  }

  if (error || !order) {
    if (error === "LINK_INVALID") {
      return (
        <div className={styles.centeredPage}>
          <div className={styles.centeredCard}>
            <p className={styles.errorTitle}>
              Link de desenvolvimento inválido
            </p>
            <p className={styles.errorText}>
              Este link usa um identificador genérico
              (&quot;&lt;orderId&gt;&quot;). Para ver o status real, crie um
              pedido pela página pública do restaurante ou pela mesa QR.
            </p>
            <p className={styles.errorNote}>
              Exemplo: acesse <code>/public/&lt;slug&gt;</code> ou{" "}
              <code>/public/&lt;slug&gt;/mesa/1</code>, finalize um pedido e use
              o link gerado automaticamente.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.centeredPage}>
        <div className={styles.centeredCard}>
          <p className={styles.errorTitle}>
            {error || "Pedido não encontrado"}
          </p>
          <p className={styles.errorText}>Verifique se o link está correto.</p>
        </div>
      </div>
    );
  }

  const customerStatus = mapOrderStatusToCustomerStatus(order.status);
  const statusClass = getStatusClass(customerStatus.status);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            Pedido #{order.number || order.short_id || order.id.slice(0, 8)}
          </h1>
          {order.table_number && (
            <p className={styles.subtitle}>Mesa {order.table_number}</p>
          )}
        </div>

        {/* Status Card */}
        <div className={styles.statusCard}>
          <div className={styles.statusIcon}>{customerStatus.icon}</div>
          <h2 className={`${styles.statusMessage} ${statusClass}`}>
            {customerStatus.message}
          </h2>
          {customerStatus.status === "preparing" && (
            <p className={styles.statusNote}>
              Estamos preparando seu pedido com carinho.
            </p>
          )}
          {customerStatus.status === "almost_ready" && (
            <p className={styles.statusNote}>Seu pedido está quase pronto!</p>
          )}
        </div>

        {/* Items List */}
        {order.items.length > 0 && (
          <div className={styles.itemsSection}>
            <h3 className={styles.itemsTitle}>Itens do pedido</h3>
            <div className={styles.itemsList}>
              {order.items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <span className={styles.itemName}>
                    {item.name_snapshot} x{item.quantity}
                  </span>
                  <span className={styles.itemPrice}>
                    € {(item.subtotal_cents / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalValue}>
            € {(order.total_cents / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
