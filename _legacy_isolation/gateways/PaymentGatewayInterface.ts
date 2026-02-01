/**
 * Gateway Abstraction Layer
 * 
 * PRINCÍPIO: AGNÓSTICO E IMUTÁVEL
 * 
 * O Core não sabe quem é Stripe ou SumUp.
 * Ele só recebe PAYMENT_CONFIRMED.
 * 
 * O dinheiro do cliente vai DIRETO para a conta do restaurante.
 * ChefI não toca, não processa, não repassa.
 */

import { GatewayType } from '../billing-core/types';

// ============================================================================
// GATEWAY INTERFACE (IMUTÁVEL - NÃO ALTERE APÓS V1)
// ============================================================================

/**
 * Payment Intent - Intenção de pagamento criada
 */
export interface GatewayIntent {
    readonly intent_id: string;           // Gateway's ID (pi_xxx for Stripe)
    readonly gateway: GatewayType;
    readonly amount_cents: number;
    readonly currency: string;
    readonly status: 'CREATED' | 'REQUIRES_ACTION' | 'PROCESSING';
    readonly client_secret?: string;       // For client-side confirmation
    readonly created_at: Date;
    readonly expires_at?: Date;
    readonly metadata: Record<string, string>;
}

/**
 * Payment Result - Resultado do pagamento
 */
export interface GatewayResult {
    readonly success: boolean;
    readonly intent_id: string;
    readonly gateway: GatewayType;
    readonly status: 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REQUIRES_ACTION';
    readonly amount_cents: number;
    readonly currency: string;
    readonly fee_cents?: number;           // Gateway fee (if available)
    readonly net_cents?: number;           // Amount after fees
    readonly failure_code?: string;
    readonly failure_message?: string;
    readonly processed_at: Date;
    readonly gateway_reference: string;    // charge_xxx, transaction_xxx
    readonly receipt_url?: string;
}

/**
 * Verified Webhook Event - Evento de webhook verificado criptograficamente
 */
export interface VerifiedWebhookEvent {
    readonly event_id: string;             // evt_xxx
    readonly gateway: GatewayType;
    readonly type: WebhookEventType;
    readonly intent_id?: string;
    readonly amount_cents?: number;
    readonly currency?: string;
    readonly status: string;
    readonly occurred_at: Date;
    readonly raw_payload: string;          // Para auditoria
    readonly signature_verified: boolean;
}

export type WebhookEventType =
    | 'payment_intent.created'
    | 'payment_intent.succeeded'
    | 'payment_intent.payment_failed'
    | 'payment_intent.canceled'
    | 'charge.succeeded'
    | 'charge.failed'
    | 'charge.refunded'
    | 'refund.created'
    | 'refund.succeeded'
    | 'refund.failed'
    // SumUp specific
    | 'checkout.completed'
    | 'checkout.failed'
    | 'transaction.completed'
    | 'transaction.failed';

// ============================================================================
// MAIN INTERFACE (CONTRATO IMUTÁVEL)
// ============================================================================

/**
 * PaymentGateway Interface
 * 
 * REGRAS DE IMPLEMENTAÇÃO:
 * 1. NUNCA armazene API keys em plain text
 * 2. SEMPRE valide assinatura de webhook antes de processar
 * 3. SEMPRE use raw payload para verificação (não JSON.parse)
 * 4. NUNCA confie em dados do webhook sem verificação
 */
export interface PaymentGateway {
    /**
     * Identificador do gateway
     */
    readonly gateway: GatewayType;
    
    /**
     * Cria uma intenção de pagamento
     * 
     * @param input Dados do pagamento
     * @returns Intent criada no gateway
     * @throws GatewayError se falhar
     */
    createPaymentIntent(input: CreateIntentInput): Promise<GatewayIntent>;
    
    /**
     * Confirma um pagamento (server-side)
     * 
     * @param input Dados de confirmação
     * @returns Resultado do pagamento
     * @throws GatewayError se falhar
     */
    confirmPayment(input: ConfirmPaymentInput): Promise<GatewayResult>;
    
    /**
     * Cancela um payment intent
     * 
     * @param intentId ID do intent
     * @returns Resultado do cancelamento
     */
    cancelPayment(intentId: string): Promise<GatewayResult>;
    
    /**
     * Verifica assinatura de webhook e extrai evento
     * 
     * CRITICAL: Payload DEVE ser string raw ou Buffer
     * NUNCA passe objeto parseado
     * 
     * @param rawPayload Payload raw do webhook (string ou Buffer)
     * @param headers Headers HTTP do request
     * @returns Evento verificado ou null se inválido
     */
    verifyWebhook(
        rawPayload: string | Buffer,
        headers: Record<string, string | string[] | undefined>
    ): Promise<VerifiedWebhookEvent | null>;
    
