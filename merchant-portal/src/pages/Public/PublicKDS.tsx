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

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { readActiveOrders, readOrderItems } from '../../core-boundary/readers/OrderReader';
import type { CoreOrder, CoreOrderItem } from '../../core-boundary/docker-core/types';

export function PublicKDS() {
  const { slug } = useParams<{ slug: string }>();
  const [readyOrders, setReadyOrders] = useState<(CoreOrder & { items: CoreOrderItem[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Restaurante não encontrado');
      setLoading(false);
      return;
    }

    const loadReadyOrders = async () => {
      try {
        // Buscar restaurante por slug primeiro
        const { readRestaurantBySlug } = await import('../../core-boundary/readers/RestaurantReader');
        const restaurant = await readRestaurantBySlug(slug);
        
        if (!restaurant) {
          setError('Restaurante não encontrado');
          return;
        }

        // Buscar pedidos ativos
        const orders = await readActiveOrders(restaurant.id);
        
        // Filtrar apenas pedidos READY
        const ready = orders.filter(o => o.status === 'READY');
        
        // Carregar itens de cada pedido
        const ordersWithItems = await Promise.all(
          ready.map(async (order) => {
            const items = await readOrderItems(order.id);
            return {
              ...order,
              items: items || [],
            };
          })
        );

        setReadyOrders(ordersWithItems);
        setError(null);
      } catch (e) {
        console.error('Error loading ready orders:', e);
        setError('Erro ao carregar pedidos prontos');
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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: '#fff',
      }}>
        <p style={{ fontSize: '18px' }}>Carregando pedidos prontos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: '#ef4444',
      }}>
        <p style={{ fontSize: '18px' }}>{error}</p>
      </div>
    );
  }

  if (readyOrders.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '24px', marginBottom: '8px' }}>🔔</p>
          <p style={{ fontSize: '18px' }}>Nenhum pedido pronto no momento</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: '#fff',
      padding: '32px',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '8px',
          }}>
            Pedidos Prontos
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#9ca3af',
          }}>
            {readyOrders.length} pedido{readyOrders.length !== 1 ? 's' : ''} pronto{readyOrders.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Orders Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {readyOrders.map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: '#22c55e',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}>
                <div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                  }}>
                    🔔 Pedido #{order.number || order.short_id || order.id.slice(0, 8)}
                  </div>
                  {order.table_number && (
                    <div style={{
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.9)',
                    }}>
                      Mesa {order.table_number}
                    </div>
                  )}
                </div>
              </div>

              {/* Items (opcional - pode ser simplificado) */}
              {order.items.length > 0 && (
                <div style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255,255,255,0.2)',
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: '8px',
                  }}>
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
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
