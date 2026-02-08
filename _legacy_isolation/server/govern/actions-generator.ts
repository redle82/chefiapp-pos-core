/**
 * actions-generator.ts — Generate Actionable Recommendations
 * 
 * Generates actionable recommendations from insights and creates AppStaff tasks.
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface ActionRecommendation {
  actionTitle: string;
  actionDescription: string;
  roleTarget: 'owner' | 'manager' | 'waiter' | 'kitchen' | 'all';
  priority: 'critical' | 'high' | 'medium' | 'low';
  topic?: string;
  reasonText: string;
  howToFix: string;
}

/**
 * Generate actions from insights
 */
export async function generateActionsFromInsights(
  restaurantId: string,
  insightId: string
): Promise<number> {
  // Get latest insight
  const insightResult = await pool.query(
    `SELECT churn_reasons_json, topic_sentiment_json, alerts_json, overall_rating
     FROM govern_review_insights
     WHERE id = $1`,
    [insightId]
  );

  if (insightResult.rows.length === 0) {
    return 0;
  }

  const insight = insightResult.rows[0];
  const churnReasons = insight.churn_reasons_json || [];
  const topicSentimentRaw = insight.topic_sentiment_json || {};
  const alerts = insight.alerts_json || [];
  const overallRating = parseFloat(insight.overall_rating || '0');

  const actions: ActionRecommendation[] = [];

  // Generate actions from churn reasons
  for (const reason of churnReasons.slice(0, 5)) {
    const action = generateActionForTopic(reason.topic, reason.sentiment, reason.count);
    if (action) {
      actions.push(action);
    }
  }

  // Generate actions from alerts
  for (const alert of alerts) {
    if (alert.type === 'rating_drop' || alert.type === 'low_rating') {
      actions.push({
        actionTitle: 'Revisar experiência geral do cliente',
        actionDescription: 'Avaliação média está abaixo do esperado. Revisar processos operacionais.',
        roleTarget: 'owner',
        priority: alert.severity === 'critical' ? 'critical' : 'high',
        reasonText: `Avaliação média: ${overallRating.toFixed(1)}/5.0`,
        howToFix: 'Analisar reviews recentes e identificar padrões de insatisfação. Implementar melhorias nos pontos mais críticos.',
      });
    }
  }

  // Generate actions from negative topic trends
  for (const [topic, sentimentValue] of Object.entries(topicSentimentRaw as Record<string, unknown>)) {
    const sentiment = typeof sentimentValue === 'number' ? sentimentValue : Number(sentimentValue);
    if (!Number.isFinite(sentiment)) {
      continue;
    }
    if (sentiment < -0.3) {
      const action = generateActionForTopic(topic, sentiment, 0);
      if (action) {
        // Check if similar action already exists
        const existing = actions.find(a => a.topic === topic);
        if (!existing) {
          actions.push(action);
        }
      }
    }
  }

  // Store actions
  let created = 0;
  for (const action of actions) {
    try {
      // Check if similar action already exists (pending)
      const existing = await pool.query(
        `SELECT id FROM govern_review_actions
         WHERE restaurant_id = $1
           AND action_title = $2
           AND status = 'pending'`,
        [restaurantId, action.actionTitle]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO govern_review_actions
           (restaurant_id, insight_id, action_title, action_description, role_target,
            priority, topic, reason_text, how_to_fix, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')`,
          [
            restaurantId,
            insightId,
            action.actionTitle,
            action.actionDescription,
            action.roleTarget,
            action.priority,
            action.topic || null,
            action.reasonText,
            action.howToFix,
          ]
        );
        created++;
      }
    } catch (error: any) {
      console.error('Error creating action:', error);
    }
  }

  return created;
}

/**
 * Generate action for a specific topic
 */
