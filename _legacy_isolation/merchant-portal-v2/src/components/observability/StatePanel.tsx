/**
 * StatePanel - Observabilidade humana
 *
 * Mostra:
 * - O que está errado agora
 * - Quem está atrasando
 * - Restaurante está saudável?
 */

import React, { useState, useEffect } from 'react';
import { getActiveOrders } from '../../core-adapter/coreClient';
import type { Order, ActiveIssue } from '../../core-adapter/types';

interface StatePanelProps {
  restaurantId: string;
}

export function StatePanel({ restaurantId }: StatePanelProps) {
  const [issues, setIssues] = useState<ActiveIssue[]>([]);
  const [health, setHealth] = useState<'healthy' | 'warning' | 'error'>('healthy');
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkState = async () => {
      try {
        const orders = await getActiveOrders(restaurantId);
        setActiveOrdersCount(orders.length);

        // Identificar problemas
        const now = new Date();
        const foundIssues: ActiveIssue[] = [];

        // Pedidos atrasados (mais de 30 minutos em preparo)
        const delayedOrders = orders.filter(order => {
          const age = now.getTime() - new Date(order.created_at).getTime();
          const ageMinutes = age / (1000 * 60);
          return ageMinutes > 30 && (order.status === 'PREPARING' || order.status === 'IN_PREP');
        });

        delayedOrders.forEach(order => {
          foundIssues.push({
            type: 'delayed',
            message: `Pedido #${order.id.slice(0, 8)} atrasado (mais de 30 min em preparo)`,
            orderId: order.id,
            tableId: order.table_id,
            severity: 'high',
          });
        });

        setIssues(foundIssues);

        // Determinar saúde
        if (foundIssues.length > 0) {
          setHealth(foundIssues.some(i => i.severity === 'high') ? 'error' : 'warning');
        } else {
          setHealth('healthy');
        }
      } catch (err: any) {
        setIssues([{
          type: 'error',
          message: `Erro ao verificar estado: ${err.message}`,
          severity: 'high',
        }]);
        setHealth('error');
      } finally {
        setLoading(false);
      }
    };

    checkState();
    const interval = setInterval(checkState, 30000); // Atualizar a cada 30s
    return () => clearInterval(interval);
  }, [restaurantId]);

  const getHealthColor = () => {
    switch (health) {
      case 'healthy':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#dc2626';
    }
  };

  const getHealthLabel = () => {
    switch (health) {
      case 'healthy':
        return 'SAUDÁVEL';
      case 'warning':
        return 'ATENÇÃO';
      case 'error':
        return 'PROBLEMAS';
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Carregando estado...</div>;
  }

  return (
    <div style={{
      padding: 20,
      fontFamily: 'system-ui',
      backgroundColor: '#111827',
      color: 'white',
    }}>
      <h1 style={{ marginBottom: 20 }}>Estado do Sistema (Observabilidade)</h1>

      {/* Status Geral */}
      <div style={{
        marginBottom: 20,
        padding: 20,
        backgroundColor: '#1f2937',
        borderRadius: 8,
        border: `2px solid ${getHealthColor()}`,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 5 }}>
              Status: {getHealthLabel()}
            </div>
            <div style={{ fontSize: 14, color: '#9ca3af' }}>
              Pedidos ativos: {activeOrdersCount}
            </div>
          </div>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: getHealthColor(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}>
            {health === 'healthy' ? '✅' : health === 'warning' ? '⚠️' : '❌'}
          </div>
        </div>
      </div>

      {/* Problemas Ativos */}
      {issues.length > 0 ? (
        <div style={{
          marginBottom: 20,
          padding: 20,
          backgroundColor: '#7f1d1d',
          border: '1px solid #dc2626',
          borderRadius: 8,
        }}>
          <h2 style={{ marginBottom: 15 }}>⚠️ Problemas Ativos</h2>
          {issues.map((issue, index) => (
            <div
              key={index}
              style={{
                padding: 12,
                marginBottom: 10,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 6,
                borderLeft: `4px solid ${issue.severity === 'high' ? '#dc2626' : '#f59e0b'}`,
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                {issue.type === 'delayed' && '⏱️ '}
                {issue.type === 'blocked' && '🚫 '}
                {issue.type === 'error' && '❌ '}
                {issue.type === 'offline' && '📡 '}
                {issue.message}
              </div>
              {issue.orderId && (
                <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 4 }}>
                  Pedido: {issue.orderId.slice(0, 8)}...
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          padding: 20,
          backgroundColor: '#064e3b',
          border: '1px solid #10b981',
          borderRadius: 8,
          textAlign: 'center',
        }}>
          ✅ Nenhum problema ativo. Sistema operando normalmente.
        </div>
      )}
    </div>
  );
}
