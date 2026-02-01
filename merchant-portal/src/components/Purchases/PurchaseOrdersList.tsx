/**
 * PurchaseOrdersList - Lista de Pedidos de Compra
 */

import React from 'react';
import type { PurchaseOrder } from '../../core/purchases/PurchaseEngine';

interface Props {
  orders: PurchaseOrder[];
}

export function PurchaseOrdersList({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
        <p>Nenhum pedido de compra</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {orders.map((order) => (
        <div
          key={order.id}
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>
                {order.orderNumber}
              </h3>
              <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                Data: {order.orderDate.toLocaleDateString()}
                {order.expectedDeliveryDate && ` • Entrega esperada: ${order.expectedDeliveryDate.toLocaleDateString()}`}
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '16px', fontWeight: 600, color: '#28a745' }}>
                R$ {order.total.toFixed(2)}
              </p>
            </div>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor:
                  order.status === 'received' ? '#28a745' :
                  order.status === 'confirmed' ? '#007bff' :
                  order.status === 'sent' ? '#ffc107' :
                  '#6c757d',
                color: 'white',
              }}
            >
              {order.status.toUpperCase()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
