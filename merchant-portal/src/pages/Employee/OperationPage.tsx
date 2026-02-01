/**
 * Employee Operation - Operação ao Vivo
 * 
 * Pergunta: "O que está acontecendo agora?"
 * 
 * Componentes:
 * - Pedidos ativos
 * - KDS por estação
 * - Backlog visível
 * - Atrasos reais
 * - Ações rápidas permitidas
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/navigation/Header';
import { BottomTabs } from '../../components/navigation/BottomTabs';
import { EmptyState } from '../../components/ui/EmptyState';

export function EmployeeOperationPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<'orders' | 'kds' | 'tables'>('orders');

  // TODO: Integrar com Core para buscar pedidos ativos
  // TODO: Buscar KDS por estação
  // TODO: Buscar backlog
  // TODO: Buscar atrasos reais

  const activeOrders = [
    { id: '123', table: 'Mesa 5', status: 'Em preparo', time: '12min / 15min', progress: 80 },
    { id: '124', table: 'Mesa 12', status: 'Aguardando', time: '5min / 15min', progress: 33 },
  ];

  const kdsByStation = {
    bar: { items: 3, delayed: 2 },
    kitchen: { items: 5, delayed: 0 },
  };

  const backlog = {
    waiting: 3,
    avgWaitTime: '8min',
  };

  const delays = [
    { table: 'Mesa 5', delay: '3min', cause: 'Item bloqueado (falta)', orderId: '123' },
  ];

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header
        title="Operação ao Vivo"
        subtitle="O que está acontecendo agora"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setView('orders')}
              style={{
                padding: '4px 8px',
                backgroundColor: view === 'orders' ? '#667eea' : '#f0f0f0',
                color: view === 'orders' ? '#fff' : '#666',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Pedidos
            </button>
            <button
              onClick={() => setView('kds')}
              style={{
                padding: '4px 8px',
                backgroundColor: view === 'kds' ? '#667eea' : '#f0f0f0',
                color: view === 'kds' ? '#fff' : '#666',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              KDS
            </button>
            <button
              onClick={() => setView('tables')}
              style={{
                padding: '4px 8px',
                backgroundColor: view === 'tables' ? '#667eea' : '#f0f0f0',
                color: view === 'tables' ? '#fff' : '#666',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Mesas
            </button>
          </div>
        }
      />

      <div style={{ padding: '16px' }}>
        {view === 'orders' && (
          <>
            {/* Pedidos Ativos */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                📋 PEDIDOS ATIVOS ({activeOrders.length})
              </h3>
              {activeOrders.length === 0 ? (
                <EmptyState title="Nenhum pedido ativo" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/employee/operation/order/${order.id}`)}
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        padding: '16px',
                        border: '1px solid #e0e0e0',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 600 }}>
                            {order.table} - Pedido #{order.id}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            Status: {order.status}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: order.progress >= 80 ? '#ffc107' : '#28a745',
                          color: '#fff',
                        }}>
                          {order.time}
                        </span>
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          Progresso
                        </div>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${order.progress}%`,
                            height: '100%',
                            backgroundColor: order.progress >= 80 ? '#ffc107' : '#28a745',
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Backlog Visível */}
            {backlog.waiting > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                  📦 BACKLOG VISÍVEL
                </h3>
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #e0e0e0',
                }}>
                  <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                    {backlog.waiting} pedido{backlog.waiting > 1 ? 's' : ''} aguardando preparo
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Tempo médio de espera: {backlog.avgWaitTime}
                  </div>
                </div>
              </div>
            )}

            {/* Atrasos Reais */}
            {delays.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                  ⏰ ATRASOS REAIS
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {delays.map((delay, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        padding: '12px',
                        border: '1px solid #ffc107',
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                        {delay.table} - {delay.delay} atrasado
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                        Causa: {delay.cause}
                      </div>
                      <button
                        onClick={() => navigate(`/employee/operation/order/${delay.orderId}`)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ffc107',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Resolver
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {view === 'kds' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              🍳 KDS POR ESTAÇÃO
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #e0e0e0',
              }}>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                  BAR: {kdsByStation.bar.items} itens
                </div>
                {kdsByStation.bar.delayed > 0 && (
                  <div style={{ fontSize: '14px', color: '#ffc107' }}>
                    ⚠️ {kdsByStation.bar.delayed} atrasado{kdsByStation.bar.delayed > 1 ? 's' : ''}
                  </div>
                )}
                <button
                  onClick={() => navigate('/employee/operation/kitchen')}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#667eea',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Ver KDS BAR
                </button>
              </div>
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #e0e0e0',
              }}>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                  KITCHEN: {kdsByStation.kitchen.items} itens
                </div>
                <div style={{ fontSize: '14px', color: '#28a745' }}>
                  ✅ Todos em tempo
                </div>
                <button
                  onClick={() => navigate('/employee/operation/kitchen')}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#667eea',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Ver KDS KITCHEN
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'tables' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              🪑 MESAS
            </h3>
            <EmptyState
              title="Funcionalidade em desenvolvimento"
              message="A visualização de mesas será implementada em breve"
            />
          </div>
        )}

        {/* Ações Rápidas */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/employee/operation/new-order')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#667eea',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Novo Pedido
          </button>
          <button
            onClick={() => navigate('/employee/operation/kitchen')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Ver KDS
          </button>
        </div>
      </div>

      <BottomTabs role="employee" />
    </div>
  );
}
