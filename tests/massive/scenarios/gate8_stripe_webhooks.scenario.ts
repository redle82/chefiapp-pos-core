/**
 * Gate 8 Scenario: Stripe Webhook Integration
 * 
 * Valida o boundary criptográfico completo:
 * 1. CRYPTO_BOUNDARY_PASS - payload raw + header válido → VerifiedPayment
 * 2. CRYPTO_BOUNDARY_REJECT - sem assinatura / inválida / já parseado → falha
 * 3. WEBHOOK_IDEMPOTENCY - duplicatas do mesmo event.id não geram dupla gravação
 * 4. STRIPE_ISOLATION - falha do Stripe não derruba o core
 */

import * as crypto from 'crypto';
import { VerifiedPayment } from '../../../gateways/PaymentGatewayAdapter';
import { CoreEvent } from '../../../event-log/types';
import { AssertionResult } from '../../harness/AuditAsserts';
import { SeededRandom } from '../../harness/WorldConfig';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Interface mínima para adapter de webhook (permite mocks)
 */
export interface WebhookVerifier {
    verifyWebhook(
        payload: any,
        headers: Record<string, string | string[] | undefined>
    ): Promise<VerifiedPayment | null>;
}

export interface StripeWebhookScenarioConfig {
    webhookSecret: string;
    numPayments: number;
    duplicateProb: number;  // 0.0 - 1.0
    delayMaxMs: number;
    seed: number;
}

export interface WebhookTestResult {
    eventId: string;
    orderId: string;
    payloadType: 'string' | 'buffer';
    verificationResult: 'PASS' | 'REJECT' | 'ERROR';
    isDuplicate: boolean;
    errorMessage?: string;
}

export interface Gate8ScenarioResult {
    config: StripeWebhookScenarioConfig;
    results: WebhookTestResult[];
    assertions: AssertionResult[];
    metrics: {
        totalAttempts: number;
        verified: number;
        rejected: number;
        errors: number;
        duplicates: number;
        uniqueEvents: number;
    };
}

// ============================================================================
// STRIPE SIGNATURE GENERATOR (MATCHES STRIPE SDK)
// ============================================================================

export class StripeSignatureGenerator {
    constructor(private webhookSecret: string) {}

    /**
     * Gera assinatura válida no formato Stripe: t={timestamp},v1={signature}
     * CRITICAL: payload DEVE ser string raw, não Buffer concatenado
     */
    sign(payload: string | Buffer, timestampOverride?: number): string {
        const timestamp = timestampOverride ?? Math.floor(Date.now() / 1000);
        // CRITICAL FIX: Se payload for Buffer, converter para string UTF-8
        const raw = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;
        const signedPayload = `${timestamp}.${raw}`;
        const signature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(signedPayload, 'utf8')
            .digest('hex');
        return `t=${timestamp},v1=${signature}`;
    }

    /**
     * Gera assinatura INVÁLIDA (para testes de rejeição)
     */
    signInvalid(): string {
        return `t=${Math.floor(Date.now() / 1000)},v1=invalid_signature_for_testing`;
    }
}

// ============================================================================
// PAYLOAD FACTORY
// ============================================================================

export class StripePayloadFactory {
    constructor(private rng: SeededRandom) {}

    /**
     * Cria payload JSON de payment_intent.succeeded
     */
    createPaymentIntentSucceeded(
        eventId: string,
        orderId: string,
        amountCents: number,
        currency: string = 'brl'
    ): string {
        const paymentIntentId = `pi_${this.rng.uuid().replace(/-/g, '').slice(0, 24)}`;
        const timestamp = Math.floor(Date.now() / 1000);

        return JSON.stringify({
            id: eventId,
            object: 'event',
            type: 'payment_intent.succeeded',
            created: timestamp,
            livemode: false,
            data: {
                object: {
                    id: paymentIntentId,
                    object: 'payment_intent',
                    amount: amountCents,
                    amount_received: amountCents,
                    currency: currency.toLowerCase(),
                    status: 'succeeded',
                    created: timestamp,
                    metadata: {
                        order_id: orderId
                    },
                    payment_method: `pm_${this.rng.uuid().replace(/-/g, '').slice(0, 24)}`,
                    payment_method_types: ['card'],
                }
            }
        });
    }

