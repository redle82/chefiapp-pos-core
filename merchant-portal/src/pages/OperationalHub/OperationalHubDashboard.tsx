/**
 * OperationalHubDashboard.tsx — Dashboard Principal de Operações
 * 
 * Inspirado no Last.app: Fast Mode, Stock, Fichaje, Delivery, Analytics.
 */

import { useState, useEffect } from 'react';
import { Card } from '../../ui/design-system/primitives/Card';
import { Button } from '../../ui/design-system/primitives/Button';
import { Text } from '../../ui/design-system/primitives/Text';
import { CONFIG } from '../../config';
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal';
import { useSupabaseAuth } from '../../core/auth/useSupabaseAuth';
import { useRestaurantIdentity } from '../../core/identity/useRestaurantIdentity';
import { StaffProvider, useStaff } from '../AppStaff/context/StaffContext';
import { OSCopy } from '../../ui/design-system/sovereign/OSCopy';
import { colors } from '../../ui/design-system/tokens/colors';

interface FastModeConfig {
  enabled: boolean;
  quick_products: string[];
  default_payment_method: string;
}

interface StockItem {
  id: string;
  product_name: string;
  current_stock: number;
  min_stock: number;
  unit: string;
}

interface TimeTracking {
  id: string;
  user_id: string;
  shift_date: string;
  clock_in?: string;
  clock_out?: string;
  total_hours?: number;
  status: string;
}

interface DeliveryChannel {
  id: string;
  channel_name: string;
  enabled: boolean;
  auto_accept: boolean;
}

interface AnalyticsSnapshot {
  snapshot_date: string;
  total_sales: number;
  total_orders: number;
  average_ticket: number;
}