    /**
     * Consulta status de um pagamento
     * 
     * @param intentId ID do intent
     * @returns Resultado atual
     */
    getPaymentStatus(intentId: string): Promise<GatewayResult>;
    
    /**
     * Cria um reembolso
     * 
     * @param input Dados do reembolso
     * @returns Resultado do reembolso
     */
    createRefund(input: CreateRefundInput): Promise<RefundResult>;
    
    /**
     * Verifica se o gateway está configurado e operacional
     */
    healthCheck(): Promise<GatewayHealthStatus>;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateIntentInput {
    readonly amount_cents: number;
    readonly currency: string;
    readonly order_id: string;
    readonly restaurant_id: string;
    readonly description?: string;
    readonly customer_email?: string;
    readonly metadata?: Record<string, string>;
    readonly idempotency_key?: string;
    
    // Para terminais físicos
    readonly terminal_id?: string;
    readonly capture_method?: 'AUTOMATIC' | 'MANUAL';
}

export interface ConfirmPaymentInput {
    readonly intent_id: string;
    readonly payment_method_id?: string;
    readonly return_url?: string;
}

export interface CreateRefundInput {
    readonly intent_id: string;
    readonly amount_cents?: number;  // Partial refund, or full if not specified
    readonly reason?: 'DUPLICATE' | 'FRAUDULENT' | 'REQUESTED_BY_CUSTOMER';
    readonly idempotency_key?: string;
}

export interface RefundResult {
    readonly success: boolean;
    readonly refund_id: string;
    readonly intent_id: string;
    readonly amount_cents: number;
    readonly status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
    readonly failure_reason?: string;
    readonly created_at: Date;
}

export interface GatewayHealthStatus {
    readonly gateway: GatewayType;
    readonly healthy: boolean;
    readonly latency_ms: number;
    readonly last_check: Date;
    readonly error_message?: string;
}

// ============================================================================
// ERRORS
// ============================================================================

export class GatewayError extends Error {
    constructor(
        public readonly gateway: GatewayType,
        public readonly code: GatewayErrorCode,
        message: string,
        public readonly originalError?: Error
    ) {
        super(message);
        this.name = 'GatewayError';
    }
}

export type GatewayErrorCode =
    | 'AUTHENTICATION_FAILED'      // API key inválida
    | 'INVALID_REQUEST'            // Request malformado
    | 'CARD_DECLINED'              // Cartão recusado
    | 'INSUFFICIENT_FUNDS'         // Saldo insuficiente
    | 'EXPIRED_CARD'               // Cartão expirado
    | 'PROCESSING_ERROR'           // Erro no gateway
    | 'RATE_LIMIT'                 // Rate limit atingido
    | 'NETWORK_ERROR'              // Erro de rede
    | 'WEBHOOK_SIGNATURE_INVALID'  // Assinatura inválida
    | 'INTENT_NOT_FOUND'           // Intent não encontrado
    | 'ALREADY_REFUNDED'           // Já reembolsado
    | 'REFUND_FAILED'              // Reembolso falhou
    | 'UNKNOWN';                   // Erro desconhecido

// ============================================================================
// GATEWAY REGISTRY
// ============================================================================

/**
 * Registry de gateways por restaurante
 * 
 * Cada restaurante tem seus próprios gateways configurados
 * com suas próprias API keys
 */
export interface GatewayRegistry {
    /**
     * Obtém gateway configurado para o restaurante
     */
    getGateway(restaurantId: string, gateway: GatewayType): Promise<PaymentGateway | null>;
    
    /**
     * Lista gateways disponíveis para o restaurante
     */
    listGateways(restaurantId: string): Promise<GatewayType[]>;
    
    /**
     * Registra um novo gateway para o restaurante
     */
    registerGateway(
        restaurantId: string,
        gateway: GatewayType,
        credentials: GatewayCredentials
    ): Promise<void>;
    
    /**
     * Remove gateway do restaurante
     */
    removeGateway(restaurantId: string, gateway: GatewayType): Promise<void>;
}

export interface GatewayCredentials {
    readonly api_key: string;          // Will be encrypted
    readonly webhook_secret?: string;   // Will be encrypted
    readonly merchant_id?: string;      // For SumUp
    readonly account_id?: string;       // For Stripe
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Factory para criar instâncias de PaymentGateway
 */
export interface PaymentGatewayFactory {
    create(
        gateway: GatewayType,
        credentials: GatewayCredentials
    ): PaymentGateway;
}
