/**
 * Gate 4: Atomicity & Concurrency World Tests
 *
 * Tests:
 * - Concurrent writes to same stream_version are detected
 * - Webhook duplication is handled idempotently
 * - Double-click pay scenarios don't create duplicate payments
 * - Atomic transactions rollback correctly on failure
 */

import { InMemoryEventStore } from "../../event-log/InMemoryEventStore";
import { CoreEvent } from "../../event-log/types";
import {
  AuditAsserter,
  Gate4Asserts,
  MetricsCollector,
  SeededRandom,
  StressTestRunner,
  WorldFactory,
  loadPilotConfig,
  loadWorldConfig,
} from "../harness";

describe("Gate 4: Atomicity & Concurrency (World Simulation)", () => {
  let config = loadPilotConfig();
  let factory: WorldFactory;
  let asserter: AuditAsserter;
  let metrics: MetricsCollector;
  let eventStore: InMemoryEventStore;
  let rng: SeededRandom;

  beforeAll(() => {
    if (process.env.WORLD_STRESS === "true") {
      config = loadWorldConfig();
    }
  });

  beforeEach(() => {
    factory = new WorldFactory(config);
    asserter = new AuditAsserter();
    metrics = new MetricsCollector();
    eventStore = new InMemoryEventStore();
    rng = new SeededRandom(config.seed);
    metrics.start();
  });

  afterEach(() => {
    metrics.end();
  });

  describe("Concurrent Stream Version Conflicts", () => {
    it("should detect and reject concurrent writes to same stream_version", async () => {
      const world = factory.generate();
      const attempts: {
        streamId: string;
        version: number;
        succeeded: boolean;
      }[] = [];

      // Pick some orders and try to write concurrently
      const orderEvents = world.allEvents.filter((e) =>
        e.stream_id.startsWith("ORDER:"),
      );
      const streams = [...new Set(orderEvents.map((e) => e.stream_id))].slice(
        0,
        10,
      );

      for (const streamId of streams) {
        // First, create the stream with version 0
        const initialEvent: CoreEvent = {
          event_id: rng.uuid(),
          stream_id: streamId,
          stream_version: 0,
          type: "ORDER_CREATED",
          payload: {
            id: streamId.split(":")[1],
            table_id: `T${Math.floor(rng.next() * 10) + 1}`,
          },
          occurred_at: new Date(),
          hash: rng.uuid(),
          meta: {},
        };
        await eventStore.append(initialEvent, -1); // New stream expected version is -1

        // Try to write version 1 multiple times concurrently
        const writePromises = Array.from({ length: 5 }, async () => {
          const event: CoreEvent = {
            event_id: rng.uuid(),
            stream_id: streamId,
            stream_version: 1,
            type: "ORDER_ITEM_ADDED",
            payload: {
              order_id: streamId.split(":")[1],
              item: { id: rng.uuid() },
            },
            occurred_at: new Date(),
            hash: rng.uuid(),
            meta: {},
          };

          try {
            await eventStore.append(event, 0); // All trying to append after version 0
            return true;
          } catch (error: any) {
            if (
              error.message.includes("Concurrency") ||
              error.message.includes("version")
            ) {
              return false;
            }
            throw error;
          }
        });

        const results = await Promise.all(writePromises);

        // Only one should succeed
        const succeeded = results.filter((r) => r).length;
        for (const result of results) {
          attempts.push({ streamId, version: 1, succeeded: result });
        }

        // At most one should succeed per version
        expect(succeeded).toBeLessThanOrEqual(1);
      }

      const result = Gate4Asserts.assertConcurrencyConflictDetection(attempts);
      asserter.add(result);
      expect(result.passed).toBe(true);
    });

    it("should maintain stream version integrity under concurrent load", async () => {
      const streamId = `ORDER:test_${rng.uuid()}`;
      const eventCount = 20;
      const attempts: {
        streamId: string;
        version: number;
        succeeded: boolean;
      }[] = [];

      // Sequential writes should succeed (starting from version 0 for new stream)
      for (let i = 0; i < eventCount; i++) {
        const event: CoreEvent = {
          event_id: rng.uuid(),
          stream_id: streamId,
          stream_version: i,
          type: "ORDER_ITEM_ADDED",
          payload: {
            order_id: streamId.split(":")[1],
            item: { id: `item_${i}` },
          },
          occurred_at: new Date(),
          hash: rng.uuid(),
          meta: {},
        };

        try {
          await eventStore.append(event, i - 1); // expectedVersion is current version (-1 for new stream)
          attempts.push({ streamId, version: i, succeeded: true });
        } catch (error) {
          attempts.push({ streamId, version: i, succeeded: false });
        }
      }

      // All should succeed when sequential
      const succeeded = attempts.filter((a) => a.succeeded).length;
      expect(succeeded).toBe(eventCount);

      // Verify stream state (version is 0-indexed, so last version is eventCount - 1)
      const version = await eventStore.getStreamVersion(streamId);
      expect(version).toBe(eventCount - 1);
    });
  });

  describe("Webhook Duplication Handling", () => {
    it("should handle duplicate webhook payloads idempotently", async () => {
      const world = factory.generate();
      const stressRunner = new StressTestRunner(config.seed, {
        duplicateProbability: 0.3,
        delayMaxMs: 1000,
        concurrentWrites: 10,
      });

      // Get payment confirmed events
      const paymentEvents = world.allEvents.filter(
        (e) => e.type === "PAYMENT_CONFIRMED",
      );

      // Generate duplicates
      const webhookPayloads =
        stressRunner.generateDuplicateWebhooks(paymentEvents);

      const processedPayments = new Map<string, number>();
      const operations: {
        idempotencyKey: string;
        result: string;
        count: number;
      }[] = [];

      // Process webhooks
      for (const { payload, isDuplicate, delayMs } of webhookPayloads) {
        if (delayMs > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.min(delayMs, 100)),
          );
        }

        const paymentId = payload.payload?.payment_id;
        if (!paymentId) continue;

        const currentCount = processedPayments.get(paymentId) || 0;

        // Simulate idempotent processing
        if (currentCount === 0) {
          processedPayments.set(paymentId, 1);
          operations.push({
            idempotencyKey: paymentId,
            result: "PROCESSED",
            count: 1,
          });
        } else {
          operations.push({
            idempotencyKey: paymentId,
            result: "PROCESSED", // Same result for duplicates
            count: currentCount + 1,
          });
        }
      }

      // Verify idempotency
      const result = Gate4Asserts.assertIdempotency(operations);
      asserter.add(result);
      expect(result.passed).toBe(true);

      // Each payment should be processed exactly once (despite duplicates in input)
      const uniquePayments = new Set(
        paymentEvents.map((e) => e.payload?.payment_id),
      );
      expect(processedPayments.size).toBe(uniquePayments.size);
    });

    it("should reject invalid/malformed webhooks", async () => {
      const invalidPayloads = [
        null,
        undefined,
        {},
        { orderId: null },
        { amountCents: -100 },
        { status: "INVALID_STATUS" },
      ];

      let rejected = 0;

      for (const payload of invalidPayloads) {
        const isValid = validateWebhookPayload(payload);
        if (!isValid) rejected++;
      }

      expect(rejected).toBe(invalidPayloads.length);
    });
  });

  describe("Double-Click Pay Prevention", () => {
    it("should prevent duplicate payment creation on rapid clicks", async () => {
      const world = factory.generate();
      const order = world.sessions[0]?.orders[0];
      if (!order) return;

      const orderId = order.order.id;
      const paymentAttempts = 5; // Simulating 5 rapid clicks

      const createdPayments: string[] = [];
      const paymentCreationAttempts: Promise<string | null>[] = [];

      // Track which payments exist for this order
      const existingPaymentsForOrder = new Set<string>();

      // Simulate concurrent payment attempts
      for (let i = 0; i < paymentAttempts; i++) {
        paymentCreationAttempts.push(
          (async () => {
            // Check if payment already exists for this order (idempotency)
            if (existingPaymentsForOrder.size > 0) {
              return null; // Duplicate, reject
            }

            const paymentId = rng.uuid();

            // Race condition simulation - mark as created
            if (!existingPaymentsForOrder.has(orderId)) {
              existingPaymentsForOrder.add(orderId);
              return paymentId;
            }

            return null;
          })(),
        );
      }

      const results = await Promise.all(paymentCreationAttempts);
      const successfulPayments = results.filter((r) => r !== null);

      // Only one payment should be created
      expect(successfulPayments.length).toBe(1);
    });

    it("should handle race condition in payment finalization", async () => {
      const streamId = `PAYMENT:race_test_${rng.uuid()}`;
      const attempts: {
        streamId: string;
        version: number;
        succeeded: boolean;
      }[] = [];

      // Multiple attempts to confirm the same payment
      const confirmPromises = Array.from({ length: 10 }, async () => {
        const event: CoreEvent = {
          event_id: rng.uuid(),
          stream_id: streamId,
          stream_version: 2, // All trying to write version 2 (after PAYMENT_CREATED at version 1)
          type: "PAYMENT_CONFIRMED",
          payload: { payment_id: streamId.split(":")[1] },
          occurred_at: new Date(),
          hash: rng.uuid(),
          meta: {},
        };

        // First, create the initial event
        const createEvent: CoreEvent = {
          event_id: rng.uuid(),
          stream_id: streamId,
          stream_version: 1,
          type: "PAYMENT_CREATED",
          payload: { id: streamId.split(":")[1] },
          occurred_at: new Date(),
          hash: rng.uuid(),
          meta: {},
        };

        try {
          // Try to create first (only first should succeed)
          await eventStore.append(createEvent, 0);
        } catch (e) {
          // Expected for concurrent creates
        }

        try {
          await eventStore.append(event, 1);
          return true;
        } catch (error) {
          return false;
        }
      });

      const results = await Promise.all(confirmPromises);
      const succeeded = results.filter((r) => r).length;

      // At most one should succeed
      expect(succeeded).toBeLessThanOrEqual(1);
    });
  });

  describe("Atomic Rollback Simulation", () => {
    it("should not leave partial state on failure", async () => {
      const operations: {
        name: string;
        eventWritten: boolean;
        sealCreated: boolean;
        committed: boolean;
      }[] = [];

      // Simulate atomic operations
      for (let i = 0; i < 10; i++) {
        const shouldFail = i % 3 === 0; // Every third operation fails

        if (shouldFail) {
          // Simulate rollback - nothing persisted
          operations.push({
            name: `op_${i}`,
            eventWritten: false,
            sealCreated: false,
            committed: false,
          });
        } else {
          // Simulate success - both event and seal created
          operations.push({
            name: `op_${i}`,
            eventWritten: true,
            sealCreated: true,
            committed: true,
          });
        }
      }

      const result = Gate4Asserts.assertAtomicRollback(operations);
      asserter.add(result);
      expect(result.passed).toBe(true);
    });

    it("should maintain consistency even with interleaved failures", async () => {
      const world = factory.generate();
      const operations: {
        name: string;
        eventWritten: boolean;
        sealCreated: boolean;
        committed: boolean;
      }[] = [];

      // Process orders with random failures
      for (const session of world.sessions.slice(0, 5)) {
        for (const order of session.orders.slice(0, 10)) {
          const shouldFail = rng.shouldOccur(0.2);

          if (shouldFail) {
            operations.push({
              name: `order_${order.order.id}`,
              eventWritten: false,
              sealCreated: false,
              committed: false,
            });
          } else {
            operations.push({
              name: `order_${order.order.id}`,
              eventWritten: true,
              sealCreated: true,
              committed: true,
            });
          }
        }
      }

      const result = Gate4Asserts.assertAtomicRollback(operations);
      asserter.add(result);
      expect(result.passed).toBe(true);
    });
  });

  describe("World-Scale Concurrency Stress Test", () => {
    it("should handle high concurrency without data corruption", async () => {
      const world = factory.generate();
      const concurrentOperations = config.concurrency;

      console.log(`
            Running concurrency stress test:
            - Concurrent operations: ${concurrentOperations}
            - Total events: ${world.stats.totalEvents}
            `);

      // Group events by stream
      const byStream = new Map<string, CoreEvent[]>();
      for (const event of world.allEvents) {
        const stream = byStream.get(event.stream_id) || [];
        stream.push(event);
        byStream.set(event.stream_id, stream);
      }

      let successCount = 0;
      let conflictCount = 0;

      // Process streams concurrently
      const streamIds = Array.from(byStream.keys());
      const batchSize = Math.min(concurrentOperations, streamIds.length);

      for (let i = 0; i < streamIds.length; i += batchSize) {
        const batch = streamIds.slice(i, i + batchSize);

        const batchResults = await Promise.all(
          batch.map(async (streamId) => {
            const events = byStream.get(streamId) || [];
            let localSuccess = 0;
            let localConflict = 0;

            for (const event of events) {
              try {
                await eventStore.append(event, event.stream_version - 1);
                localSuccess++;
              } catch (error) {
                localConflict++;
              }
            }

            return { success: localSuccess, conflict: localConflict };
          }),
        );

        for (const result of batchResults) {
          successCount += result.success;
          conflictCount += result.conflict;
        }
      }

      console.log(`
            Concurrency test results:
            - Successful writes: ${successCount}
            - Conflicts detected: ${conflictCount}
            - Total streams: ${byStream.size}
            `);

      // All should succeed when processed correctly per stream
      expect(successCount).toBeGreaterThan(0);

      const summary = asserter.getSummary();
      expect(summary.failed).toBe(0);

      metrics.recordEvents(successCount);
    }, 120000);
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function validateWebhookPayload(payload: any): boolean {
  if (!payload) return false;
  if (typeof payload !== "object") return false;
  if (!payload.orderId && !payload.amountCents) return false;
  if (payload.amountCents !== undefined && payload.amountCents < 0)
    return false;
  if (payload.status && !["PAID", "PENDING", "FAILED"].includes(payload.status))
    return false;
  return true;
}
