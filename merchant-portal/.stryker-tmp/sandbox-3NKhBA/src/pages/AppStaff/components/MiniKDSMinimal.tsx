/**
 * MINI KDS MINIMAL — Versão compacta para AppStaff.
 * Visual: VPC (escuro, superfície, borda, texto).
 */
// @ts-nocheck


import { useEffect, useState, useRef } from 'react';
import { readActiveOrders, readOrderItems } from '../../../infra/readers/OrderReader';
import type { CoreOrder, CoreOrderItem } from '../../../infra/docker-core/types';
import { OriginBadge } from './OriginBadge';
import { calculateOrderStatus } from '../../KDSMinimal/OrderStatusCalculator';

const VPC = {
  bg: '#0a0a0a',
  surface: '#141414',
  border: '#262626',
  text: '#fafafa',
  textMuted: '#a3a3a3',
  accent: '#22c55e',
  radius: 8,
  space: 12,
  fontSizeBase: 14,
  fontSizeSmall: 12,
} as const;

interface MiniKDSMinimalProps {
  restaurantId: string;
  maxHeight?: string;
}

export function MiniKDSMinimal({ restaurantId, maxHeight = '400px' }: MiniKDSMinimalProps) {
  const [orders, setOrders] = useState<(CoreOrder & { items: CoreOrderItem[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('DISCONNECTED');
  const fetchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Função para carregar pedidos
  const loadOrders = async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true);
      }
      setError(null);

      // FASE 3.5: Usa OrderReader (dockerCoreClient) em vez de OrderReaderDirect (fetch direto)
      const activeOrders = await readActiveOrders(restaurantId);
      const ordersWithItems = await Promise.all(
        activeOrders.map(async (order) => {
          const items = await readOrderItems(order.id);
          return { ...order, items };
        })
      );

      setOrders(ordersWithItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadOrders(false);

    // REALTIME DESABILITADO - Problema 431 no WebSocket
    // Usando apenas polling (30s) até resolver JWT no WebSocket
    setRealtimeStatus('CLOSED');

    // Polling principal (30s)
    const pollingInterval = setInterval(() => {
      loadOrders(true);
    }, 30000);

    return () => {
      if (fetchDebounceRef.current) {
        clearTimeout(fetchDebounceRef.current);
      }
      clearInterval(pollingInterval);
    };
  }, [restaurantId]);

  if (loading) {
    return (
      <div
        style={{
          padding: VPC.space,
          textAlign: 'center',
          fontSize: VPC.fontSizeBase,
          color: VPC.textMuted,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        A carregar pedidos...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: VPC.space,
          fontSize: VPC.fontSizeBase,
          color: '#f87171',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        Erro: {error}
      </div>
    );
  }

  return (
    <div
      style={{
        border: `1px solid ${VPC.border}`,
        borderRadius: VPC.radius,
        overflow: 'hidden',
        maxHeight,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: VPC.surface,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          padding: `${VPC.space}px 16px`,
          backgroundColor: VPC.bg,
          borderBottom: `1px solid ${VPC.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: VPC.fontSizeBase, fontWeight: 600, color: VPC.text }}>KDS Mínimo</span>
        <span style={{ fontSize: VPC.fontSizeSmall, color: realtimeStatus === 'SUBSCRIBED' ? VPC.accent : '#f87171' }}>
          {realtimeStatus === 'SUBSCRIBED' ? '🟢' : '🔴'}
        </span>
      </div>

      {/* Scroll é do Shell quando dentro do AppStaff; sem overflow próprio para evitar scroll duplo */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {orders.length === 0 ? (
          <div
            style={{
              padding: VPC.space * 2,
              textAlign: 'center',
              fontSize: VPC.fontSizeBase,
              color: VPC.textMuted,
            }}
          >
            Nenhum pedido ativo
          </div>
        ) : (
          <>
            <div
              style={{
                padding: VPC.space,
                fontSize: VPC.fontSizeSmall,
                color: VPC.textMuted,
                borderBottom: `1px solid ${VPC.border}`,
              }}
            >
              {orders.length} pedido(s) ativo(s)
            </div>
            {orders.map((order) => {
              const orderStatus = calculateOrderStatus(order, order.items);
              return (
                <div
                  key={order.id}
                  style={{
                    borderLeft: `3px solid ${orderStatus.borderColor}`,
                    margin: VPC.space,
                    padding: VPC.space,
                    backgroundColor: VPC.bg,
                    borderRadius: VPC.radius,
                    fontSize: VPC.fontSizeBase,
                    color: VPC.text,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <strong style={{ fontSize: VPC.fontSizeBase }}>#{order.number || order.short_id || order.id.slice(0, 8)}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <OriginBadge origin={order.sync_metadata?.origin} />
                      <span style={{ color: orderStatus.borderColor, fontSize: 14, fontWeight: orderStatus.state === 'delay' ? 700 : 400 }}>
                        {orderStatus.state === 'delay' ? '🔴' : orderStatus.state === 'attention' ? '🟡' : '🟢'}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: VPC.fontSizeSmall, color: VPC.textMuted, marginBottom: 4 }}>
                    Mesa: {order.table_number || 'N/A'} | Status: {order.status}
                  </div>
                  <div style={{ fontSize: VPC.fontSizeBase, fontWeight: 600, marginTop: 4, color: VPC.accent }}>
                    € {(order.total_cents / 100).toFixed(2)}
                  </div>
                  <div style={{ fontSize: VPC.fontSizeSmall, color: VPC.textMuted, marginTop: 4 }}>
                    {order.items.length} item(ns)
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