function OperationalHubContent({ restaurantId }: { restaurantId: string }) {
  const { tasks, employees, activeRole, startTask } = useStaff();
  const [fastMode, setFastMode] = useState<FastModeConfig | null>(null);
  const [lowStock, setLowStock] = useState<StockItem[]>([]);
  const [activeShifts, setActiveShifts] = useState<TimeTracking[]>([]);
  const [deliveryChannels, setDeliveryChannels] = useState<DeliveryChannel[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'focused' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'urgent' | 'attention' | 'background'>('all');

  useEffect(() => {
    const run = async () => {
      if (!restaurantId) return;
      try {
        const fastModeResponse = await fetch(
          `${CONFIG.API_BASE}/api/operational-hub/fast-mode?restaurant_id=${restaurantId}`
        );
        if (fastModeResponse.ok) {
          const data = await fastModeResponse.json();
          setFastMode(data.config);
        }

        const stockResponse = await fetch(
          `${CONFIG.API_BASE}/api/operational-hub/stock/low?restaurant_id=${restaurantId}`
        );
        if (stockResponse.ok) {
          const data = await stockResponse.json();
          setLowStock(data.items || []);
        }

        const shiftsResponse = await fetch(
          `${CONFIG.API_BASE}/api/operational-hub/time-tracking/active?restaurant_id=${restaurantId}`
        );
        if (shiftsResponse.ok) {
          const data = await shiftsResponse.json();
          setActiveShifts(data.shifts || []);
        }

        const deliveryResponse = await fetch(
          `${CONFIG.API_BASE}/api/operational-hub/delivery/channels?restaurant_id=${restaurantId}`
        );
        if (deliveryResponse.ok) {
          const data = await deliveryResponse.json();
          setDeliveryChannels(data.channels || []);
        }

        const today = new Date().toISOString().split('T')[0];
        const analyticsResponse = await fetch(
          `${CONFIG.API_BASE}/api/operational-hub/analytics?restaurant_id=${restaurantId}&date=${today}`
        );
        if (analyticsResponse.ok) {
          const data = await analyticsResponse.json();
          setAnalytics(data.snapshot);
        }
      } catch (err) {
        console.error('Error loading OperationalHub data:', err);
      }
    };
    void run();
  }, [restaurantId]);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <Text size="2xl" weight="bold" color="primary" style={{ marginBottom: 8 }}>
            ⚡ {OSCopy.operations.hubTitle}
          </Text>
          <Text color="secondary">
            {OSCopy.operations.hubSubtitle}
          </Text>
        </div>
        <Button tone="action" onClick={() => setShowTaskModal(true)}>{OSCopy.operations.createTask}</Button>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <Card surface="layer1" padding="lg" style={{ marginBottom: 24 }}>
          <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
            📊 {OSCopy.operations.analytics.title}
          </Text>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <Text size="sm" color="secondary">{OSCopy.operations.analytics.sales}</Text>
              <Text size="2xl" weight="bold" color="primary">
                €{analytics.total_sales.toFixed(2)}
              </Text>
            </div>
            <div>
              <Text size="sm" color="secondary">{OSCopy.operations.analytics.orders}</Text>
              <Text size="2xl" weight="bold" color="primary">
                {analytics.total_orders}
              </Text>
            </div>
            <div>
              <Text size="sm" color="secondary">{OSCopy.operations.analytics.avgTicket}</Text>
              <Text size="2xl" weight="bold" color="primary">
                €{analytics.average_ticket.toFixed(2)}
              </Text>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Fast Mode */}
        <Card surface="layer1" padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text size="lg" weight="bold" color="primary">
              ⚡ {OSCopy.operations.fastMode.title}
            </Text>
            {fastMode && (
              <Text size="xs" color={fastMode.enabled ? 'success' : 'tertiary'}>
                {fastMode.enabled ? OSCopy.operations.fastMode.active : OSCopy.operations.fastMode.inactive}
              </Text>
            )}
          </div>
          {fastMode ? (
            <div>
              <Text size="sm" color="secondary" style={{ marginBottom: 8 }}>
                {OSCopy.operations.fastMode.description}
              </Text>
              <Text size="xs" color="tertiary">
                {fastMode.quick_products.length} produtos rápidos •
                Pagamento padrão: {fastMode.default_payment_method}
              </Text>
            </div>
          ) : (
            <Text color="secondary">{OSCopy.operations.fastMode.notConfigured}</Text>
          )}
        </Card>

        {/* Low Stock Alerts */}
        <Card surface="layer1" padding="lg">
          <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
            📦 {OSCopy.operations.stock.title} ({lowStock.length})
          </Text>
          {lowStock.length === 0 ? (
            <Text color="secondary">{OSCopy.operations.stock.allGood} ✅</Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lowStock.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 12,
                    background: colors.modes.dashboard.surface.layer2,
                    borderRadius: 8,
                    borderLeft: `4px solid ${colors.palette.amber[500]}`,
                  }}
                >
                  <Text weight="bold" size="sm">{item.product_name}</Text>
                  <Text size="xs" color="secondary">
                    {item.current_stock} {item.unit} (mín: {item.min_stock})
                  </Text>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Active Shifts */}
        <Card surface="layer1" padding="lg">
          <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
            👥 {OSCopy.operations.shifts.title} ({activeShifts.length})
          </Text>
          {activeShifts.length === 0 ? (
            <Text color="secondary">{OSCopy.operations.shifts.none}</Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeShifts.map((shift) => (
                <div
                  key={shift.id}
                  style={{
                    padding: 12,
                    background: colors.modes.dashboard.surface.layer2,
                    borderRadius: 8,
                  }}
                >
                  <Text weight="bold" size="sm">Turno {shift.shift_date}</Text>
                  {shift.clock_in && (
                    <Text size="xs" color="secondary">
                      Entrada: {new Date(shift.clock_in).toLocaleTimeString('pt-BR')}
                    </Text>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Delivery Channels */}
        <Card surface="layer1" padding="lg">
          <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
            🚚 {OSCopy.operations.delivery.title} ({deliveryChannels.length})
          </Text>
          {deliveryChannels.length === 0 ? (
            <Text color="secondary">{OSCopy.operations.delivery.none}</Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {deliveryChannels.map((channel) => (
                <div
                  key={channel.id}
                  style={{
                    padding: 12,
                    background: colors.modes.dashboard.surface.layer2,
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text weight="bold" size="sm">{channel.channel_name}</Text>
                  <Text size="xs" color={channel.enabled ? 'success' : 'tertiary'}>
                    {channel.enabled ? OSCopy.operations.fastMode.active : OSCopy.operations.fastMode.inactive}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Tasks (feedback rápido) */}
        <Card surface="layer1" padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text size="lg" weight="bold" color="primary">✅ {OSCopy.operations.tasks.title}</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <select
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value as 'all' | 'pending' | 'focused' | 'done')}
                  style={{ padding: 8, borderRadius: 8, border: `1px solid ${colors.modes.dashboard.border.subtle}`, background: colors.modes.dashboard.surface.layer2, color: colors.modes.dashboard.text.primary }}
                >
                  <option value="all">{OSCopy.operations.tasks.status.all}</option>
                  <option value="pending">{OSCopy.operations.tasks.status.pending}</option>
                  <option value="focused">{OSCopy.operations.tasks.status.focused}</option>
                  <option value="done">{OSCopy.operations.tasks.status.done}</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as 'all' | 'critical' | 'urgent' | 'attention' | 'background')}
                  style={{ padding: 8, borderRadius: 8, border: `1px solid ${colors.modes.dashboard.border.subtle}`, background: colors.modes.dashboard.surface.layer2, color: colors.modes.dashboard.text.primary }}
                >
                  <option value="all">{OSCopy.operations.tasks.priority.all}</option>
                  <option value="critical">{OSCopy.operations.tasks.priority.critical}</option>
                  <option value="urgent">{OSCopy.operations.tasks.priority.urgent}</option>
                  <option value="attention">{OSCopy.operations.tasks.priority.attention}</option>
                  <option value="background">{OSCopy.operations.tasks.priority.background}</option>
                </select>
              </div>
              <Text size="xs" color="secondary">{tasks.length} tarefas</Text>
            </div>
          </div>
          {tasks.length === 0 ? (
            <Text color="secondary">{OSCopy.operations.tasks.none}</Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {([...tasks].sort((a, b) => {
                const statusOrder: Record<string, number> = { pending: 0, focused: 1, done: 2 };
                const priorityOrder: Record<string, number> = { critical: 0, urgent: 1, attention: 2, background: 3 };
                const so = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
                if (so !== 0) return so;
                const po = (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
                if (po !== 0) return po;
                return (b.createdAt || 0) - (a.createdAt || 0);
              }).filter((t) => taskFilter === 'all' ? true : t.status === taskFilter)
                .filter((t) => priorityFilter === 'all' ? true : t.priority === priorityFilter)
              ).slice(0, 8).map((t) => {
                const assignee = t.assigneeId
                  ? employees.find((e) => e.id === t.assigneeId)?.name || '—'
                  : t.assigneeRole ? t.assigneeRole : '—';
                const isPending = t.status === 'pending';
                const leftColor = t.status === 'done' ? colors.palette.emerald[500] : t.status === 'focused' ? colors.palette.amber[500] : colors.palette.blue[500];
                const assigneeEmp = t.assigneeId ? employees.find((e) => e.id === t.assigneeId) : null;
                const assigneeUserId = assigneeEmp?.user_id;
                const isAssigneeOnShift = assigneeUserId
                  ? activeShifts.some((s) => s.user_id === assigneeUserId && s.status === 'active')
                  : false;
                return (
                  <div key={t.id} style={{ padding: 10, borderRadius: 8, background: colors.modes.dashboard.surface.layer2, borderLeft: `4px solid ${leftColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <Text weight="bold" size="sm">{t.title}</Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text size="xs" color="secondary">{t.priority}</Text>
                        {(activeRole === 'manager' || activeRole === 'owner') && t.status === 'pending' && (
                          <Button size="sm" tone="info" onClick={() => startTask(t.id)}>Focus</Button>
                        )}
                      </div>
                    </div>
                    <Text size="xs" color="secondary" style={{ marginTop: 4 }}>
                      Status: {t.status} • Destinatário: {assignee}
                    </Text>
                    {isAssigneeOnShift && (
                      <Text size="xs" color="success" style={{ marginTop: 2 }}>
                        Em turno ativo
                      </Text>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {showTaskModal && (
        <CreateTaskModal open={showTaskModal} onClose={() => setShowTaskModal(false)} />
      )}
    </div>
  );
}

import { LockedFeature } from '../../ui/design-system/sovereign/LockedFeature';

export function OperationalHubDashboard() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { identity } = useRestaurantIdentity();

  if (authLoading || identity.loading) {
    return (
      <div style={{ padding: 32 }}>
        <Text color="secondary">{OSCopy.actions.loading}</Text>
      </div>
    );
  }

  // Strict Sovereign Gate
  if (!identity.id) {
    return (
      <LockedFeature
        title={OSCopy.operations.hubTitle}
        reason={OSCopy.errors.permission || "Requer Ritual Avançado ou Acesso Admin."}
        actionLabel="Configurar Acesso"
        onAction={() => window.location.href = '/settings/advanced-setup'}
      />
    );
  }

  return (
    <StaffProvider restaurantId={identity.id} userId={user?.id || null}>
      <OperationalHubContent restaurantId={identity.id} />
    </StaffProvider>
  );
}

