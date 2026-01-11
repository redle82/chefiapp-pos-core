/**
 * RestaurantGroupManager.tsx
 * 
 * Main component for managing restaurant groups (Multi-Location UI - Q2 2026 Feature 2)
 * Allows owners to create groups, add restaurants, and manage settings
 */

import React, { useState, useEffect } from 'react';
import { useTenant } from '../../core/tenant/TenantContext';
import { AppLayout } from '../../components/Layout/AppLayout';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { colors } from '../../ui/design-system/tokens/colors';
import { spacing } from '../../ui/design-system/tokens/spacing';
import { CONFIG } from '../../config';
import { fetchJson } from '../../api';
import { useSupabaseAuth } from '../../core/auth/useSupabaseAuth';

interface RestaurantGroup {
  id: string;
  ownerId: string;
  name: string;
  restaurantIds: string[];
  settings: {
    sharedMenu: boolean;
    sharedMarketplaceAccount: boolean;
    consolidatedBilling: boolean;
    allowLocationOverrides: boolean;
  };
  primaryBillingRestaurantId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Restaurant {
  id: string;
  name: string;
}

export const RestaurantGroupManager: React.FC = () => {
  const { tenantId, memberships } = useTenant();
  const { session } = useSupabaseAuth();
  const [groups, setGroups] = useState<RestaurantGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);

  useEffect(() => {
    loadGroups();
  }, [tenantId, session]);

  const loadGroups = async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      const response = await fetchJson(
        CONFIG.API_BASE || '',
        '/api/restaurant-groups',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-ChefiApp-Token': session.access_token,
            'X-User-Id': session.user?.id || '',
          },
        }
      );

      setGroups(response.groups || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load groups:', err);
      setError(err.message || 'Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!session?.access_token || !newGroupName.trim() || selectedRestaurants.length === 0) {
      setError('Nome e pelo menos um restaurante são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const response = await fetchJson(
        CONFIG.API_BASE || '',
        '/api/restaurant-groups',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-ChefiApp-Token': session.access_token,
            'X-User-Id': session.user?.id || '',
          },
          body: JSON.stringify({
            name: newGroupName,
            restaurantIds: selectedRestaurants,
            sharedMenu: false,
            sharedMarketplaceAccount: false,
            consolidatedBilling: false,
            allowLocationOverrides: true,
          }),
        }
      );

      setGroups([...groups, response.group]);
      setShowCreateModal(false);
      setNewGroupName('');
      setSelectedRestaurants([]);
      setError(null);
    } catch (err: any) {
      console.error('Failed to create group:', err);
      setError(err.message || 'Erro ao criar grupo');
    } finally {
      setLoading(false);
    }
  };

  const availableRestaurants = memberships || [];

  return (
    <AppLayout>
      <div style={{ padding: spacing[6], maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: spacing[6], display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text size="3xl" weight="black" color="primary">
              Grupos de Restaurantes
            </Text>
            <Text size="sm" color="tertiary" style={{ marginTop: spacing[2] }}>
              Gerencie múltiplas localizações com menus compartilhados e faturação consolidada
            </Text>
          </div>
          <Button
            tone="action"
            size="lg"
            onClick={() => setShowCreateModal(true)}
          >
            + Criar Grupo
          </Button>
        </div>

        {error && (
          <Card surface="layer1" padding="md" style={{ marginBottom: spacing[4], backgroundColor: `${colors.destructive.base}15` }}>
            <Text size="sm" color="destructive">{error}</Text>
          </Card>
        )}

        {loading && groups.length === 0 ? (
          <Card surface="layer1" padding="xl">
            <Text color="tertiary">Carregando grupos...</Text>
          </Card>
        ) : groups.length === 0 ? (
          <Card surface="layer1" padding="xl">
            <Text color="tertiary" style={{ textAlign: 'center', marginBottom: spacing[4] }}>
              Nenhum grupo criado ainda
            </Text>
            <div style={{ textAlign: 'center' }}>
              <Button tone="action" onClick={() => setShowCreateModal(true)}>
                Criar Primeiro Grupo
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: spacing[4] }}>
            {groups.map((group) => (
              <Card key={group.id} surface="layer1" padding="lg" style={{ cursor: 'pointer' }}>
                <Text size="xl" weight="bold" color="primary" style={{ marginBottom: spacing[3] }}>
                  {group.name}
                </Text>
                <Text size="sm" color="tertiary" style={{ marginBottom: spacing[2] }}>
                  {group.restaurantIds.length} {group.restaurantIds.length === 1 ? 'restaurante' : 'restaurantes'}
                </Text>
                <div style={{ marginTop: spacing[4], display: 'flex', gap: spacing[2] }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/app/multi-location/${group.id}/dashboard`}
                  >
                    Ver Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/app/multi-location/${group.id}/settings`}
                  >
                    Configurações
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {showCreateModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <Card surface="layer1" padding="xl" style={{ maxWidth: 500, width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
              <Text size="xl" weight="bold" color="primary" style={{ marginBottom: spacing[4] }}>
                Criar Novo Grupo
              </Text>

              <div style={{ marginBottom: spacing[4] }}>
                <Text size="sm" color="tertiary" style={{ marginBottom: spacing[2] }}>
                  Nome do Grupo
                </Text>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ex: Restaurantes Sofia"
                  style={{
                    width: '100%',
                    padding: spacing[3],
                    background: colors.surface.layer2,
                    border: `1px solid ${colors.border.subtle}`,
                    borderRadius: 6,
                    color: colors.text.primary,
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: spacing[4] }}>
                <Text size="sm" color="tertiary" style={{ marginBottom: spacing[2] }}>
                  Restaurantes (selecione pelo menos um)
                </Text>
                <div style={{ maxHeight: 200, overflow: 'auto', border: `1px solid ${colors.border.subtle}`, borderRadius: 6, padding: spacing[2] }}>
                  {availableRestaurants.map((membership) => (
                    <label
                      key={membership.restaurant.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: spacing[2],
                        cursor: 'pointer',
                        borderRadius: 4,
                        marginBottom: spacing[1],
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRestaurants.includes(membership.restaurant.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRestaurants([...selectedRestaurants, membership.restaurant.id]);
                          } else {
                            setSelectedRestaurants(selectedRestaurants.filter(id => id !== membership.restaurant.id));
                          }
                        }}
                        style={{ marginRight: spacing[2] }}
                      />
                      <Text size="sm" color="primary">{membership.restaurant.name}</Text>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: spacing[3], marginTop: spacing[6] }}>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewGroupName('');
                    setSelectedRestaurants([]);
                  }}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </Button>
                <Button
                  tone="action"
                  size="lg"
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim() || selectedRestaurants.length === 0 || loading}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Criando...' : 'Criar Grupo'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
