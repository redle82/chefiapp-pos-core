/**
 * GroupDashboard.tsx
 * 
 * Consolidated dashboard for a restaurant group (Multi-Location UI - Q2 2026 Feature 2)
 * Shows aggregated metrics across all restaurants in the group
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

interface Restaurant {
  id: string;
  name: string;
  ordersToday: number;
  revenueToday: number;
  status: 'online' | 'offline';
}

interface GroupDashboard {
  group: {
    id: string;
    name: string;
    restaurantIds: string[];
    settings: any;
  };
  restaurants: Restaurant[];
  consolidated: {
    totalOrdersToday: number;
    totalRevenueToday: number;
    totalCustomersToday: number;
  };
}

export const GroupDashboard: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { session } = useSupabaseAuth();
  const [dashboard, setDashboard] = useState<GroupDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) {
      loadDashboard();
    }
  }, [groupId, session]);

  const loadDashboard = async () => {
    if (!session?.access_token || !groupId) return;

    try {
      setLoading(true);
      const response = await fetchJson(
        CONFIG.API_BASE || '',
        `/api/restaurant-groups/${groupId}/dashboard`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-ChefiApp-Token': session.access_token,
            'X-User-Id': session.user?.id || '',
          },
        }
      );

      setDashboard(response);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ padding: spacing[6], textAlign: 'center' }}>
          <Text color="tertiary">Carregando dashboard...</Text>
        </div>
      </AppLayout>
    );
  }

  if (error || !dashboard) {
    return (
      <AppLayout>
        <div style={{ padding: spacing[6] }}>
          <Card surface="layer1" padding="md" style={{ backgroundColor: `${colors.destructive.base}15` }}>
            <Text size="sm" color="destructive">{error || 'Dashboard não encontrado'}</Text>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/multi-location')}
              style={{ marginTop: spacing[3] }}
            >
              Voltar para Grupos
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ padding: spacing[6], maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: spacing[6] }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/multi-location')}
            style={{ marginBottom: spacing[4] }}
          >
            ← Voltar para Grupos
          </Button>
          <Text size="3xl" weight="black" color="primary">
            {dashboard.group.name}
          </Text>
          <Text size="sm" color="tertiary" style={{ marginTop: spacing[2] }}>
            Dashboard Consolidado
          </Text>
        </div>

        {/* Consolidated Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: spacing[4], marginBottom: spacing[6] }}>
          <Card surface="layer1" padding="lg">
            <Text size="sm" color="tertiary" style={{ marginBottom: spacing[2] }}>
              Pedidos Hoje
            </Text>
            <Text size="3xl" weight="black" color="primary">
              {dashboard.consolidated.totalOrdersToday}
            </Text>
          </Card>
          <Card surface="layer1" padding="lg">
            <Text size="sm" color="tertiary" style={{ marginBottom: spacing[2] }}>
              Receita Hoje
            </Text>
            <Text size="3xl" weight="black" color="primary">
              {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(dashboard.consolidated.totalRevenueToday)}
            </Text>
          </Card>
          <Card surface="layer1" padding="lg">
            <Text size="sm" color="tertiary" style={{ marginBottom: spacing[2] }}>
              Restaurantes
            </Text>
            <Text size="3xl" weight="black" color="primary">
              {dashboard.restaurants.length}
            </Text>
          </Card>
        </div>

        {/* Restaurants List */}
        <Card surface="layer1" padding="lg">
          <Text size="xl" weight="bold" color="primary" style={{ marginBottom: spacing[4] }}>
            Restaurantes no Grupo
          </Text>
          <div style={{ display: 'grid', gap: spacing[3] }}>
            {dashboard.restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: spacing[3],
                  border: `1px solid ${colors.border.subtle}`,
                  borderRadius: 6,
                }}
              >
                <div style={{ flex: 1 }}>
                  <Text size="lg" weight="bold" color="primary">
                    {restaurant.name}
                  </Text>
                  <div style={{ display: 'flex', gap: spacing[4], marginTop: spacing[2] }}>
                    <Text size="sm" color="tertiary">
                      {restaurant.ordersToday} pedidos
                    </Text>
                    <Text size="sm" color="tertiary">
                      {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(restaurant.revenueToday)}
                    </Text>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: restaurant.status === 'online' ? colors.success.base : colors.destructive.base,
                    }}
                  />
                  <Text size="sm" color={restaurant.status === 'online' ? 'success' : 'destructive'}>
                    {restaurant.status === 'online' ? 'Online' : 'Offline'}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};
