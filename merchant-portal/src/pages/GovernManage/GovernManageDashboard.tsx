/**
 * GovernManageDashboard.tsx — Dashboard de Governança
 * 
 * Interface para governar o sistema: ver eventos, criar regras, controlar features.
 * "Eu governo meu sistema."
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/design-system/primitives/Card';
import { Button } from '../../ui/design-system/primitives/Button';
import { Text } from '../../ui/design-system/primitives/Text';
import { Badge } from '../../ui/design-system/primitives/Badge';
import { useToast } from '../../ui/design-system';
import { CONFIG } from '../../config';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';

interface EventType {
  type: string;
  count: number;
  last_occurrence?: string;
}

interface GovernanceRule {
  id: string;
  rule_name: string;
  rule_type: string;
  trigger_events: string[];
  enabled: boolean;
  priority: string;
  actions_count: number;
}

interface FeatureFlag {
  feature_key: string;
  enabled: boolean;
  enabled_at?: string;
}

interface Pattern {
  id: string;
  pattern_type: string;
  pattern_key: string;
  confidence: number;
  occurrence_count: number;
  last_seen_at: string;
}

interface Decision {
  id: string;
  event_type: string;
  event_priority: string;
  rule_name?: string;
  action_type: string;
  status: string;
  created_at: string;
  task_id?: string;
  dedupe_count?: number;
}

interface SimulationResult {
  rule_id: string;
  rule_name: string;
  simulation_period_days: number;
  total_events_matched: number;
  total_actions_generated: number;
  actions_by_type: Record<string, number>;
  tasks_created: number;
  escalations: number;
  affected_roles: string[];
  priority_breakdown: {
    P0: number;
    P1: number;
    P2: number;
    P3: number;
  };
  estimated_impact: {
    high_priority_tasks: number;
    notifications: number;
    feature_changes: number;
  };
}

interface VoiceDevice {
  id: string;
  device_name: string;
  location: string;
  enabled: boolean;
  last_seen_at?: string;
}

interface VoiceRoutine {
  id: string;
  routine_name: string;
  routine_type: string;
  enabled: boolean;
  last_executed_at?: string;
  next_execution_at?: string;
}

interface VoiceStatus {
  devices: VoiceDevice[];
  routines: VoiceRoutine[];
  pending_acks: number;
  last_routine_executed?: string;
}

function VoiceOperationsSection({ restaurantId }: { restaurantId: string | null }) {
  const { success, error } = useToast();
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      loadVoiceStatus();
    }
  }, [restaurantId]);

  const loadVoiceStatus = async () => {
    if (!restaurantId) return;
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/voice/status?restaurant_id=${restaurantId}`);
      if (response.ok) {
        const data = await response.json();
        setVoiceStatus(data);
      }
    } catch (err) {
      console.error('Error loading voice status:', err);
    }
  };

  const toggleRoutine = async (routineId: string, enabled: boolean) => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/voice/routines/${routineId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (response.ok) {
        success('Rotina atualizada');
        loadVoiceStatus();
      } else {
        error('Erro ao atualizar rotina');
      }
    } catch (err) {
      error('Erro ao atualizar rotina');
    } finally {
      setLoading(false);
    }
  };

  if (!voiceStatus) {
    return <Text color="secondary">Carregando...</Text>;
  }

  const getDeviceHealth = (device: VoiceDevice): 'healthy' | 'warning' | 'error' => {
    if (!device.last_seen_at) return 'error';
    const lastSeen = new Date(device.last_seen_at);
    const minutesAgo = (Date.now() - lastSeen.getTime()) / 1000 / 60;
    if (minutesAgo > 60) return 'error';
    if (minutesAgo > 15) return 'warning';
    return 'healthy';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Master Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
        <div>
          <Text size="md" weight="bold" color="primary">Voice Operations</Text>
          <Text size="xs" color="tertiary">Ativar/desativar todas as operações de voz</Text>
        </div>
        <Button
          onClick={async () => {
            // TODO: Toggle master feature flag
            const response = await fetch(`${CONFIG.API_BASE}/api/govern-manage/feature-flags/voice_operations_enabled`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ enabled: !voiceStatus.enabled }),
            });
            if (response.ok) {
              success(`Voice Operations ${!voiceStatus.enabled ? 'ativado' : 'desativado'}`);
              loadVoiceStatus();
            }
          }}
          variant={voiceStatus.enabled ? 'primary' : 'outline'}
          size="sm"
        >
          {voiceStatus.enabled ? 'Ativo' : 'Inativo'}
        </Button>
      </div>

      {/* Devices */}
      <div>
        <Text size="md" weight="bold" color="primary" style={{ marginBottom: 12 }}>
          Dispositivos ({voiceStatus.devices.length})
        </Text>
        {voiceStatus.devices.length === 0 ? (
          <Text size="sm" color="secondary">Nenhum dispositivo registrado</Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {voiceStatus.devices.map((device) => {
              const health = getDeviceHealth(device);
              const healthLabels = { healthy: 'Online', warning: 'Atenção', error: 'Offline' };
              const healthVariants = { healthy: 'success' as const, warning: 'warning' as const, error: 'error' as const };
              
              return (
                <div
                  key={device.id}
                  style={{
                    padding: 12,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <Text size="sm" weight="medium">{device.device_name}</Text>
                    <Text size="xs" color="tertiary">
                      {device.location} • {device.enabled ? 'Ativo' : 'Inativo'}
                      {device.last_seen_at && (
                        <> • Última vez: {new Date(device.last_seen_at).toLocaleTimeString('pt-BR')}</>
                      )}
                    </Text>
                  </div>
                  <Badge
                    label={healthLabels[health]}
                    variant={healthVariants[health]}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Routines */}
      <div>
        <Text size="md" weight="bold" color="primary" style={{ marginBottom: 12 }}>
          Rotinas ({voiceStatus.routines.length})
        </Text>
        {voiceStatus.routines.length === 0 ? (
          <Text size="sm" color="secondary">Nenhuma rotina configurada</Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {voiceStatus.routines.map((routine) => (
              <div
                key={routine.id}
                style={{
                  padding: 12,
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <Text size="sm" weight="medium">{routine.routine_name}</Text>
                  <Text size="xs" color="tertiary">
                    {routine.routine_type} • {routine.enabled ? 'Ativa' : 'Inativa'}
                    {routine.last_executed_at && (
                      <> • Última: {new Date(routine.last_executed_at).toLocaleString('pt-BR')}</>
                    )}
                    {routine.next_execution_at && (
                      <> • Próxima: {new Date(routine.next_execution_at).toLocaleString('pt-BR')}</>
                    )}
                  </Text>
                </div>
                <Button
                  onClick={() => toggleRoutine(routine.id, routine.enabled)}
                  variant={routine.enabled ? 'outline' : 'primary'}
                  size="sm"
                  disabled={loading}
                >
                  {routine.enabled ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last Triggered Routine */}
      {voiceStatus.last_triggered_routine && (
        <div
          style={{
            padding: 12,
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}
        >
          <Text size="sm" weight="medium" color="info">
            🎙️ Última rotina: {voiceStatus.last_triggered_routine.routine_name}
          </Text>
          <Text size="xs" color="tertiary" style={{ marginTop: 4 }}>
            {new Date(voiceStatus.last_triggered_routine.triggered_at).toLocaleString('pt-BR')}
          </Text>
        </div>
      )}

      {/* Pending Acks */}
      {voiceStatus.pending_acks > 0 && (
        <div
          style={{
            padding: 12,
            background: 'rgba(251, 191, 36, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(251, 191, 36, 0.3)',
          }}
        >
          <Text size="sm" weight="medium" color="warning">
            ⚠️ {voiceStatus.pending_acks} lembrete(s) aguardando confirmação
          </Text>
        </div>
      )}
    </div>
  );
}

export function GovernManageDashboard() {
  const { success, error } = useToast();
  const [restaurantId] = useState<string | null>(getTabIsolated('chefiapp_restaurant_id'));
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [rules, setRules] = useState<GovernanceRule[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [selectedRuleForSimulation, setSelectedRuleForSimulation] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRuleCreator, setShowRuleCreator] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (restaurantId) {
      loadData();
    }
  }, [restaurantId]);

  const loadData = async () => {
    if (!restaurantId) return;

    setLoading(true);
    try {
      // Load event types
      const eventsResponse = await fetch(
        `${CONFIG.API_BASE}/api/govern-manage/events/types?restaurant_id=${restaurantId}`
      );
      if (eventsResponse.ok) {
        const data = await eventsResponse.json();
        setEventTypes(data.event_types || []);
      }

      // Load rules
      const rulesResponse = await fetch(
        `${CONFIG.API_BASE}/api/govern-manage/rules?restaurant_id=${restaurantId}`
      );
      if (rulesResponse.ok) {
        const data = await rulesResponse.json();
        setRules(data.rules || []);
      }

      // Load feature flags
      const flagsResponse = await fetch(
        `${CONFIG.API_BASE}/api/govern-manage/feature-flags?restaurant_id=${restaurantId}`
      );
      if (flagsResponse.ok) {
        const data = await flagsResponse.json();
        setFeatureFlags(data.flags || []);
      }

      // Load patterns
      const patternsResponse = await fetch(
        `${CONFIG.API_BASE}/api/govern-manage/patterns?restaurant_id=${restaurantId}`
      );
      if (patternsResponse.ok) {
        const data = await patternsResponse.json();
        setPatterns(data.patterns || []);
      }

      // Load decisions
      const decisionsResponse = await fetch(
        `${CONFIG.API_BASE}/api/govern-manage/decisions?restaurant_id=${restaurantId}&limit=50`
      );
      if (decisionsResponse.ok) {
        const data = await decisionsResponse.json();
        setDecisions(data.decisions || []);
      }
    } catch (err) {
      console.error('Error loading GovernManage data:', err);
      error('Erro ao carregar dados de governança');
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE}/api/govern-manage/rules/${ruleId}/toggle`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !enabled }),
        }
      );

      if (response.ok) {
        success(`Regra ${!enabled ? 'ativada' : 'desativada'}`);
        loadData();
      } else {
        error('Erro ao alterar regra');
      }
    } catch (err) {
      error('Erro ao alterar regra');
    }
  };

  const toggleFeatureFlag = async (featureKey: string, enabled: boolean) => {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE}/api/govern-manage/feature-flags/${featureKey}?restaurant_id=${restaurantId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !enabled }),
        }
      );

      if (response.ok) {
        success(`Feature ${!enabled ? 'ativada' : 'desativada'}`);
        loadData();
      } else {
        error('Erro ao alterar feature');
      }
    } catch (err) {
      error('Erro ao alterar feature');
    }
  };

  const simulateRule = async (ruleId: string) => {
    if (!restaurantId) return;
    
    setSelectedRuleForSimulation(ruleId);
    setLoading(true);
    try {
      const response = await fetch(
        `${CONFIG.API_BASE}/api/govern-manage/rules/${ruleId}/simulate?restaurant_id=${restaurantId}&days=7`
      );
      if (response.ok) {
        const data = await response.json();
        setSimulationResult(data.simulation);
      } else {
        error('Erro ao simular regra');
      }
    } catch (err) {
      error('Erro ao simular regra');
    } finally {
      setLoading(false);
    }
  };

  const loadDecisionDetails = async (decisionId: string) => {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE}/api/govern-manage/decisions/${decisionId}`
      );
      if (response.ok) {
        const data = await response.json();
        setSelectedDecision(data.decision);
      }
    } catch (err) {
      error('Erro ao carregar detalhes da decisão');
    }
  };

  const generateDecisionSummary = (decision: Decision): string => {
    const parts: string[] = [];
    
    if (decision.dedupe_count && decision.dedupe_count > 1) {
      parts.push(`${decision.dedupe_count} eventos similares`);
    } else {
      parts.push(`Evento: ${decision.event_type}`);
    }
    
    if (decision.rule_name) {
      parts.push(`Regra: ${decision.rule_name}`);
    }
    
    if (decision.action_type === 'create_task') {
      parts.push(`Tarefa criada`);
    } else if (decision.action_type === 'notify_manager') {
      parts.push(`Notificação enviada`);
    } else {
      parts.push(`Ação: ${decision.action_type}`);
    }
    
    return parts.join(' → ');
  };

  const filteredDecisions = decisions.filter(d => {
    if (priorityFilter !== 'all' && d.event_priority !== priorityFilter) return false;
    if (eventTypeFilter !== 'all' && d.event_type !== eventTypeFilter) return false;
    return true;
  });

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Text size="2xl" weight="bold" color="primary" style={{ marginBottom: 8 }}>
            🧠 GovernManage
          </Text>
          <Text color="secondary">
            Sistema que governa os outros sistemas. Você governa seu restaurante.
          </Text>
        </div>
        <Button
          onClick={() => setShowRuleCreator(!showRuleCreator)}
          variant="primary"
        >
          {showRuleCreator ? 'Cancelar' : '+ Nova Regra'}
        </Button>
      </div>

      {/* Rule Creator (Simplified) */}
      {showRuleCreator && (
        <Card surface="layer1" padding="lg" style={{ marginBottom: 24 }}>
          <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
            Criar Nova Regra
          </Text>
          <Text color="secondary" style={{ marginBottom: 16 }}>
            Quando acontecer <strong>X</strong> → faça <strong>Y</strong>
          </Text>
          <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
            <Text size="sm" color="tertiary">
              🚧 Interface de criação de regras em desenvolvimento
            </Text>
            <Text size="xs" color="tertiary" style={{ marginTop: 8 }}>
              Por enquanto, use as regras padrão ou contate o suporte para criar regras customizadas.
            </Text>
          </div>
        </Card>
      )}

      {/* Rules */}
      <Card surface="layer1" padding="lg" style={{ marginBottom: 24 }}>
        <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
          Regras de Governança ({rules.length})
        </Text>
        {rules.length === 0 ? (
          <Text color="secondary">Nenhuma regra configurada</Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rules.map((rule) => (
              <div
                key={rule.id}
                style={{
                  padding: 16,
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 8,
                  borderLeft: `4px solid ${rule.enabled ? '#10b981' : '#6b7280'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Text weight="bold" size="sm" style={{ marginBottom: 4 }}>
                      {rule.rule_name}
                    </Text>
                    <Text size="xs" color="secondary" style={{ marginBottom: 8 }}>
                      Quando: {rule.trigger_events.join(', ')}
                    </Text>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Badge
                        label={rule.priority}
                        variant={rule.priority === 'P0' ? 'error' : rule.priority === 'P1' ? 'warning' : 'outline'}
                      />
                      <Text size="xs" color="tertiary">
                        {rule.actions_count} ação(ões)
                      </Text>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                    <Button
                      onClick={() => simulateRule(rule.id)}
                      variant="outline"
                      size="sm"
                    >
                      Simular
                    </Button>
                    <Button
                      onClick={() => toggleRule(rule.id, rule.enabled)}
                      variant={rule.enabled ? 'outline' : 'primary'}
                      size="sm"
                    >
                      {rule.enabled ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Event Types */}
        <Card surface="layer1" padding="lg">
          <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
            Tipos de Eventos ({eventTypes.length})
          </Text>
          {eventTypes.length === 0 ? (
            <Text color="secondary">Nenhum evento registrado</Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
              {eventTypes.slice(0, 10).map((eventType) => (
                <div
                  key={eventType.type}
                  style={{
                    padding: 12,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text size="sm" weight="medium">{eventType.type}</Text>
                  <Badge label={eventType.count.toString()} variant="outline" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Feature Flags */}
        <Card surface="layer1" padding="lg">
          <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
            Feature Flags ({featureFlags.length})
          </Text>
          {featureFlags.length === 0 ? (
            <Text color="secondary">Nenhuma feature flag configurada</Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {featureFlags.map((flag) => (
                <div
                  key={flag.feature_key}
                  style={{
                    padding: 12,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <Text size="sm" weight="medium">{flag.feature_key}</Text>
                    {flag.enabled_at && (
                      <Text size="xs" color="tertiary">
                        Ativada em {new Date(flag.enabled_at).toLocaleDateString('pt-BR')}
                      </Text>
                    )}
                  </div>
                  <Button
                    onClick={() => toggleFeatureFlag(flag.feature_key, flag.enabled)}
                    variant={flag.enabled ? 'outline' : 'primary'}
                    size="sm"
                  >
                    {flag.enabled ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Voice Operations */}
      <Card surface="layer1" padding="lg" style={{ marginBottom: 24 }}>
        <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
          🎙️ Voice Operations
        </Text>
        <VoiceOperationsSection restaurantId={restaurantId} />
      </Card>

      {/* Decision Timeline */}
      <Card surface="layer1" padding="lg" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text size="lg" weight="bold" color="primary">
            Histórico de Decisões ({filteredDecisions.length})
          </Text>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button
              onClick={async () => {
                if (!restaurantId) return;
                try {
                  const response = await fetch(
                    `${CONFIG.API_BASE}/api/govern-manage/decisions/export?restaurant_id=${restaurantId}&format=csv`
                  );
                  if (response.ok) {
                    const csv = await response.text();
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `governmanage-decisions-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    success('Export concluído');
                  } else {
                    error('Erro ao exportar');
                  }
                } catch (err) {
                  error('Erro ao exportar');
                }
              }}
              variant="outline"
              size="sm"
            >
              Exportar CSV
            </Button>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'inherit',
                fontSize: 14,
              }}
            >
              <option value="all">Todas prioridades</option>
              <option value="P0">P0 (Crítica)</option>
              <option value="P1">P1 (Alta)</option>
              <option value="P2">P2 (Média)</option>
              <option value="P3">P3 (Baixa)</option>
            </select>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'inherit',
                fontSize: 14,
              }}
            >
              <option value="all">Todos eventos</option>
              <option value="voice_reminder">Voice Reminder</option>
              <option value="voice_trigger">Voice Trigger</option>
              <option value="voice_acknowledged">Voice Acknowledged</option>
              <option value="voice_ack_timeout">Voice Ack Timeout</option>
              {Array.from(new Set(decisions.map(d => d.event_type).filter(t => !t.startsWith('voice_')))).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
        {filteredDecisions.length === 0 ? (
          <Text color="secondary">Nenhuma decisão registrada</Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 600, overflowY: 'auto' }}>
            {filteredDecisions.map((decision) => (
              <div
                key={decision.id}
                onClick={() => loadDecisionDetails(decision.id)}
                style={{
                  padding: 16,
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 8,
                  borderLeft: `4px solid ${
                    decision.event_priority === 'P0' ? '#ef4444' :
                    decision.event_priority === 'P1' ? '#f59e0b' :
                    decision.event_priority === 'P2' ? '#3b82f6' : '#6b7280'
                  }`,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Text weight="bold" size="sm" style={{ marginBottom: 4 }}>
                      {generateDecisionSummary(decision)}
                    </Text>
                    <Text size="xs" color="secondary">
                      {new Date(decision.created_at).toLocaleString('pt-BR')}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Badge
                      label={decision.event_priority}
                      variant={
                        decision.event_priority === 'P0' ? 'error' :
                        decision.event_priority === 'P1' ? 'warning' :
                        'outline'
                      }
                    />
                    {decision.task_id && (
                      <Badge label="Tarefa" variant="outline" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Patterns */}
      {patterns.length > 0 && (
        <Card surface="layer1" padding="lg" style={{ marginBottom: 24 }}>
          <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
            Padrões Detectados ({patterns.length})
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {patterns.slice(0, 5).map((pattern) => (
              <div
                key={pattern.id}
                style={{
                  padding: 16,
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div>
                    <Text weight="bold" size="sm">{pattern.pattern_key}</Text>
                    <Text size="xs" color="secondary" style={{ marginTop: 4 }}>
                      Tipo: {pattern.pattern_type} • {pattern.occurrence_count} ocorrência(s)
                    </Text>
                  </div>
                  <Badge
                    label={`${(pattern.confidence * 100).toFixed(0)}%`}
                    variant={pattern.confidence > 0.7 ? 'success' : 'outline'}
                  />
                </div>
                <Text size="xs" color="tertiary">
                  Última vez: {new Date(pattern.last_seen_at).toLocaleString('pt-BR')}
                </Text>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Decision Details Drawer */}
      {selectedDecision && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setSelectedDecision(null)}
        >
          <Card
            surface="layer1"
            padding="lg"
            style={{
              maxWidth: 600,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text size="lg" weight="bold" color="primary">
                Detalhes da Decisão
              </Text>
              <Button onClick={() => setSelectedDecision(null)} variant="outline" size="sm">
                Fechar
              </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <Text size="sm" weight="bold" color="secondary" style={{ marginBottom: 4 }}>
                  Resumo
                </Text>
                <Text size="sm">{generateDecisionSummary(selectedDecision as any)}</Text>
              </div>
              <div>
                <Text size="sm" weight="bold" color="secondary" style={{ marginBottom: 4 }}>
                  Evento
                </Text>
                <Text size="sm">{selectedDecision.event_type}</Text>
              </div>
              <div>
                <Text size="sm" weight="bold" color="secondary" style={{ marginBottom: 4 }}>
                  Ação
                </Text>
                <Text size="sm">{selectedDecision.action_type}</Text>
              </div>
              <div>
                <Text size="sm" weight="bold" color="secondary" style={{ marginBottom: 4 }}>
                  Status
                </Text>
                <Badge
                  label={selectedDecision.status}
                  variant={selectedDecision.status === 'executed' ? 'success' : 'outline'}
                />
              </div>
              <div>
                <Text size="sm" weight="bold" color="secondary" style={{ marginBottom: 4 }}>
                  Data
                </Text>
                <Text size="sm">{new Date(selectedDecision.created_at).toLocaleString('pt-BR')}</Text>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Simulation Result Modal */}
      {simulationResult && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => {
            setSimulationResult(null);
            setSelectedRuleForSimulation(null);
          }}
        >
          <Card
            surface="layer1"
            padding="lg"
            style={{
              maxWidth: 700,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text size="lg" weight="bold" color="primary">
                Simulação: {simulationResult.rule_name}
              </Text>
              <Button
                onClick={() => {
                  setSimulationResult(null);
                  setSelectedRuleForSimulation(null);
                }}
                variant="outline"
                size="sm"
              >
                Fechar
              </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <Text size="sm" weight="bold" color="secondary" style={{ marginBottom: 8 }}>
                  Período: Últimos {simulationResult.simulation_period_days} dias
                </Text>
                <Text size="sm" color="secondary">
                  Eventos correspondentes: {simulationResult.total_events_matched}
                </Text>
                <Text size="sm" color="secondary">
                  Ações geradas: {simulationResult.total_actions_generated}
                </Text>
              </div>
              <div>
                <Text size="sm" weight="bold" color="secondary" style={{ marginBottom: 8 }}>
                  Impacto Estimado
                </Text>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <Text size="xs" color="tertiary">Tarefas criadas</Text>
                    <Text size="lg" weight="bold">{simulationResult.tasks_created}</Text>
                  </div>
                  <div>
                    <Text size="xs" color="tertiary">Tarefas prioritárias (P0/P1)</Text>
                    <Text size="lg" weight="bold">{simulationResult.estimated_impact.high_priority_tasks}</Text>
                  </div>
                  <div>
                    <Text size="xs" color="tertiary">Notificações</Text>
                    <Text size="lg" weight="bold">{simulationResult.estimated_impact.notifications}</Text>
                  </div>
                  <div>
                    <Text size="xs" color="tertiary">Escalações</Text>
                    <Text size="lg" weight="bold">{simulationResult.escalations}</Text>
                  </div>
                </div>
              </div>
              <div>
                <Text size="sm" weight="bold" color="secondary" style={{ marginBottom: 8 }}>
                  Roles Afetados
                </Text>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {simulationResult.affected_roles.map(role => (
                    <Badge key={role} label={role} variant="outline" />
                  ))}
                </div>
              </div>
              {selectedRuleForSimulation && (
                <Button
                  onClick={async () => {
                    await toggleRule(selectedRuleForSimulation, false);
                    setSimulationResult(null);
                    setSelectedRuleForSimulation(null);
                  }}
                  variant="primary"
                  fullWidth
                >
                  Ativar Regra
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