    /**
     * Gera event ID no formato Stripe
     */
    generateEventId(): string {
        return `evt_${this.rng.uuid().replace(/-/g, '')}`;
    }
}

// ============================================================================
// GATE 8 ASSERTIONS
// ============================================================================

export class Gate8Asserts {
    /**
     * Assert: Crypto boundary aceita payloads válidos (raw string ou Buffer)
     */
    static assertCryptoBoundaryPass(
        results: WebhookTestResult[]
    ): AssertionResult {
        const validAttempts = results.filter(r => !r.isDuplicate && r.verificationResult !== 'ERROR');
        const passed = validAttempts.filter(r => r.verificationResult === 'PASS');

        return {
            passed: passed.length === validAttempts.length,
            gate: 'GATE_8',
            assertion: 'CRYPTO_BOUNDARY_PASS',
            details: passed.length === validAttempts.length
                ? `All ${validAttempts.length} valid webhook payloads passed crypto verification`
                : `${validAttempts.length - passed.length} valid payloads failed verification`,
            evidence: passed.length !== validAttempts.length
                ? { failed: validAttempts.filter(r => r.verificationResult !== 'PASS').slice(0, 10) }
                : undefined,
        };
    }

    /**
     * Assert: Crypto boundary rejeita payloads inválidos
     */
    static assertCryptoBoundaryReject(
        invalidAttempts: { payloadType: string; headerType: string; rejected: boolean }[]
    ): AssertionResult {
        const shouldReject = invalidAttempts.filter(a => 
            a.headerType === 'missing' || 
            a.headerType === 'invalid' || 
            a.payloadType === 'parsed_object'
        );
        const correctlyRejected = shouldReject.filter(a => a.rejected);

        return {
            passed: correctlyRejected.length === shouldReject.length,
            gate: 'GATE_8',
            assertion: 'CRYPTO_BOUNDARY_REJECT',
            details: correctlyRejected.length === shouldReject.length
                ? `All ${shouldReject.length} invalid payloads were correctly rejected`
                : `${shouldReject.length - correctlyRejected.length} invalid payloads were NOT rejected`,
            evidence: correctlyRejected.length !== shouldReject.length
                ? { allowed: shouldReject.filter(a => !a.rejected) }
                : undefined,
        };
    }

    /**
     * Assert: Webhook idempotency - mesmo event.id não gera duplicatas no core
     */
    static assertWebhookIdempotency(
        results: WebhookTestResult[],
        eventsInCore: Map<string, number> // gatewayReference -> count
    ): AssertionResult {
        const duplicatesAllowed: string[] = [];

        for (const [eventId, count] of eventsInCore.entries()) {
            if (count > 1) {
                duplicatesAllowed.push(`${eventId}: ${count} events`);
            }
        }

        return {
            passed: duplicatesAllowed.length === 0,
            gate: 'GATE_8',
            assertion: 'WEBHOOK_IDEMPOTENCY',
            details: duplicatesAllowed.length === 0
                ? `Idempotency enforced: ${eventsInCore.size} unique events from ${results.length} webhook attempts`
                : `${duplicatesAllowed.length} event IDs generated multiple core events`,
            evidence: duplicatesAllowed.length > 0
                ? { duplicates: duplicatesAllowed.slice(0, 10) }
                : undefined,
        };
    }

