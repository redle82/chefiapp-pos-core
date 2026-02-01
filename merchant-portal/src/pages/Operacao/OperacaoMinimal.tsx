/**
 * OPERACAO MINIMAL — Centro de Configuração Operacional
 * 
 * Núcleo único de configuração: Menu, Tarefas, Mapa, Equipe.
 * Tudo versionado e integrado.
 */

import { useState, useEffect } from 'react';
import { MenuBuilderMinimal } from '../MenuBuilder/MenuBuilderMinimal';
import { TaskBuilderMinimal } from './TaskBuilderMinimal';
import { MapBuilderMinimal } from './MapBuilderMinimal';
import { useRestaurantIdentity } from '../../core/identity/useRestaurantIdentity';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';

type OperacaoTab = 'menu' | 'tarefas' | 'mapa' | 'equipe';

export function OperacaoMinimal() {
  const { identity } = useRestaurantIdentity();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OperacaoTab>('menu');

  const DEFAULT_RESTAURANT_ID = 'bbce08c7-63c0-473d-b693-ec2997f73a68';

  useEffect(() => {
    const id = identity.id || getTabIsolated('chefiapp_restaurant_id') || DEFAULT_RESTAURANT_ID;
    setRestaurantId(id);
    setLoading(false);
  }, [identity.id]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Carregando...</div>
      </div>
    );
  }

  const finalRestaurantId = restaurantId || DEFAULT_RESTAURANT_ID;

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
          ⚙️ Configuração Operacional
        </h1>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Restaurante: {finalRestaurantId.slice(0, 8)}...
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('menu')}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: activeTab === 'menu' ? 'bold' : 'normal',
            border: 'none',
            borderBottom: activeTab === 'menu' ? '2px solid #3b82f6' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: activeTab === 'menu' ? '#3b82f6' : '#6b7280',
          }}
        >
          🍽️ Menu
        </button>
        <button
          onClick={() => setActiveTab('tarefas')}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: activeTab === 'tarefas' ? 'bold' : 'normal',
            border: 'none',
            borderBottom: activeTab === 'tarefas' ? '2px solid #3b82f6' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: activeTab === 'tarefas' ? '#3b82f6' : '#6b7280',
          }}
        >
          🧠 Tarefas
        </button>
        <button
          onClick={() => setActiveTab('mapa')}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: activeTab === 'mapa' ? 'bold' : 'normal',
            border: 'none',
            borderBottom: activeTab === 'mapa' ? '2px solid #3b82f6' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: activeTab === 'mapa' ? '#3b82f6' : '#6b7280',
          }}
        >
          🗺️ Mapa
        </button>
        <button
          onClick={() => setActiveTab('equipe')}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: activeTab === 'equipe' ? 'bold' : 'normal',
            border: 'none',
            borderBottom: activeTab === 'equipe' ? '2px solid #3b82f6' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: activeTab === 'equipe' ? '#3b82f6' : '#6b7280',
          }}
        >
          👥 Equipe
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'menu' && (
        <div style={{ marginTop: '20px' }}>
          <MenuBuilderMinimal />
        </div>
      )}

      {activeTab === 'tarefas' && (
        <div style={{ marginTop: '20px' }}>
          <TaskBuilderMinimal restaurantId={finalRestaurantId} />
        </div>
      )}

      {activeTab === 'mapa' && (
        <div style={{ marginTop: '20px' }}>
          <MapBuilderMinimal restaurantId={finalRestaurantId} />
        </div>
      )}

      {activeTab === 'equipe' && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
            👥 Equipe / Cargos
          </h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Configuração de equipe e cargos será implementada na próxima fase.
          </p>
        </div>
      )}
    </div>
  );
}
