/**
 * analyze-sentiment.ts — Análise de Sentimento por Tema
 * Princípio: Medir sentimento explícito, implícito e perda por tema.
 */

export type Topic = 'service' | 'cleanliness' | 'price' | 'product' | 'ambiance' | 'wait_time';

export interface TopicAnalysis {
  topic: Topic;
  sentimentScore: number; // -100 to +100
  volume: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  topPhrases: string[]; // Anonymized
  whySummary: string;
}

export interface PriceSentiment {
  explicit: 'positive' | 'neutral' | 'negative' | 'not_mentioned';
  implicit: boolean; // Se menciona problemas que afetam percepção de valor
  competitive: boolean; // Se compara com concorrentes
  friction: boolean; // Se menciona problemas técnicos/operacionais
}

// Keywords por tema
const TOPIC_KEYWORDS: Record<Topic, { positive: string[]; negative: string[] }> = {
  service: {
    positive: ['atendimento excelente', 'muito atencioso', 'educado', 'prestativo', 'gentil', 'rápido', 'eficiente'],
    negative: ['atendimento ruim', 'mal educado', 'grosso', 'lento', 'desatento', 'ignorou', 'não ajudou'],
  },
  cleanliness: {
    positive: ['limpo', 'organizado', 'higiene', 'bem cuidado', 'arrumado'],
    negative: ['sujo', 'mal cuidado', 'desorganizado', 'higiene ruim', 'bagunça'],
  },
  price: {
    positive: ['preço justo', 'vale a pena', 'barato', 'custo-benefício', 'razoável'],
    negative: ['caro', 'muito caro', 'não vale', 'muito dinheiro', 'caro demais', 'preço alto'],
  },
  product: {
    positive: ['delicioso', 'saboroso', 'bom', 'ótimo', 'excelente', 'perfeito'],
    negative: ['ruim', 'sem sabor', 'frio', 'queimado', 'mal feito', 'sem qualidade'],
  },
  ambiance: {
    positive: ['ambiente agradável', 'aconchegante', 'bonito', 'confortável', 'atmosfera'],
    negative: ['barulhento', 'desconfortável', 'frio', 'sem ambiente', 'ruim'],
  },
  wait_time: {
    positive: ['rápido', 'sem espera', 'atendimento rápido'],
    negative: ['demora', 'lento', 'espera muito', 'atraso', 'demorou', 'muito tempo'],
  },
};

// Palavras que indicam sentimento implícito sobre preço (valor não percebido)
const IMPLICIT_PRICE_INDICATORS = [
  'complicado', 'confuso', 'difícil', 'não funciona', 'bug', 'erro',
  'suporte ruim', 'não resolveu', 'frustrante', 'decepcionante',
  'não valeu', 'esperava mais', 'não atendeu expectativa',
];

// Palavras que indicam comparação competitiva
const COMPETITIVE_INDICATORS = [
  'melhor que', 'pior que', 'comparado', 'outro lugar', 'concorrente',
  'outro restaurante', 'outros lugares',
];

// Palavras que indicam fricção (problemas técnicos/operacionais)
const FRICTION_INDICATORS = [
  'lento', 'travou', 'não carregou', 'erro', 'bug', 'problema técnico',
  'não funcionou', 'quebrou', 'falhou',
];

/**
 * Analisa sentimento de um texto por tema
 */
export function analyzeSentimentByTopic(text: string): Map<Topic, { score: number; mentions: number }> {
  const textLower = text.toLowerCase();
  const results = new Map<Topic, { score: number; mentions: number }>();

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let positiveMentions = 0;
    let negativeMentions = 0;

    // Contar keywords positivas
    for (const keyword of keywords.positive) {
      if (textLower.includes(keyword)) {
        positiveMentions++;
      }
    }

    // Contar keywords negativas
    for (const keyword of keywords.negative) {
      if (textLower.includes(keyword)) {
        negativeMentions++;
      }
    }

    const totalMentions = positiveMentions + negativeMentions;
    if (totalMentions > 0) {
      // Score: -100 (tudo negativo) a +100 (tudo positivo)
      const score = totalMentions > 0
        ? Math.round(((positiveMentions - negativeMentions) / totalMentions) * 100)
        : 0;
      results.set(topic as Topic, { score, mentions: totalMentions });
    }
  }

  return results;
}

/**
 * Analisa sentimento sobre preço (explícito + implícito)
 */
export function analyzePriceSentiment(text: string): PriceSentiment {
  const textLower = text.toLowerCase();

  // Sentimento explícito
  const explicitPositive = ['preço justo', 'vale a pena', 'barato', 'custo-benefício', 'razoável'].some(k => textLower.includes(k));
  const explicitNegative = ['caro', 'muito caro', 'não vale', 'muito dinheiro', 'caro demais', 'preço alto'].some(k => textLower.includes(k));
  
  let explicit: PriceSentiment['explicit'] = 'not_mentioned';
  if (explicitPositive) {
    explicit = 'positive';
  } else if (explicitNegative) {
    explicit = 'negative';
  } else if (textLower.includes('preço') || textLower.includes('valor')) {
    explicit = 'neutral';
  }

  // Sentimento implícito (valor não percebido)
  const implicit = IMPLICIT_PRICE_INDICATORS.some(indicator => textLower.includes(indicator));

  // Comparação competitiva
  const competitive = COMPETITIVE_INDICATORS.some(indicator => textLower.includes(indicator));

  // Fricção (problemas técnicos/operacionais)
  const friction = FRICTION_INDICATORS.some(indicator => textLower.includes(indicator));

  return {
    explicit,
    implicit,
    competitive,
    friction,
  };
}