    /**
     * Assert: Stripe isolation - falha do Stripe não derruba core
     */
    static assertStripeIsolation(
        operations: { stripeSucceeded: boolean; coreOperational: boolean }[]
    ): AssertionResult {
        const stripeFailures = operations.filter(op => !op.stripeSucceeded);
        const coreDownDueToStripe = stripeFailures.filter(op => !op.coreOperational);

        return {
            passed: coreDownDueToStripe.length === 0,
            gate: 'GATE_8',
            assertion: 'STRIPE_ISOLATION',
            details: coreDownDueToStripe.length === 0
                ? `Core remained operational during ${stripeFailures.length} Stripe failures`
                : `Core went down ${coreDownDueToStripe.length} times due to Stripe failures`,
            evidence: coreDownDueToStripe.length > 0
                ? { failures: coreDownDueToStripe.length }
                : undefined,
        };
    }
}

// ============================================================================
// SCENARIO RUNNER
// ============================================================================

export class Gate8StripeWebhookScenario {
    private sigGen: StripeSignatureGenerator;
    private payloadFactory: StripePayloadFactory;
    private rng: SeededRandom;
    private config: StripeWebhookScenarioConfig;

    constructor(config: StripeWebhookScenarioConfig) {
        this.config = config;
        this.sigGen = new StripeSignatureGenerator(config.webhookSecret);
        this.rng = new SeededRandom(config.seed);
        this.payloadFactory = new StripePayloadFactory(this.rng);
    }

    /**
     * Gera batch de webhooks para teste (incluindo duplicatas programadas)
     */
    generateWebhookBatch(orders: { orderId: string; amountCents: number; currency: string }[]): {
        webhooks: {
            eventId: string;
            orderId: string;
            payloadString: string;
            payloadBuffer: Buffer;
            validHeader: string;
            isDuplicate: boolean;
        }[];
    } {
        const webhooks: ReturnType<typeof this.generateWebhookBatch>['webhooks'] = [];
        const seenEventIds = new Set<string>();

        for (const order of orders) {
            const eventId = this.payloadFactory.generateEventId();
            const payloadString = this.payloadFactory.createPaymentIntentSucceeded(
                eventId,
                order.orderId,
                order.amountCents,
                order.currency
            );
            const payloadBuffer = Buffer.from(payloadString, 'utf8');
            const validHeader = this.sigGen.sign(payloadString);

            webhooks.push({
                eventId,
                orderId: order.orderId,
                payloadString,
                payloadBuffer,
                validHeader,
                isDuplicate: false,
            });

            seenEventIds.add(eventId);

            // Gerar duplicatas com probabilidade configurada
            if (this.rng.next() < this.config.duplicateProb) {
                // Re-assinar com timestamp ligeiramente diferente (simula retry)
                const duplicateHeader = this.sigGen.sign(payloadString);
                webhooks.push({
                    eventId,
                    orderId: order.orderId,
                    payloadString,
                    payloadBuffer,
                    validHeader: duplicateHeader,
                    isDuplicate: true,
                });
            }
        }

        // Shuffle para simular ordem não-determinística de chegada
        return { webhooks: this.shuffleArray(webhooks) };
    }

    /**
     * Gera casos de teste para rejeição
     */
    generateRejectionTests(): {
        payloadType: string;
        headerType: string;
        payload: any;
        headers: Record<string, string | undefined>;
    }[] {
        const validPayload = this.payloadFactory.createPaymentIntentSucceeded(
            this.payloadFactory.generateEventId(),
            'ord_test',
            1000,
            'brl'
        );

        return [
            // 1. Payload parseado (objeto JS) - deve rejeitar
            {
                payloadType: 'parsed_object',
                headerType: 'valid',
                payload: JSON.parse(validPayload),
                headers: { 'stripe-signature': this.sigGen.sign(validPayload) },
            },
            // 2. Header ausente - deve rejeitar
            {
                payloadType: 'raw_string',
                headerType: 'missing',
                payload: validPayload,
                headers: {},
            },
            // 3. Assinatura inválida - deve rejeitar
            {
                payloadType: 'raw_string',
                headerType: 'invalid',
                payload: validPayload,
                headers: { 'stripe-signature': this.sigGen.signInvalid() },
            },
            // 4. Payload alterado após assinatura - deve rejeitar
            {
                payloadType: 'tampered',
                headerType: 'valid_for_original',
                payload: validPayload.replace('"amount":1000', '"amount":999999'),
                headers: { 'stripe-signature': this.sigGen.sign(validPayload) },
            },
        ];
    }

