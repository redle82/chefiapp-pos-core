/**
 * Owner Stock Real - Estoque Real
 * 
 * Pergunta: "O que vai acabar e quando?"
 * 
 * Componentes:
 * - Estoque atual
 * - Consumo real
 * - Previsão de ruptura
 * - Histórico de falhas
 * - Acesso direto a compras
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/navigation/Header';
import { BottomTabs } from '../../components/navigation/BottomTabs';
import { EmptyState } from '../../components/ui/EmptyState';

export function OwnerStockRealPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'critical' | 'attention' | 'all'>('critical');

  // TODO: Integrar com Core para buscar estoque real
  // TODO: Calcular consumo real
  // TODO: Prever ruptura
  // TODO: Buscar histórico de falhas

  const criticalItems = [
    { id: '1', name: 'Tomate', current: 0, minimum: 10, unit: 'kg', rupture: 'AGORA', consumption: '2kg/hora' },
  ];

  const attentionItems = [
    { id: '2', name: 'Limão', current: 2, minimum: 5, unit: 'kg', rupture: '2h', consumption: '1kg/hora' },
  ];

  const consumptionHistory = [
    { name: 'Tomate', consumed: 48, unit: 'kg', average: '2kg/hora', peak: '4kg/hora (20h)' },
  ];

  const ruptureForecast = [
    { name: 'Limão', time: '2h' },
    { name: 'Cebola', time: '8h' },
    { name: 'Alho', time: '12h' },
  ];

  const failureHistory = [
    { name: 'Tomate', count: 3, period: 'esta semana', last: 'Hoje 14:30', cause: 'Consumo acima do previsto' },
  ];

  const displayItems = filter === 'critical' ? criticalItems : filter === 'attention' ? attentionItems : [...criticalItems, ...attentionItems];

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header
        title="Estoque Real"
        subtitle="O que vai acabar e quando"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFilter('critical')}
              style={{
                padding: '4px 8px',
                backgroundColor: filter === 'critical' ? '#dc3545' : '#f0f0f0',
                color: filter === 'critical' ? '#fff' : '#666',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Crítico
            </button>
            <button
              onClick={() => setFilter('attention')}
              style={{
                padding: '4px 8px',
                backgroundColor: filter === 'attention' ? '#ffc107' : '#f0f0f0',
                color: filter === 'attention' ? '#fff' : '#666',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Atenção
            </button>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '4px 8px',
                backgroundColor: filter === 'all' ? '#667eea' : '#f0f0f0',
                color: filter === 'all' ? '#fff' : '#666',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Todos
            </button>
          </div>
        }
      />

      <div style={{ padding: '16px' }}>
        {/* Itens Críticos/Atenção */}
        {displayItems.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              {filter === 'critical' ? '🔴 CRÍTICO' : filter === 'attention' ? '🟡 ATENÇÃO' : '📦 ESTOQUE'} ({displayItems.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {displayItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    border: `2px solid ${item.current === 0 ? '#dc3545' : '#ffc107'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 600 }}>
                        {item.name}: {item.current}{item.unit} / {item.minimum}{item.unit} mínimo
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        Ruptura: {item.rupture}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        Consumo: {item.consumption}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/owner/purchases')}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: item.current === 0 ? '#dc3545' : '#ffc107',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {item.current === 0 ? 'Comprar agora' : 'Adicionar à lista'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consumo Real */}
        {consumptionHistory.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              📊 CONSUMO REAL (últimas 24h)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {consumptionHistory.map((item, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                    {item.name}: {item.consumed}{item.unit} consumidos
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Média: {item.average}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Pico: {item.peak}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previsão de Ruptura */}
        {ruptureForecast.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              📈 PREVISÃO DE RUPTURA
            </h3>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #e0e0e0',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Próximas 24h:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {ruptureForecast.map((item, index) => (
                  <div key={index} style={{ fontSize: '14px', color: '#666' }}>
                    {item.name}: {item.time}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Histórico de Falhas */}
        {failureHistory.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              📋 HISTÓRICO DE FALHAS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {failureHistory.map((item, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                    {item.name}: {item.count}x {item.period}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Última: {item.last}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Causa: {item.cause}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acesso Rápido */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/owner/purchases')}
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
            Compras
          </button>
          <button
            onClick={() => navigate('/owner/purchases/suppliers')}
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
            Fornecedores
          </button>
        </div>
      </div>

      <BottomTabs role="owner" />
    </div>
  );
}
