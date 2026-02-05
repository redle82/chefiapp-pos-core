/**
 * Owner Purchases - Lista de Compras (Auto)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/navigation/Header';
import { BottomTabs } from '../../components/navigation/BottomTabs';
import { EmptyState } from '../../components/ui/EmptyState';
import type { ShoppingListItem } from '../../types/purchases';
import { DataModeBanner } from '../../components/DataModeBanner';
import { useRestaurantRuntime } from '../../context/RestaurantRuntimeContext';

export function OwnerPurchasesPage() {
  const navigate = useNavigate();
  const { runtime } = useRestaurantRuntime();
  const [filter, setFilter] = useState<'auto' | 'manual' | 'all'>('auto');

  // TODO: Integrar com generate_shopping_list
  // TODO: Buscar lista de compras
  // TODO: Integrar com estoque crítico
  const items: ShoppingListItem[] = []; // Placeholder

  return (
    <div style={{ paddingBottom: '80px' }}>
      <DataModeBanner dataMode={runtime.dataMode} />
      <Header
        title="Compras"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFilter('auto')}
              style={{
                padding: '4px 8px',
                backgroundColor: filter === 'auto' ? '#667eea' : '#f0f0f0',
                color: filter === 'auto' ? '#fff' : '#666',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Auto
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
              Todas
            </button>
          </div>
        }
      />

      <div style={{ padding: '16px' }}>
        {items.length === 0 ? (
          <EmptyState
            title="Nenhum item na lista"
            message="A lista automática será gerada quando houver estoque crítico"
            action={{
              label: 'Gerar lista automática',
              onPress: () => {
                // TODO: Gerar lista automática
              },
            }}
          />
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                        {item.ingredient_name}
                      </h3>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {item.quantity} {item.unit}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: item.priority === 'HIGH' ? '#dc3545' : item.priority === 'MEDIUM' ? '#ffc107' : '#28a745',
                      color: '#fff',
                    }}>
                      {item.priority === 'HIGH' ? 'Alta' : item.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                    Motivo: {item.reason === 'STOCK_CRITICAL' ? 'Estoque crítico' :
                             item.reason === 'DEMAND_FORECAST' ? 'Previsão de demanda' : 'Manual'}
                    {item.supplier_id && ` • Fornecedor: ${item.supplier_id.substring(0, 8)}`}
                  </div>
                  <button
                    onClick={() => navigate('/owner/purchases/create', { state: { item } })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#667eea',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Criar Pedido
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
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
              <button
                onClick={() => navigate('/owner/purchases/costs')}
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
                Custos & Margem
              </button>
            </div>
          </>
        )}
      </div>

      <BottomTabs role="owner" />
    </div>
  );
}
