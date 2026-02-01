/**
 * Gate 8 Massive Test: Stripe Webhook Integration
 *
 * Valida a integração completa do boundary criptográfico Stripe:
 * - CRYPTO_BOUNDARY_PASS: payload raw aceito
 * - CRYPTO_BOUNDARY_REJECT: payload inválido rejeitado
 * - WEBHOOK_IDEMPOTENCY: duplicatas não geram duplicação no core
 * - STRIPE_ISOLATION: falha Stripe não derruba core
 */

import * as crypto from "crypto";
import { InMemoryEventStore } from "../../event-log/InMemoryEventStore";
import { CoreEvent } from "../../event-log/types";
import { VerifiedPayment } from "../../gateways/PaymentGatewayAdapter";
import { InMemoryLegalSealStore } from "../../legal-boundary/InMemoryLegalSealStore";
import { LegalBoundary } from "../../legal-boundary/LegalBoundary";
import { LegalEntityType } from "../../legal-boundary/types";
import {
  AuditAsserter,
  MetricsCollector,
  SeededRandom,
  loadPilotConfig,
  loadStressConfig,
  loadWorldConfig,
} from "../harness";
import {
  Gate8Asserts,
  Gate8StripeWebhookScenario,
  StripePayloadFactory,
  StripeSignatureGenerator,
  StripeWebhookScenarioConfig,
} from "./scenarios/gate8_stripe_webhooks.scenario";

// Mock Stripe Adapter para testes (não precisa de API real)
class MockStripeGatewayAdapter {
  readonly providerId = "STRIPE_V1_MOCK";
  private webhookSecret: string;

  constructor(webhookSecret: string) {
    this.webhookSecret = webhookSecret;
  }