/**
 * Extrai frases top por tema (anonymizadas)
 */
export function extractTopPhrases(text: string, topic: Topic, maxPhrases: number = 3): string[] {
  const textLower = text.toLowerCase();
  const keywords = [...TOPIC_KEYWORDS[topic].positive, ...TOPIC_KEYWORDS[topic].negative];
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const relevantSentences = sentences.filter(sentence => {
    const sentenceLower = sentence.toLowerCase();
    return keywords.some(keyword => sentenceLower.includes(keyword));
  });

  // Anonymizar nomes (substituir por [EQUIPE] ou [ATENDENTE])
  const anonymized = relevantSentences
    .slice(0, maxPhrases)
    .map(s => anonymizeText(s));

  return anonymized;
}

/**
 * Gera resumo "Por quê" baseado no sentimento
 */
export function generateWhySummary(
  topic: Topic,
  sentimentScore: number,
  volume: number
): string {
  const topicLabels: Record<Topic, string> = {
    service: 'atendimento',
    cleanliness: 'limpeza',
    price: 'preço',
    product: 'produto',
    ambiance: 'ambiente',
    wait_time: 'tempo de espera',
  };

  const topicLabel = topicLabels[topic];

  if (sentimentScore >= 50) {
    return `Clientes elogiam o ${topicLabel}. Mantenha o padrão.`;
  } else if (sentimentScore >= 0) {
    return `Clientes têm opiniões mistas sobre ${topicLabel}. Há espaço para melhoria.`;
  } else if (sentimentScore >= -50) {
    return `Clientes estão insatisfeitos com ${topicLabel}. Ação recomendada.`;
  } else {
    return `Críticas frequentes sobre ${topicLabel}. Prioridade alta.`;
  }
}

/**
 * Gera recomendações acionáveis por tema
 */
export function generateActionRecommendations(
  topic: Topic,
  sentimentScore: number,
  volume: number,
  priceSentiment?: PriceSentiment
): Array<{ action: string; reason: string; priority: 'high' | 'medium' | 'low' }> {
  const recommendations: Array<{ action: string; reason: string; priority: 'high' | 'medium' | 'low' }> = [];

  // Determinar prioridade baseada em score e volume
  const priority: 'high' | 'medium' | 'low' = 
    sentimentScore < -50 && volume >= 5 ? 'high' :
    sentimentScore < 0 && volume >= 3 ? 'medium' :
    'low';

  switch (topic) {
    case 'service':
      if (sentimentScore < 0) {
        recommendations.push({
          action: 'Treinar equipe em atendimento ao cliente',
          reason: `${volume} menções negativas sobre atendimento`,
          priority,
        });
      }
      break;

    case 'cleanliness':
      if (sentimentScore < 0) {
        recommendations.push({
          action: 'Reforçar protocolos de limpeza',
          reason: `${volume} menções sobre limpeza`,
          priority,
        });
      }
      break;

    case 'price':
      if (priceSentiment) {
        if (priceSentiment.explicit === 'negative') {
          recommendations.push({
            action: 'Revisar precificação ou comunicar valor melhor',
            reason: 'Clientes consideram caro',
            priority: 'high',
          });
        } else if (priceSentiment.implicit) {
          recommendations.push({
            action: 'Melhorar experiência para aumentar percepção de valor',
            reason: 'Problemas operacionais afetam percepção de preço',
            priority: 'high',
          });
        } else if (priceSentiment.friction) {
          recommendations.push({
            action: 'Resolver problemas técnicos/operacionais',
            reason: 'Fricções afetam percepção de valor',
            priority: 'high',
          });
        }
      }
      break;

    case 'product':
      if (sentimentScore < 0) {
        recommendations.push({
          action: 'Revisar qualidade dos pratos',
          reason: `${volume} menções negativas sobre comida`,
          priority,
        });
      }
      break;

    case 'ambiance':
      if (sentimentScore < 0) {
        recommendations.push({
          action: 'Melhorar ambiente físico',
          reason: `${volume} menções sobre ambiente`,
          priority,
        });
      }
      break;

    case 'wait_time':
      if (sentimentScore < 0) {
        recommendations.push({
          action: 'Otimizar tempo de preparo e atendimento',
          reason: `${volume} menções sobre demora`,
          priority: 'high', // Wait time é sempre alta prioridade
        });
      }
      break;
  }

  return recommendations;
}

/**
 * Anonymiza texto (remove nomes de funcionários)
 */
export function anonymizeText(text: string): string {
  // Padrões comuns de nomes próprios
  const namePatterns = [
    /\b([A-Z][a-z]+)\s+(?:atendeu|ajudou|serviu|garçom|garçonete|waiter|waitress)/gi,
    /\b(?:o|a|o|a)\s+([A-Z][a-z]+)\s+(?:foi|estava|está)/gi,
    /\b([A-Z][a-z]+)\s+(?:muito|bem|mal)/gi,
  ];

  let anonymized = text;

  for (const pattern of namePatterns) {
    anonymized = anonymized.replace(pattern, (match, name) => {
      // Verificar se é um nome comum (não uma palavra genérica)
      const commonNames = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Julia', 'Paulo', 'Fernanda'];
      if (commonNames.includes(name) || name.length >= 3) {
        return match.replace(name, '[EQUIPE]');
      }
      return match;
    });
  }

  return anonymized.trim();
}