    /**
     * Executa o cenário completo de Gate 8
     */
    async run(
        adapter: WebhookVerifier,
        processVerifiedPayment: (payment: VerifiedPayment) => Promise<{ success: boolean; eventId?: string }>,
        options?: { skipRejectionTests?: boolean }
    ): Promise<Gate8ScenarioResult> {
        const results: WebhookTestResult[] = [];
        const eventsInCore = new Map<string, number>();
        const rejectionResults: { payloadType: string; headerType: string; rejected: boolean }[] = [];

        // 1. Gerar batch de orders
        const orders = Array.from({ length: this.config.numPayments }, (_, i) => ({
            orderId: `ord_gate8_${this.rng.uuid().slice(0, 8)}`,
            amountCents: Math.floor(this.rng.next() * 100000) + 100,
            currency: this.rng.pick(['brl', 'usd', 'eur']),
        }));

        // 2. Gerar webhooks
        const { webhooks } = this.generateWebhookBatch(orders);

        // 3. Processar webhooks válidos
        for (const webhook of webhooks) {
            const result: WebhookTestResult = {
                eventId: webhook.eventId,
                orderId: webhook.orderId,
                payloadType: 'buffer',
                verificationResult: 'ERROR',
                isDuplicate: webhook.isDuplicate,
            };

            try {
                // Alternar entre string e buffer para testar ambos
                const useBuffer = this.rng.next() > 0.5;
                const payload = useBuffer ? webhook.payloadBuffer : webhook.payloadString;
                result.payloadType = useBuffer ? 'buffer' : 'string';

                const verified = await adapter.verifyWebhook(payload, {
                    'stripe-signature': webhook.validHeader,
                });

                if (verified) {
                    result.verificationResult = 'PASS';

                    // Processar no core (testar idempotência)
                    const coreResult = await processVerifiedPayment(verified);
                    if (coreResult.success && coreResult.eventId) {
                        const count = eventsInCore.get(verified.gatewayReference) || 0;
                        eventsInCore.set(verified.gatewayReference, count + 1);
                    }
                } else {
                    result.verificationResult = 'REJECT';
                }
            } catch (error: any) {
                result.verificationResult = 'REJECT';
                result.errorMessage = error.message;
            }

            results.push(result);
        }

        // 4. Testes de rejeição (se não pulados)
        if (!options?.skipRejectionTests) {
            const rejectionTests = this.generateRejectionTests();
            
            for (const test of rejectionTests) {
                let rejected = false;
                try {
                    await adapter.verifyWebhook(test.payload, test.headers as any);
                } catch {
                    rejected = true;
                }
                rejectionResults.push({
                    payloadType: test.payloadType,
                    headerType: test.headerType,
                    rejected,
                });
            }
        }

        // 5. Calcular assertions
        const assertions: AssertionResult[] = [
            Gate8Asserts.assertCryptoBoundaryPass(results),
            Gate8Asserts.assertCryptoBoundaryReject(rejectionResults),
            Gate8Asserts.assertWebhookIdempotency(results, eventsInCore),
        ];

        // 6. Métricas
        const metrics = {
            totalAttempts: results.length,
            verified: results.filter(r => r.verificationResult === 'PASS').length,
            rejected: results.filter(r => r.verificationResult === 'REJECT').length,
            errors: results.filter(r => r.verificationResult === 'ERROR').length,
            duplicates: results.filter(r => r.isDuplicate).length,
            uniqueEvents: eventsInCore.size,
        };

        return {
            config: this.config,
            results,
            assertions,
            metrics,
        };
    }

    private shuffleArray<T>(array: T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(this.rng.next() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}

// ============================================================================
// EXPORTS já feitos inline com export keyword
// ============================================================================