function generateActionForTopic(
  topic: string,
  sentiment: number,
  count: number
): ActionRecommendation | null {
  const topicActions: Record<string, {
    title: string;
    description: string;
    roleTarget: 'owner' | 'manager' | 'waiter' | 'kitchen' | 'all';
    howToFix: string;
  }> = {
    price: {
      title: 'Revisar precificação ou comunicar valor melhor',
      description: 'Clientes estão insatisfeitos com o preço. Revisar estratégia de precificação ou melhorar comunicação de valor.',
      roleTarget: 'owner',
      howToFix: 'Analisar preços da concorrência. Revisar custos e margens. Melhorar apresentação dos pratos e experiência para aumentar percepção de valor.',
    },
    cleanliness: {
      title: 'Reforçar protocolos de limpeza',
      description: 'Clientes mencionam problemas de limpeza. Revisar e reforçar protocolos.',
      roleTarget: 'manager',
      howToFix: 'Criar checklist de limpeza. Treinar equipe. Inspeções regulares. Definir responsabilidades por área.',
    },
    service: {
      title: 'Treinar equipe de atendimento',
      description: 'Atendimento precisa melhorar. Investir em treinamento.',
      roleTarget: 'waiter',
      howToFix: 'Treinar equipe em atendimento ao cliente. Definir padrões de comportamento. Feedback regular. Reconhecer bons exemplos.',
    },
    food: {
      title: 'Revisar qualidade dos pratos',
      description: 'Qualidade da comida precisa melhorar.',
      roleTarget: 'kitchen',
      howToFix: 'Revisar receitas e padrões. Treinar cozinha. Inspeções de qualidade. Feedback de clientes para cozinha.',
    },
    ambience: {
      title: 'Melhorar ambiente físico',
      description: 'Ambiente precisa melhorar.',
      roleTarget: 'owner',
      howToFix: 'Revisar iluminação, música, temperatura. Melhorar decoração. Criar ambiente mais aconchegante.',
    },
    wait_time: {
      title: 'Otimizar tempo de preparo e atendimento',
      description: 'Clientes reclamam de demora. Prioridade alta.',
      roleTarget: 'all',
      howToFix: 'Revisar fluxo da cozinha. Otimizar processos. Treinar equipe em velocidade. Considerar pré-preparação.',
    },
    value: {
      title: 'Melhorar custo-benefício percebido',
      description: 'Clientes não percebem valor adequado.',
      roleTarget: 'owner',
      howToFix: 'Aumentar porções ou qualidade. Melhorar apresentação. Comunicar melhor o valor oferecido.',
    },
  };

  const action = topicActions[topic];
  if (!action) {
    return null;
  }

  // Determine priority based on sentiment and count
  let priority: 'critical' | 'high' | 'medium' | 'low';
  if (sentiment < -0.7 || count >= 10) {
    priority = 'critical';
  } else if (sentiment < -0.5 || count >= 5) {
    priority = 'high';
  } else if (sentiment < -0.3 || count >= 3) {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  return {
    actionTitle: action.title,
    actionDescription: action.description,
    roleTarget: action.roleTarget,
    priority,
    topic,
    reasonText: count > 0
      ? `${count} reviews mencionam ${topic} negativamente (sentimento: ${(sentiment * 100).toFixed(0)}%)`
      : `Sentimento negativo sobre ${topic} (${(sentiment * 100).toFixed(0)}%)`,
    howToFix: action.howToFix,
  };
}

/**
 * Create AppStaff task from action
 */
export async function createAppStaffTaskFromAction(
  actionId: string
): Promise<string | null> {
  // Get action
  const actionResult = await pool.query(
    `SELECT restaurant_id, action_title, action_description, role_target, priority, topic
     FROM govern_review_actions
     WHERE id = $1`,
    [actionId]
  );

  if (actionResult.rows.length === 0) {
    return null;
  }

  const action = actionResult.rows[0];

  // TODO: Create AppStaff task via API or direct DB insert
  // For now, return null (will be implemented when AppStaff task system is ready)
  
  // Example structure:
  // const task = {
  //   restaurant_id: action.restaurant_id,
  //   type: 'govern_action',
  //   title: action.action_title,
  //   description: action.action_description,
  //   assignee_role: action.role_target,
  //   priority: action.priority,
  //   context: { action_id: actionId, topic: action.topic },
  // };
  
  return null;
}

