/**
 * INVENTORY STOCK MINIMAL — Gestão de Inventário e Estoque
 *
 * Tela completa para gerenciar:
 * - Locais (onde as coisas existem)
 * - Equipamentos (inventário físico)
 * - Ingredientes (o que se mede)
 * - Estoque (quantidades e mínimos)
 * - Receitas (BOM: produtos -> ingredientes)
 */

import { useState, useEffect } from 'react';
import {
  readLocations,
  readEquipment,
  readIngredients,
  readStockLevels,
  readProductBOM,
  type CoreLocation,
  type CoreEquipment,
  type CoreIngredient,
  type CoreStockLevel
} from '../../core-boundary/readers/InventoryStockReader';
import { dockerCoreClient } from '../../core-boundary/docker-core/connection';
import { useRestaurantIdentity } from '../../core/identity/useRestaurantIdentity';
import { GlobalLoadingView } from '../../ui/design-system/components';

type TabType = 'locations' | 'equipment' | 'ingredients' | 'stock' | 'recipes';

export function InventoryStockMinimal() {
  const { identity } = useRestaurantIdentity();
  const restaurantId = identity?.restaurantId || '00000000-0000-0000-0000-000000000100'; // Fallback para dev

  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [locations, setLocations] = useState<CoreLocation[]>([]);
  const [equipment, setEquipment] = useState<CoreEquipment[]>([]);
  const [ingredients, setIngredients] = useState<CoreIngredient[]>([]);
  const [stockLevels, setStockLevels] = useState<any[]>([]);
  const [productBOM, setProductBOM] = useState<any[]>([]);

  // Load data
  useEffect(() => {
    loadAllData();
  }, [restaurantId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [locs, eq, ing, stock, bom] = await Promise.all([
        readLocations(restaurantId).catch(() => []),
        readEquipment(restaurantId).catch(() => []),
        readIngredients(restaurantId).catch(() => []),
        readStockLevels(restaurantId).catch(() => []),
        readProductBOM(restaurantId).catch(() => []),
      ]);

      setLocations(locs);
      setEquipment(eq);
      setIngredients(ing);
      setStockLevels(stock);
      setProductBOM(bom);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Quick actions
  const handleCreateDefaultLocations = async () => {
    try {
      const defaults = [
        { name: 'Cozinha Principal', kind: 'KITCHEN' },
        { name: 'Bar', kind: 'BAR' },
        { name: 'Estoque Seco', kind: 'STORAGE' },
      ];

      for (const loc of defaults) {
        await dockerCoreClient
          .from('gm_locations')
          .insert({
            restaurant_id: restaurantId,
            name: loc.name,
            kind: loc.kind,
          })
          .select()
          .single();
      }

      await loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar locais padrão');
    }
  };

  if (loading) {
    return (
      <GlobalLoadingView
        message="Carregando inventário e estoque..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
        📦 Inventário e Estoque
      </h1>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        {(['locations', 'equipment', 'ingredients', 'stock', 'recipes'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: activeTab === tab ? '#3b82f6' : '#6b7280',
            }}
          >
            {tab === 'locations' && '📍 Locais'}
            {tab === 'equipment' && '🔧 Equipamentos'}
            {tab === 'ingredients' && '🥘 Ingredientes'}
            {tab === 'stock' && '📊 Estoque'}
            {tab === 'recipes' && '📝 Receitas'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'locations' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Locais</h2>
            <button
              onClick={handleCreateDefaultLocations}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              + Criar Locais Padrão
            </button>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {locations.length === 0 ? (
              <p style={{ color: '#666', padding: '20px', textAlign: 'center' }}>
                Nenhum local criado. Clique em "Criar Locais Padrão" para começar.
              </p>
            ) : (
              locations.map((loc) => (
                <div
                  key={loc.id}
                  style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {loc.name}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#666' }}>
                        Tipo: {loc.kind}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'equipment' && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Equipamentos</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {equipment.length === 0 ? (
              <p style={{ color: '#666', padding: '20px', textAlign: 'center' }}>
                Nenhum equipamento cadastrado.
              </p>
            ) : (
              equipment.map((eq) => (
                <div
                  key={eq.id}
                  style={{
                    padding: '16px',
                    backgroundColor: eq.is_active ? '#f9fafb' : '#fee2e2',
                    border: `1px solid ${eq.is_active ? '#e5e7eb' : '#fca5a5'}`,
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {eq.name}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#666' }}>
                        Tipo: {eq.kind} {eq.capacity_note && `• ${eq.capacity_note}`}
                      </p>
                      {!eq.is_active && (
                        <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                          ⚠️ Inativo
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'ingredients' && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Ingredientes</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {ingredients.length === 0 ? (
              <p style={{ color: '#666', padding: '20px', textAlign: 'center' }}>
                Nenhum ingrediente cadastrado.
              </p>
            ) : (
              ingredients.map((ing) => (
                <div
                  key={ing.id}
                  style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {ing.name}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#666' }}>
                        Unidade: {ing.unit}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'stock' && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Estoque</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {stockLevels.length === 0 ? (
              <p style={{ color: '#666', padding: '20px', textAlign: 'center' }}>
                Nenhum nível de estoque cadastrado.
              </p>
            ) : (
              stockLevels.map((stock) => {
                const isLow = stock.qty <= stock.min_qty;
                return (
                  <div
                    key={stock.id}
                    style={{
                      padding: '16px',
                      backgroundColor: isLow ? '#fef2f2' : '#f9fafb',
                      border: `2px solid ${isLow ? '#dc2626' : '#e5e7eb'}`,
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                          {stock.ingredient?.name || 'Ingrediente'}
                          {isLow && <span style={{ color: '#dc2626', marginLeft: '8px' }}>⚠️ BAIXO</span>}
                        </h3>
                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                          Local: {stock.location?.name || 'N/A'}
                        </p>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                          <span>
                            <strong>Atual:</strong> {stock.qty} {stock.ingredient?.unit || ''}
                          </span>
                          <span>
                            <strong>Mínimo:</strong> {stock.min_qty} {stock.ingredient?.unit || ''}
                          </span>
                          <span style={{ color: isLow ? '#dc2626' : '#666' }}>
                            <strong>Status:</strong> {isLow ? 'CRÍTICO' : 'OK'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'recipes' && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Receitas (BOM)</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {productBOM.length === 0 ? (
              <p style={{ color: '#666', padding: '20px', textAlign: 'center' }}>
                Nenhuma receita cadastrada. Configure receitas para conectar produtos aos ingredientes.
              </p>
            ) : (
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                {productBOM.length} receita(s) cadastrada(s)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
