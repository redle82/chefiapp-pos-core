/**
 * KDSMinimal - KDS mínimo como adapter do Core
 *
 * Princípios:
 * - Escuta eventos do Core (Realtime)
 * - Mostra estado do Core
 * - Permite ações no Core (via RPC)
 * - Feio mas verdadeiro
 */

import React, { useState, useEffect } from 'react';
import { getActiveOrders, subscribeToOrders, updateOrderStatus } from '../../core-adapter/coreClient';
import type { Order, OrderEvent } from '../../core-adapter/types';

interface KDSMinimalProps {
  restaurantId: string;
}

export function KDSMinimal({ restaurantId }: KDSMinimalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar pedidos iniciais
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getActiveOrders(restaurantId);
        setOrders(data);
      } catch (err: any) {
        setError(`Erro ao carregar pedidos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [restaurantId]);

  // Escutar eventos do Core via Realtime
  useEffect(() => {
    const unsubscribe = subscribeToOrders(restaurantId, (event: OrderEvent) => {
      if (event.type === 'INSERT') {
        // Novo pedido: adicionar à lista
        setOrders(prev => {
          // Evitar duplicatas
          if (prev.find(o => o.id === event.order.id)) {
            return prev;
          }
          return [event.order, ...prev];
        });
      } else if (event.type === 'UPDATE') {
        // Pedido atualizado: atualizar na lista
        setOrders(prev =>
          prev.map(o => (o.id === event.order.id ? event.order : o))
        );
      } else if (event.type === 'DELETE') {
        // Pedido removido: remover da lista
        setOrders(prev => prev.filter(o => o.id !== event.order.id));
      }
    });

    return unsubscribe;
  }, [restaurantId]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (!result.success) {
      alert(`Erro ao atualizar status: ${result.error}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
      case 'NEW':
        return '#3b82f6'; // Azul
      case 'PREPARING':
      case 'IN_PREP':
        return '#f59e0b'; // Amarelo
      case 'READY':
        return '#10b981'; // Verde
      default:
        return '#6b7280'; // Cinza
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN':
      case 'NEW':
        return 'NOVO';
      case 'PREPARING':
      case 'IN_PREP':
        return 'PREPARANDO';
      case 'READY':
        return 'PRONTO';
      default:
        return status;
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Carregando pedidos...</div>;
  }

  return (
    <div style={{
      padding: 20,
      fontFamily: 'system-ui',
      backgroundColor: '#111827',
      color: 'white',
      minHeight: '100vh',
    }}>
      <h1 style={{ marginBottom: 20 }}>KDS Mínimo (UI v2)</h1>

      {error && (
        <div style={{
          marginBottom: 20,
          padding: 15,
          backgroundColor: '#7f1d1d',
          border: '1px solid #dc2626',
          borderRadius: 6,
        }}>
          ❌ {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
          Nenhum pedido ativo no momento
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {orders.map(order => {
            const age = new Date().getTime() - new Date(order.created_at).getTime();
            const ageMinutes = Math.floor(age / (1000 * 60));
            const isDelayed = ageMinutes > 30 && (order.status === 'PREPARING' || order.status === 'IN_PREP');

            return (
              <div
                key={order.id}
                style={{
                  padding: 20,
                  backgroundColor: '#1f2937',
                  border: `2px solid ${getStatusColor(order.status)}`,
                  borderRadius: 8,
                  borderLeftWidth: 6,
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 15,
                }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                      Pedido #{order.id.slice(0, 8)}
                    </div>
                    {order.table_number && (
                      <div style={{ fontSize: 14, color: '#9ca3af', marginTop: 4 }}>
                        Mesa {order.table_number}
                      </div>
                    )}
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    backgroundColor: getStatusColor(order.status),
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}>
                    {getStatusLabel(order.status)}
                  </div>
                </div>

                <div style={{ marginBottom: 15, fontSize: 14, color: '#9ca3af' }}>
                  Criado há {ageMinutes} min
                  {isDelayed && (
                    <span style={{ color: '#f59e0b', marginLeft: 10 }}>
                      ⚠️ ATRASADO
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: 15, fontSize: 18, fontWeight: 'bold' }}>
                  Total: €{(order.total_cents / 100).toFixed(2)}
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', gap: 10 }}>
                  {order.status === 'OPEN' || order.status === 'NEW' ? (
                    <button
                      onClick={() => handleStatusChange(order.id, 'PREPARING')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      Iniciar Preparo
                    </button>
                  ) : order.status === 'PREPARING' || order.status === 'IN_PREP' ? (
                    <button
                      onClick={() => handleStatusChange(order.id, 'READY')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      Marcar Pronto
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
