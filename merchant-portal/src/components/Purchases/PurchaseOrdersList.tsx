/**
 * PurchaseOrdersList - Lista de Pedidos de Compra
 */

import type { PurchaseOrder } from "../../core/purchases/PurchaseEngine";
import styles from "./PurchaseOrdersList.module.css";

interface Props {
  orders: PurchaseOrder[];
}

export function PurchaseOrdersList({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📋</div>
        <p>Nenhum pedido de compra</p>
      </div>
    );
  }

  return (
    <div className={styles.ordersList}>
      {orders.map((order) => (
        <div key={order.id} className={styles.orderCard}>
          <div className={styles.cardContent}>
            <div className={styles.cardBody}>
              <h3 className={styles.orderNumber}>{order.orderNumber}</h3>
              <p className={styles.orderDetails}>
                Data: {order.orderDate.toLocaleDateString()}
                {order.expectedDeliveryDate &&
                  ` • Entrega esperada: ${order.expectedDeliveryDate.toLocaleDateString()}`}
              </p>
              <p className={styles.orderTotal}>R$ {order.total.toFixed(2)}</p>
            </div>
            <span className={styles.statusBadge} data-status={order.status}>
              {order.status.toUpperCase()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
