/**
 * TaskWhyBadge.tsx — Badge "Por Quê?" para Tasks
 * 
 * Mostra origem da task (regra, evento, voz, etc.)
 */
// @ts-nocheck


import React, { useState, useEffect } from 'react';
import { Badge } from '../../../ui/design-system/Badge';
import { Text } from '../../../ui/design-system/primitives/Text';
import { Card } from '../../../ui/design-system/Card';
import { CONFIG } from '../../../config';

interface TaskWhyInfo {
  task_id: string;
  decision_id?: string;
  event_id?: string;
  event_type?: string;
  event_priority?: string;
  rule_id?: string;
  rule_name?: string;
  decision_summary?: string;
  created_at?: string;
}

interface TaskWhyBadgeProps {
  taskId: string;
  taskMeta?: {
    event_id?: string;
    source?: string;
    [key: string]: any;
  };
  compact?: boolean;
}

export function TaskWhyBadge({ taskId, taskMeta, compact = false }: TaskWhyBadgeProps) {
  const [whyInfo, setWhyInfo] = useState<TaskWhyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Se já tem info no meta, usa direto
    if (taskMeta?.event_id) {
      setWhyInfo({
        task_id: taskId,
        event_id: taskMeta.event_id,
        event_type: taskMeta.source || 'system',
        decision_summary: getSummaryFromMeta(taskMeta),
      });
      return;
    }

    // Senão, busca do servidor
    loadWhyInfo();
  }, [taskId, taskMeta]);

  const loadWhyInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/govern-manage/tasks/${taskId}/why`);
      if (response.ok) {
        const data = await response.json();
        setWhyInfo(data);
      }
    } catch (err) {
      console.error('Error loading task why info:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSummaryFromMeta = (meta: any): string => {
    if (meta.source === 'voice_operations' || meta.event_type?.startsWith('voice_')) {
      return 'Criada por rotina de voz';
    }
    if (meta.rule_name) {
      return `Criada por regra "${meta.rule_name}"`;
    }
    if (meta.event_type) {
      return `Criada após evento ${meta.event_type}`;
    }
    return 'Criada pelo sistema';
  };

  if (!whyInfo && !loading) {
    return null;
  }

  if (loading) {
    return (
      <Badge
        label="Carregando..."
        variant="neutral"
      />
    );
  }

  const getBadgeVariant = (): 'info' | 'warning' | 'success' | 'neutral' => {
    if (whyInfo?.event_type?.startsWith('voice_')) {
      return 'info';
    }
    if (whyInfo?.event_priority === 'P0' || whyInfo?.event_priority === 'P1') {
      return 'warning';
    }
    return 'neutral';
  };

  const getIcon = (): string => {
    if (whyInfo?.event_type?.startsWith('voice_')) {
      return '🎙️';
    }
    if (whyInfo?.rule_name) {
      return '⚙️';
    }
    return '🔗';
  };

  if (compact) {
    return (
      <div
        onClick={() => setShowDetails(!showDetails)}
        style={{ cursor: 'pointer', display: 'inline-block' }}
      >
        <Badge
          label={`${getIcon()} Por quê?`}
          variant={getBadgeVariant()}
          icon={getIcon()}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setShowDetails(!showDetails)}
      >
        <Badge
          label="Por quê?"
          variant={getBadgeVariant()}
          icon={getIcon()}
        />
        <Text size="xs" color="tertiary" style={{ flex: 1 }}>
          {whyInfo?.decision_summary || 'Ver origem'}
        </Text>
      </div>

      {showDetails && whyInfo && (
        <Card surface="layer2" padding="sm" style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {whyInfo.rule_name && (
              <div>
                <Text size="xs" weight="bold" color="primary">Regra:</Text>
                <Text size="xs" color="secondary">{whyInfo.rule_name}</Text>
              </div>
            )}
            {whyInfo.event_type && (
              <div>
                <Text size="xs" weight="bold" color="primary">Evento:</Text>
                <Text size="xs" color="secondary">{whyInfo.event_type}</Text>
              </div>
            )}
            {whyInfo.event_priority && (
              <div>
                <Text size="xs" weight="bold" color="primary">Prioridade:</Text>
                <Text size="xs" color="secondary">{whyInfo.event_priority}</Text>
              </div>
            )}
            {whyInfo.decision_id && (
              <div>
                <Text size="xs" color="tertiary">
                  <a
                    href={`/app/govern-manage?decision=${whyInfo.decision_id}`}
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    Ver decisão completa →
                  </a>
                </Text>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

