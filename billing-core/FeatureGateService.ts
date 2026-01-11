/**
 * Feature Gate Service
 * 
 * Controla o acesso a funcionalidades baseado em:
 * 1. Plano do merchant (tier)
 * 2. Add-ons ativos
 * 3. Status da subscription
 * 
 * PRINCÍPIO: Se não paga, não usa.
 */

import { 
  FeatureFlag, 
  PlanTier, 
  SubscriptionStatus, 
  AddOnType 
} from './types';

// ============================================================================
// FEATURE DEFINITIONS BY PLAN
// ============================================================================

/**
 * Features incluídas em cada tier
 */
export const TIER_FEATURES: Record<PlanTier, FeatureFlag[]> = {
  STARTER: [
    'CORE_POS',
    'CORE_ORDERS',
    'CORE_TABLES',
    'CORE_PAYMENTS',
    'CORE_AUDIT',
    'GATEWAY_STRIPE',
    'GATEWAY_SUMUP',
    'GATEWAY_CASH',
  ],
  PROFESSIONAL: [
    // All Starter features
    'CORE_POS',
    'CORE_ORDERS',
    'CORE_TABLES',
    'CORE_PAYMENTS',
    'CORE_AUDIT',
    'GATEWAY_STRIPE',
    'GATEWAY_SUMUP',
    'GATEWAY_CASH',
    // Plus
    'API_ACCESS',
  ],
  ENTERPRISE: [
    // All Professional features
    'CORE_POS',
    'CORE_ORDERS',
    'CORE_TABLES',
    'CORE_PAYMENTS',
    'CORE_AUDIT',
    'GATEWAY_STRIPE',
    'GATEWAY_SUMUP',
    'GATEWAY_CASH',
    'API_ACCESS',
    // Plus
    'RESERVATIONS',
    'WEB_PAGE',
    'FISCAL_ADVANCED',
    'ANALYTICS_PRO',
  ],
};

/**
 * Features desbloqueadas por add-on
 */
export const ADDON_FEATURES: Record<AddOnType, FeatureFlag[]> = {
  RESERVATIONS: ['RESERVATIONS'],
  WEB_PAGE: ['WEB_PAGE'],
  WEB_EXPERIENCE: [],
  MULTI_LOCATION: ['MULTI_LOCATION'],
  WHITE_LABEL: ['WHITE_LABEL'],
  EXTRA_TERMINAL: [], // Não desbloqueia feature, aumenta limite
  FISCAL_ADVANCED: ['FISCAL_ADVANCED'],
  ANALYTICS_PRO: ['ANALYTICS_PRO'],
};

/**
 * Status que permitem acesso às features
 */
export const ALLOWED_STATUSES: SubscriptionStatus[] = [
  'TRIAL',
  'ACTIVE',
  'PAST_DUE', // Grace period - ainda tem acesso
];

// ============================================================================
// FEATURE GATE SERVICE
// ============================================================================

export interface SubscriptionContext {
  status: SubscriptionStatus;
  tier: PlanTier;
  addons: AddOnType[];
}

export type WebPageLevel = 'BASIC' | 'PRO' | 'EXPERIENCE';

export class FeatureGateService {
  
