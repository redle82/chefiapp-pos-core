/**
 * Employee KDS Intelligent - KDS Inteligente
 * 
 * Pergunta: "Onde está o gargalo?"
 * 
 * Componentes:
 * - Itens por estação (BAR / KITCHEN / etc.)
 * - Tempo por item
 * - Agrupamento inteligente
 * - Destaque automático de risco
 * - Sugestão de ação (IA)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/navigation/Header';
import { BottomTabs } from '../../components/navigation/BottomTabs';

export function EmployeeKDSIntelligentPage() {
  const navigate = useNavigate();
  const [selectedStation, setSelectedStation] = useState<'BAR' | 'KITCHEN' | 'DESSERT'>('BAR');

  // TODO: Integrar com KDS real
  // TODO: Buscar itens por estação
  // TODO: Calcular tempo por item
  // TODO: Agrupamento inteligente
  // TODO: Buscar sugestões da IA

  const items = {
    BAR: [
      { id: '1', name: 'Caipirinha', table: 'Mesa 5', time: '18min / 10min', status: 'delayed', canGroup: false },
      { id: '2', name: 'Mojito', table: 'Mesa 12', time: '8min / 10min', status: 'warning', canGroup: false },
      { id: '3', name: 'Gin Tônica', table: 'Mesa 8', time: '5min / 10min', status: 'ready', canGroup: false },
    ],
    KITCHEN: [
      { id: '4', name: 'Hambúrguer', table: 'Mesa 3', time: '12min / 15min', status: 'in_progress', canGroup: true },
      { id: '5', name: 'Hambúrguer', table: 'Mesa 7', time: '10min / 15min', status: 'in_progress', canGroup: true },
    ],
    DESSERT: [],
  };

  const currentItems = items[selectedStation];
  const delayedItems = currentItems.filter(item => item.status === 'delayed');
  const groupedItems = currentItems.filter(item => item.canGroup);

  const aiSuggestion = delayedItems.length > 0 ? {
    message: `${delayedItems[0].name} atrasado: falta limão. Repor estoque urgente.`,
    actions: ['Ver estoque', 'Bloquear item'],
  } : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delayed': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'ready': return '#28a745';
      default: return '#667eea';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delayed': return 'ATRASADO';
      case 'warning': return 'Em preparo';
      case 'ready': return 'Pronto';
      default: return 'Em preparo';
    }
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header
        title="KDS Inteligente"
        subtitle="Onde está o gargalo"
        onBack={() => navigate('/employee/operation')}
      />

      <div style={{ padding: '16px' }}>
        {/* Seleção de Estação */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
          {(['BAR', 'KITCHEN', 'DESSERT'] as const).map((station) => (
            <button
              key={station}
              onClick={() => setSelectedStation(station)}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: selectedStation === station ? '#667eea' : '#f0f0f0',
                color: selectedStation === station ? '#fff' : '#666',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: selectedStation === station ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {station}
            </button>
          ))}
        </div>

        {/* Sugestão IA */}
        {aiSuggestion && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              💡 SUGESTÃO (IA)
            </h3>
            <div style={{
              backgroundColor: '#e7f3ff',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #667eea',
            }}>
              <div style={{ fontSize: '14px', marginBottom: '12px' }}>
                {aiSuggestion.message}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {aiSuggestion.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (action === 'Ver estoque') {
                        navigate('/owner/purchases');
                      } else if (action === 'Bloquear item') {
                        // TODO: Bloquear item
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#667eea',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Itens */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            {selectedStation} ({currentItems.length} itens)
          </h3>
          {currentItems.length === 0 ? (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '32px',
              border: '1px solid #e0e0e0',
              textAlign: 'center',
              color: '#666',
            }}>
              Nenhum item pendente
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Itens atrasados primeiro */}
              {currentItems
                .filter(item => item.status === 'delayed')
                .map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      padding: '16px',
                      border: `2px solid ${getStatusColor(item.status)}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>
                          ⚠️ {item.name} - {item.table}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          Tempo: {item.time}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: getStatusColor(item.status),
                        color: '#fff',
                      }}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        // TODO: Marcar como pronto
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: getStatusColor(item.status),
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Marcar pronto
                    </button>
                  </div>
                ))}

              {/* Outros itens */}
              {currentItems
                .filter(item => item.status !== 'delayed')
                .map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      padding: '16px',
                      border: `1px solid ${getStatusColor(item.status)}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>
                          {item.status === 'ready' ? '✅' : '🟡'} {item.name} - {item.table}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          Tempo: {item.time}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: getStatusColor(item.status),
                        color: '#fff',
                      }}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (item.status === 'ready') {
                          // TODO: Entregar
                        } else {
                          // TODO: Marcar como pronto
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: getStatusColor(item.status),
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {item.status === 'ready' ? 'Entregar' : 'Marcar pronto'}
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Agrupamento Inteligente */}
        {groupedItems.length > 1 && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              📊 AGRUPAMENTO INTELIGENTE
            </h3>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #e0e0e0',
            }}>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                {groupedItems.length} {groupedItems[0].name} (mesmas mesas)
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                Preparar juntas?
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    // TODO: Agrupar e preparar
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#667eea',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Sim
                </button>
                <button
                  onClick={() => {
                    // TODO: Não agrupar
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Não
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomTabs role="employee" />
    </div>
  );
}
