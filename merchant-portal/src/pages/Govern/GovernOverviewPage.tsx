/**
 * GovernOverviewPage.tsx — GovernManage Overview Dashboard
 * 
 * Main dashboard showing:
 * - Overall rating and trends
 * - Alerts
 * - Top churn reasons
 * - Recent actions
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../../ui/design-system/primitives/Card';
import { Button } from '../../ui/design-system/primitives/Button';
import { Text } from '../../ui/design-system/primitives/Text';
import { useToast } from '../../ui/design-system';
import { CONFIG } from '../../config';
import { useSupabaseAuth } from '../../core/auth/useSupabaseAuth';
import { useRestaurantIdentity } from '../../core/identity/useRestaurantIdentity';
import { StaffProvider, useStaff } from '../AppStaff/context/StaffContext';
import { OSCopy } from '../../ui/design-system/sovereign/OSCopy';
import { colors } from '../../ui/design-system/tokens/colors';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';

interface Insight {
  id: string;
  overall_rating: number;
  total_reviews: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  summary_md: string;
  churn_reasons_json: Array<{
    topic: string;
    count: number;
    sentiment: number;
  }>;
  alerts_json: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
  window_end: string;
}

interface Action {
  id: string;
  action_title: string;
  action_description: string;
  role_target: string;
  priority: string;
  topic: string;
  reason_text: string;
  status: string;
}

type GovernContentProps = { restaurantId: string };

function GovernContent({ restaurantId }: GovernContentProps) {
  const { success, error } = useToast();
  const [insight, setInsight] = useState<Insight | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(false);
  const { tasks, employees } = useStaff();
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'focused' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'urgent' | 'attention' | 'background'>('all');

  const loadData = useCallback(async () => {
    if (!restaurantId) return;

    setLoading(true);
    try {
      const insightResponse = await fetch(
        `${CONFIG.API_BASE}/api/govern/insights?restaurant_id=${restaurantId}`
      );
      if (insightResponse.ok) {
        const data = await insightResponse.json();
        setInsight(data);
      }

      const actionsResponse = await fetch(
        `${CONFIG.API_BASE}/api/govern/actions?restaurant_id=${restaurantId}&status=pending`
      );
      if (actionsResponse.ok) {
        const data = await actionsResponse.json();
        setActions(data.actions || []);
      }
    } catch (err) {
      console.error('Error loading GovernManage data:', err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRunPipeline = async () => {
    if (!restaurantId) return;

    setLoading(true);
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/govern/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_id: restaurantId }),
      });

      if (response.ok) {
        success(OSCopy.governance.pipelineExecuted);
        await loadData();
      } else {
        const err = await response.json();
        error(err.error || OSCopy.governance.pipelineFailed);
      }
    } catch (err) {
      console.error('Error running pipeline:', err);
      error(OSCopy.governance.pipelineFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkActionComplete = async (actionId: string) => {
    if (!restaurantId) return;

    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/govern/actions/${actionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        success('Ação marcada como concluída!');
        await loadData();
      }
    } catch (err) {
      console.error('Error marking action complete:', err);
      error('Erro ao marcar ação como concluída');
    }
  };

  const topicLabels = OSCopy.governance.topics;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <Text size="2xl" weight="bold" color="primary" style={{ marginBottom: 8 }}>
            🧠 {OSCopy.governance.title}
          </Text>
          <Text color="secondary">
            {OSCopy.governance.subtitle}
          </Text>
        </div>
        <Button
          tone="action"
          variant="solid"
          onClick={handleRunPipeline}
          disabled={loading}
        >
          {loading ? OSCopy.governance.processing : OSCopy.governance.runPipeline}
        </Button>
      </div>

      {/* Ações em execução no restaurante (read-only) */}
      <Card surface="layer1" padding="lg" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <Text size="lg" weight="bold" color="primary">📎 {OSCopy.governance.sections.runningActions}</Text>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value as 'all' | 'pending' | 'focused' | 'done')}
              style={{ padding: 8, borderRadius: 8, border: `1px solid ${colors.modes.dashboard.border.subtle}`, background: colors.modes.dashboard.surface.layer2, color: colors.modes.dashboard.text.primary }}
            >
              <option value="all">Todas</option>
              <option value="pending">Pendentes</option>
              <option value="focused">Em foco</option>
              <option value="done">Concluídas</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as 'all' | 'critical' | 'urgent' | 'attention' | 'background')}
              style={{ padding: 8, borderRadius: 8, border: `1px solid ${colors.modes.dashboard.border.subtle}`, background: colors.modes.dashboard.surface.layer2, color: colors.modes.dashboard.text.primary }}
            >
              <option value="all">Todas prioridades</option>
              <option value="critical">Crítica</option>
              <option value="urgent">Urgente</option>
              <option value="attention">Atenção</option>
              <option value="background">Background</option>
            </select>
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
              return (
                <div key={t.id} style={{ padding: 10, borderRadius: 8, background: colors.modes.dashboard.surface.layer2, borderLeft: `4px solid ${colors.modes.dashboard.info.base}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <Text weight="bold" size="sm">{t.title}</Text>
                    <Text size="xs" color="secondary">{t.priority}</Text>
                  </div>
                  <Text size="xs" color="secondary" style={{ marginTop: 4 }}>
                    Status: {t.status} • Destinatário: {assignee}
                  </Text>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Overall Rating Card */}
      {insight && (
        <Card surface="layer1" padding="lg" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{
              fontSize: 64,
              fontWeight: 800,
              color: insight.overall_rating >= 4.0 ? colors.palette.emerald[500] :
                insight.overall_rating >= 3.0 ? colors.palette.amber[500] : colors.palette.fire[500]
            }}>
              {insight.overall_rating.toFixed(1)}
            </div>
            <div style={{ flex: 1 }}>
              <Text size="lg" weight="bold" color="primary">
                {OSCopy.governance.sections.rating}
              </Text>
              <Text size="sm" color="secondary" style={{ marginTop: 4 }}>
                {insight.total_reviews} reviews •
                {insight.positive_count} positivas •
                {insight.negative_count} negativas
              </Text>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Text size="xs" color="success">{insight.positive_count} ⭐</Text>
                <Text size="xs" color="secondary">{insight.neutral_count} ➖</Text>
                <Text size="xs" color="destructive">{insight.negative_count} ⚠️</Text>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Alerts */}
      {insight && insight.alerts_json.length > 0 && (
        <Card surface="layer1" padding="lg" style={{ marginBottom: 24 }}>
          <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
            🚨 {OSCopy.governance.sections.alerts}
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {insight.alerts_json.map((alert, idx) => (
              <div key={idx} style={{
                padding: 16,
                background: colors.modes.dashboard.surface.layer2,
                borderRadius: 8,
                borderLeft: `4px solid ${alert.severity === 'critical' ? colors.modes.dashboard.destructive.base :
                  alert.severity === 'high' ? colors.modes.dashboard.warning.base : colors.modes.dashboard.success.base
                  }`
              }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                  <Text size="xs" color="secondary">{alert.severity.toUpperCase()}</Text>
                  <Text>{alert.message}</Text>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Churn Reasons */}
      {insight && insight.churn_reasons_json.length > 0 && (
        <Card surface="layer1" padding="lg" style={{ marginBottom: 24 }}>
          <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
            📉 {OSCopy.governance.sections.churn}
          </Text>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {insight.churn_reasons_json.slice(0, 6).map((reason, idx) => (
              <div key={idx} style={{
                padding: 16,
                background: colors.modes.dashboard.surface.layer2,
                borderRadius: 8,
              }}>
                <Text weight="bold" style={{ marginBottom: 4 }}>
                  {topicLabels[reason.topic as keyof typeof topicLabels] || reason.topic}
                </Text>
                <Text size="sm" color="secondary">
                  {reason.count} menções • Sentimento: {(reason.sentiment * 100).toFixed(0)}%
                </Text>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <Card surface="layer1" padding="lg">
        <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
          💡 {OSCopy.governance.sections.recommended} ({actions.length})
        </Text>
        {actions.length === 0 ? (
          <Text color="secondary">
            Nenhuma ação pendente. Execute o pipeline para gerar recomendações.
          </Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {actions.map((action) => (
              <div key={action.id} style={{
                padding: 16,
                background: colors.modes.dashboard.surface.layer2,
                borderRadius: 8,
                borderLeft: `4px solid ${action.priority === 'critical' ? colors.modes.dashboard.destructive.base :
                  action.priority === 'high' ? colors.modes.dashboard.warning.base : colors.modes.dashboard.success.base
                  }`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <Text weight="bold">{action.action_title}</Text>
                      <Text size="xs" color="secondary">{action.priority.toUpperCase()}</Text>
                      {action.topic && (
                        <Text size="xs" color="secondary">{topicLabels[action.topic as keyof typeof topicLabels] || action.topic}</Text>
                      )}
                    </div>
                    <Text size="sm" color="secondary" style={{ marginBottom: 4 }}>
                      {action.action_description}
                    </Text>
                    <Text size="xs" color="tertiary" style={{ fontStyle: 'italic' }}>
                      {action.reason_text}
                    </Text>
                    <Text size="xs" color="secondary" style={{ marginTop: 8 }}>
                      Para: {action.role_target}
                    </Text>
                  </div>
                  <Button
                    tone="neutral"
                    variant="outline"
                    onClick={() => handleMarkActionComplete(action.id)}
                    disabled={loading}
                  >
                    {loading ? '...' : 'Concluir'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export function GovernOverviewPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { identity } = useRestaurantIdentity();
  const restaurantId = identity.id || getTabIsolated('chefiapp_restaurant_id');

  if (authLoading || identity.loading) {
    return (
      <div style={{ padding: 32 }}>
        <Text color="secondary">Carregando contexto...</Text>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div style={{ padding: 32 }}>
        <Text color="secondary">Restaurante não identificado.</Text>
      </div>
    );
  }

  return (
    <StaffProvider restaurantId={restaurantId} userId={user?.id || null}>
      <GovernContent restaurantId={restaurantId} />
    </StaffProvider>
  );
}