  /**
   * Verifica se uma feature está disponível para o contexto atual
   */
  static hasFeature(
    context: SubscriptionContext,
    feature: FeatureFlag
  ): boolean {
    // 1. Status check - bloqueia se SUSPENDED ou CANCELLED
    if (!ALLOWED_STATUSES.includes(context.status)) {
      return false;
    }
    
    // 2. Tier check - feature vem do plano?
    const tierFeatures = TIER_FEATURES[context.tier] || [];
    if (tierFeatures.includes(feature)) {
      return true;
    }
    
    // 3. Add-on check - feature vem de add-on?
    for (const addon of context.addons) {
      const addonFeatures = ADDON_FEATURES[addon] || [];
      if (addonFeatures.includes(feature)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Retorna todas as features disponíveis para o contexto
   */
  static getAvailableFeatures(context: SubscriptionContext): FeatureFlag[] {
    if (!ALLOWED_STATUSES.includes(context.status)) {
      return []; // Bloqueado
    }
    
    const features = new Set<FeatureFlag>();
    
    // Features do tier
    const tierFeatures = TIER_FEATURES[context.tier] || [];
    tierFeatures.forEach(f => features.add(f));
    
    // Features dos add-ons
    for (const addon of context.addons) {
      const addonFeatures = ADDON_FEATURES[addon] || [];
      addonFeatures.forEach(f => features.add(f));
    }
    
    return Array.from(features);
  }
  
  /**
   * Verifica se o merchant pode usar um gateway específico
   */
  static canUseGateway(
    context: SubscriptionContext,
    gateway: 'STRIPE' | 'SUMUP' | 'CASH' | 'MULTIBANCO'
  ): boolean {
    const feature = `GATEWAY_${gateway}` as FeatureFlag;
    return this.hasFeature(context, feature);
  }

  /**
   * Guard para níveis internos da Web Page (não são add-ons separados).
   * Regra comercial final:
   * - STARTER: sem Web Page (mesmo que tenha add-on WEB_PAGE).
   * - PROFESSIONAL: máximo BASIC.
   * - ENTERPRISE: máximo PRO.
   * - EXPERIENCE: requer premium add-on WEB_EXPERIENCE (e tier ENTERPRISE).
   */
  static canUseWebPageLevel(context: SubscriptionContext, level: WebPageLevel): boolean {
    // Explicit WEB_PAGE dependency
    if (!this.hasFeature(context, 'WEB_PAGE')) return false;

    // Starter is blocked from Web Page entirely
    if (context.tier === 'STARTER') return false;

    // Premium dependency for EXPERIENCE
    if (level === 'EXPERIENCE' && !context.addons.includes('WEB_EXPERIENCE')) return false;

    switch (level) {
      case 'BASIC':
        return context.tier === 'PROFESSIONAL' || context.tier === 'ENTERPRISE';
      case 'PRO':
        return context.tier === 'ENTERPRISE';
      case 'EXPERIENCE':
        return context.tier === 'ENTERPRISE';
      default:
        return false;
    }
  }
  
  /**
   * Retorna mensagem de erro apropriada para feature bloqueada
   */
  static getBlockedMessage(
    context: SubscriptionContext,
    feature: FeatureFlag
  ): string {
    // Status bloqueado
    if (context.status === 'SUSPENDED') {
      return 'Sua assinatura está suspensa. Por favor, atualize seu método de pagamento.';
    }
    
    if (context.status === 'CANCELLED') {
      return 'Sua assinatura foi cancelada. Reative para continuar usando o ChefIApp.';
    }
    
    // Feature não incluída no plano
    const tierFeatures = TIER_FEATURES[context.tier] || [];
    if (!tierFeatures.includes(feature)) {
      // Verificar se é um add-on disponível
      for (const [addon, features] of Object.entries(ADDON_FEATURES)) {
        if (features.includes(feature)) {
          return `Esta funcionalidade requer o add-on "${addon}". Faça upgrade nas configurações.`;
        }
      }
      
      // Verificar qual tier tem a feature
      for (const [tier, features] of Object.entries(TIER_FEATURES)) {
        if (features.includes(feature)) {
          return `Esta funcionalidade está disponível no plano ${tier}. Faça upgrade para acessar.`;
        }
      }
    }
    
    return 'Funcionalidade não disponível no seu plano atual.';
  }
}

// ============================================================================
// DECORATOR / GUARD HELPERS
// ============================================================================

/**
 * Guard decorator para rotas/handlers
 * 
 * Usage:
 * @requireFeature('RESERVATIONS')
 * async function handleReservation(req, res) { ... }
 */
export function requireFeature(feature: FeatureFlag) {
  return function <T extends (...args: any[]) => Promise<any>>(
    handler: T
  ): T {
    return (async function(...args: any[]) {
      // Assume primeiro argumento tem subscription context
      const context = args[0]?.subscriptionContext as SubscriptionContext | undefined;
      
      if (!context) {
        throw new Error('SubscriptionContext required for feature-gated operation');
      }
      
      if (!FeatureGateService.hasFeature(context, feature)) {
        const message = FeatureGateService.getBlockedMessage(context, feature);
        throw new FeatureBlockedError(feature, message);
      }
      
      return handler(...args);
    }) as T;
  };
}

/**
 * Erro específico para feature bloqueada
 */
export class FeatureBlockedError extends Error {
  constructor(
    public readonly feature: FeatureFlag,
    message: string
  ) {
    super(message);
    this.name = 'FeatureBlockedError';
  }
}

// ============================================================================
// MIDDLEWARE (Express-style)
// ============================================================================

/**
 * Middleware Express para verificar feature
 * 
 * Usage:
 * app.post('/api/reservations', featureGuard('RESERVATIONS'), reservationHandler);
 */
export function featureGuard(feature: FeatureFlag) {
  return (req: any, res: any, next: any) => {
    const context = req.subscriptionContext as SubscriptionContext | undefined;
    
    if (!context) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Subscription context not found',
      });
    }
    
    if (!FeatureGateService.hasFeature(context, feature)) {
      const message = FeatureGateService.getBlockedMessage(context, feature);
      return res.status(403).json({
        error: 'FEATURE_BLOCKED',
        feature,
        message,
        upgrade_url: '/settings/subscription',
      });
    }
    
    next();
  };
}

/**
 * Middleware para carregar subscription context do merchant
 * 
 * Usage:
 * app.use(loadSubscriptionContext);
 */
export function loadSubscriptionContext(
  getSubscription: (merchantId: string) => Promise<SubscriptionContext | null>
) {
  return async (req: any, res: any, next: any) => {
    const merchantId = req.headers['x-merchant-id'] || req.query.merchant_id;
    
    if (!merchantId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Merchant ID required',
      });
    }
    
    try {
      const context = await getSubscription(merchantId);
      
      if (!context) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Subscription not found',
        });
      }
      
      req.subscriptionContext = context;
      next();
    } catch (error) {
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to load subscription',
      });
    }
  };
}