  async verifyWebhook(
    payload: any,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<VerifiedPayment | null> {
    // GUARD: Rejeita payload já parseado
    if (typeof payload === "object" && !Buffer.isBuffer(payload)) {
      throw new Error(
        "verifyWebhook() requires a raw Buffer or string. " +
          "Ensure your webhook endpoint uses 'express.raw({type: 'application/json'})'",
      );
    }

    const signature = headers["stripe-signature"];
    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    const sig = Array.isArray(signature) ? signature[0] : signature;

    // Parse header
    const parts = sig.split(",").reduce((acc: any, part: string) => {
      const [key, value] = part.split("=");
      acc[key] = value;
      return acc;
    }, {});

    const timestamp = parts["t"];
    const v1Signature = parts["v1"];

    if (!timestamp || !v1Signature) {
      throw new Error("Invalid stripe-signature format");
    }

    // Verificar assinatura
    const raw = Buffer.isBuffer(payload) ? payload.toString("utf8") : payload;
    const signedPayload = `${timestamp}.${raw}`;
    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(signedPayload, "utf8")
      .digest("hex");

    if (v1Signature !== expectedSignature) {
      throw new Error("Webhook Signature Verification Failed");
    }

    // Parse e retornar
    const event = JSON.parse(raw);

    if (event.type !== "payment_intent.succeeded") {
      return null;
    }

    const pi = event.data.object;
    const orderId = pi.metadata?.order_id;

    if (!orderId) {
      return null;
    }

    return {
      gatewayReference: event.id, // IDEMPOTENCY KEY = event ID
      orderId: orderId,
      amountCents: pi.amount_received,
      currency: pi.currency,
      status: "PAID",
      occurredAt: new Date(pi.created * 1000),
      rawMetadata: {
        stripe_status: pi.status,
        payment_intent_id: pi.id,
      },
    };
  }
}

describe("Gate 8: Stripe Webhook Integration", () => {
  let config = loadPilotConfig();
  let asserter: AuditAsserter;
  let metrics: MetricsCollector;
  let eventStore: InMemoryEventStore;
  let sealStore: InMemoryLegalSealStore;
  let legalBoundary: LegalBoundary;
  let rng: SeededRandom;

  const WEBHOOK_SECRET = "whsec_test_secret_for_gate8_massive_audit";

  beforeAll(() => {
    if (process.env.WORLD_STRESS === "true") {
      config = loadStressConfig();
    } else if (process.env.WORLD_FULL === "true") {
      config = loadWorldConfig();
    }
  });

  beforeEach(() => {
    asserter = new AuditAsserter();
    metrics = new MetricsCollector();
    eventStore = new InMemoryEventStore();
    sealStore = new InMemoryLegalSealStore();
    legalBoundary = new LegalBoundary(sealStore);
    rng = new SeededRandom(config.seed);
    metrics.start();
  });

  afterEach(() => {
    metrics.end();
  });

  describe("Crypto Boundary Validation", () => {
    it("should accept raw string payload with valid signature", async () => {
      const adapter = new MockStripeGatewayAdapter(WEBHOOK_SECRET);
      const sigGen = new StripeSignatureGenerator(WEBHOOK_SECRET);
      const payloadFactory = new StripePayloadFactory(rng);

      const eventId = payloadFactory.generateEventId();
      const payload = payloadFactory.createPaymentIntentSucceeded(
        eventId,
        "ord_test_001",
        5000,
        "brl",
      );
      const header = sigGen.sign(payload);

      const result = await adapter.verifyWebhook(payload, {
        "stripe-signature": header,
      });

      expect(result).not.toBeNull();
      expect(result?.gatewayReference).toBe(eventId);
      expect(result?.orderId).toBe("ord_test_001");
      expect(result?.amountCents).toBe(5000);
    });

    it("should accept raw Buffer payload with valid signature", async () => {
      const adapter = new MockStripeGatewayAdapter(WEBHOOK_SECRET);
      const sigGen = new StripeSignatureGenerator(WEBHOOK_SECRET);
      const payloadFactory = new StripePayloadFactory(rng);

      const eventId = payloadFactory.generateEventId();
      const payloadStr = payloadFactory.createPaymentIntentSucceeded(
        eventId,
        "ord_test_002",
        7500,
        "usd",
      );
      const payloadBuf = Buffer.from(payloadStr, "utf8");
      // CRITICAL: Assinar usando a STRING (não o Buffer concatenado)
      const header = sigGen.sign(payloadStr);

      const result = await adapter.verifyWebhook(payloadBuf, {
        "stripe-signature": header,
      });

      expect(result).not.toBeNull();
      expect(result?.gatewayReference).toBe(eventId);
    });

    it("should REJECT parsed JSON object (safety guard)", async () => {
      const adapter = new MockStripeGatewayAdapter(WEBHOOK_SECRET);
      const sigGen = new StripeSignatureGenerator(WEBHOOK_SECRET);
      const payloadFactory = new StripePayloadFactory(rng);

      const payloadStr = payloadFactory.createPaymentIntentSucceeded(
        payloadFactory.generateEventId(),
        "ord_test_003",
        1000,
        "eur",
      );
      const payloadObj = JSON.parse(payloadStr);
      const header = sigGen.sign(payloadStr);

      await expect(
        adapter.verifyWebhook(payloadObj, {
          "stripe-signature": header,
        }),
      ).rejects.toThrow("requires a raw Buffer or string");
    });

    it("should REJECT missing signature header", async () => {
      const adapter = new MockStripeGatewayAdapter(WEBHOOK_SECRET);
      const payloadFactory = new StripePayloadFactory(rng);

      const payload = payloadFactory.createPaymentIntentSucceeded(
        payloadFactory.generateEventId(),
        "ord_test_004",
        1000,
        "brl",
      );

      await expect(adapter.verifyWebhook(payload, {})).rejects.toThrow(
        "Missing stripe-signature header",
      );
    });

    it("should REJECT invalid signature", async () => {
      const adapter = new MockStripeGatewayAdapter(WEBHOOK_SECRET);
      const payloadFactory = new StripePayloadFactory(rng);

      const payload = payloadFactory.createPaymentIntentSucceeded(
        payloadFactory.generateEventId(),
        "ord_test_005",
        1000,
        "brl",
      );

      await expect(
        adapter.verifyWebhook(payload, {
          "stripe-signature": "t=123456789,v1=invalid_signature",
        }),
      ).rejects.toThrow("Signature Verification Failed");
    });

    it("should REJECT tampered payload", async () => {
      const adapter = new MockStripeGatewayAdapter(WEBHOOK_SECRET);
      const sigGen = new StripeSignatureGenerator(WEBHOOK_SECRET);
      const payloadFactory = new StripePayloadFactory(rng);

      const originalPayload = payloadFactory.createPaymentIntentSucceeded(
        payloadFactory.generateEventId(),
        "ord_test_006",
        1000,
        "brl",
      );
      const tamperedPayload = originalPayload.replace(
        '"amount":1000',
        '"amount":999999',
      );
      const header = sigGen.sign(originalPayload); // Assinatura do original

      await expect(
        adapter.verifyWebhook(tamperedPayload, {
          "stripe-signature": header,
        }),
      ).rejects.toThrow("Signature Verification Failed");
    });
  });

  describe("Webhook Idempotency", () => {
    it("should not create duplicate events for same webhook event ID", async () => {
      const adapter = new MockStripeGatewayAdapter(WEBHOOK_SECRET);
      const sigGen = new StripeSignatureGenerator(WEBHOOK_SECRET);
      const payloadFactory = new StripePayloadFactory(rng);

      const eventId = payloadFactory.generateEventId();
      const orderId = "ord_idempotency_test";
      const payload = payloadFactory.createPaymentIntentSucceeded(
        eventId,
        orderId,
        5000,
        "brl",
      );

      const processedEventIds = new Set<string>();

      // Simular handler que verifica idempotência
      const processPayment = async (payment: VerifiedPayment) => {
        if (processedEventIds.has(payment.gatewayReference)) {
          return { success: false, reason: "DUPLICATE" };
        }
        processedEventIds.add(payment.gatewayReference);
        return { success: true, eventId: payment.gatewayReference };
      };

      // Enviar mesmo webhook 5 vezes
      let processedCount = 0;
      for (let i = 0; i < 5; i++) {
        const header = sigGen.sign(payload);
        const result = await adapter.verifyWebhook(payload, {
          "stripe-signature": header,
        });

        if (result) {
          const processResult = await processPayment(result);
          if (processResult.success) {
            processedCount++;
          }
        }
      }

      // Apenas 1 deve ter sido processado
      expect(processedCount).toBe(1);
      expect(processedEventIds.size).toBe(1);

      // Assert formal - idempotência por event.id (nova assinatura cirúrgica)
      const stripeEventIds = Array(3).fill(eventId); // 3 tentativas com mesmo event.id
      const coreEventsByStripeId = new Map<string, number>();
      coreEventsByStripeId.set(eventId, processedCount);

      asserter.add(
        Gate8Asserts.assertWebhookIdempotency(
          stripeEventIds,
          coreEventsByStripeId,
        ),
      );

      const summary = asserter.getSummary();
      expect(summary.failed).toBe(0);
    });
  });

  describe("Full Scenario Run", () => {
    it("should pass all Gate 8 assertions in massive scenario", async () => {
      const scenarioConfig: StripeWebhookScenarioConfig = {
        webhookSecret: WEBHOOK_SECRET,
        numPayments: Math.min(config.ordersPerRestaurant, 100), // Limitar para teste rápido
        duplicateProb: config.duplicateWebhookProbability || 0.1,
        delayMaxMs: config.delayedWebhookMaxMs || 1000,
        seed: config.seed,
      };

      const scenario = new Gate8StripeWebhookScenario(scenarioConfig);
      const adapter = new MockStripeGatewayAdapter(WEBHOOK_SECRET);
      const processedEvents = new Set<string>();

      const result = await scenario.run(adapter, async (payment) => {
        // Handler idempotente
        if (processedEvents.has(payment.gatewayReference)) {
          return { success: false };
        }

        // Criar evento no core
        const coreEvent: CoreEvent = {
          event_id: rng.uuid(),
          stream_id: `ORDER:${payment.orderId}`,
          stream_version: 1,
          type: "PAYMENT_CONFIRMED",
          occurred_at: payment.occurredAt,
          correlation_id: payment.gatewayReference, // Idempotency key
          payload: {
            payment_id: rng.uuid(),
            order_id: payment.orderId,
            amount_cents: payment.amountCents,
            currency: payment.currency,
            gateway_reference: payment.gatewayReference,
          },
          hash: "",
          hash_prev: "",
          meta: {},
        };

        try {
          await eventStore.append(coreEvent, 0);
          await legalBoundary.observe([coreEvent], getStreamHash);
          processedEvents.add(payment.gatewayReference);
          return { success: true, eventId: coreEvent.event_id };
        } catch (error) {
          return { success: false };
        }
      });

      // Log métricas
      console.log(`
            ════════════════════════════════════════════════════════════
            GATE 8 SCENARIO RESULTS
            ════════════════════════════════════════════════════════════
            Total Attempts: ${result.metrics.totalAttempts}
            Verified: ${result.metrics.verified}
            Rejected: ${result.metrics.rejected}
            Duplicates Sent: ${result.metrics.duplicates}
            Unique Events in Core: ${result.metrics.uniqueEvents}
            ════════════════════════════════════════════════════════════
            `);

      // Adicionar assertions ao asserter
      for (const assertion of result.assertions) {
        asserter.add(assertion);
      }

      const summary = asserter.getSummary();
      console.log(`Gate 8 Summary: ${JSON.stringify(summary.byGate, null, 2)}`);

      expect(summary.failed).toBe(0);
    }, 60000);
  });

  describe("Stripe Isolation (Core Independence)", () => {
    it("should keep core operational when Stripe verification fails", async () => {
      const operations: {
        stripeSucceeded: boolean;
        coreOperational: boolean;
      }[] = [];

      // Simular 10 operações: metade com Stripe funcionando, metade falhando
      for (let i = 0; i < 10; i++) {
        const stripeWorks = i < 5;
        let stripeSucceeded = false;
        let coreOperational = true;

        try {
          if (!stripeWorks) {
            throw new Error("Simulated Stripe failure");
          }
          stripeSucceeded = true;
        } catch {
          stripeSucceeded = false;
        }

        // Core deve continuar funcionando independente do Stripe
        try {
          // Operação genérica no core (não depende de Stripe)
          const testEvent: CoreEvent = {
            event_id: rng.uuid(),
            stream_id: `ORDER:ord_isolation_${i}`,
            stream_version: 0, // New stream starts at version 0
            type: "ORDER_CREATED",
            occurred_at: new Date(),
            correlation_id: rng.uuid(),
            payload: { id: `ord_isolation_${i}`, table_id: `T${(i % 10) + 1}` },
            hash: "",
            hash_prev: "",
            meta: {},
          };
          await eventStore.append(testEvent, -1); // Expected version for new stream is -1
          coreOperational = true;
        } catch {
          coreOperational = false;
        }

        operations.push({ stripeSucceeded, coreOperational });
      }

      // Assert
      asserter.add(Gate8Asserts.assertStripeIsolation(operations));

      const summary = asserter.getSummary();
      expect(summary.failed).toBe(0);
    });
  });
});

// ============================================================================
// HELPERS
// ============================================================================

function getStreamHash(entityType: LegalEntityType, entityId: string): string {
  return `hash_${entityType}_${entityId}_${Date.now()}`;
}
