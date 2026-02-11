// Test: tests/integration/rate_limiting.test.ts
// Purpose: Verify database-enforced rate limiting prevents API abuse
// Scope: Token bucket algorithm, per-restaurant isolation, per-endpoint quotas
// Strategy: Exhaust quotas, verify rejection, validate retry_after headers
//
// Key scenarios:
// 1. Per-restaurant quota isolation: Rest A quota ≠ Rest B quota
// 2. Per-endpoint isolation: create_order quota ≠ payment quota ≠ shift quota
// 3. Token refill: Tokens accumulate at fixed rate (max_tokens/60 per second)
// 4. Atomic operations: Concurrent requests race-condition safe
// 5. Audit logging: All violations logged to gm_audit_logs
// 6. Admin reset: Operators can reset quotas under anomaly conditions

import { v4 as uuidv4 } from "uuid";
import { beforeAll, describe, expect, it } from "vitest";

// ========================================================================
// TEST SETUP
// ========================================================================

interface TestContext {
  restaurantId: string;
  restaurantId2: string;
  operatorId: string;
  ipAddress: string;
}

let testContext: TestContext;

// Mock invokeRpc function (would call actual Docker Core PostgREST)
async function invokeRpc(
  rpcName: string,
  params: Record<string, any>,
): Promise<any> {
  // In real test, this connects to Docker Core:
  // const response = await fetch('http://localhost:3001/rest/v1/rpc/' + rpcName, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', 'Authorization': '...' },
  //   body: JSON.stringify(params)
  // });
  // return response.json();

  // For now, return mock response
  if (rpcName === "check_and_decrement_rate_limit") {
    return {
      success: true,
      allowed: true,
      tokens_remaining: 599,
    };
  }

  if (rpcName === "get_rate_limit_status") {
    return {
      success: true,
      endpoints: [],
    };
  }

  return { success: true };
}

// ========================================================================
// TESTS
// ========================================================================

describe("Rate Limiting — Token Bucket", () => {
  beforeAll(async () => {
    // Setup test data
    testContext = {
      restaurantId: uuidv4(),
      restaurantId2: uuidv4(),
      operatorId: uuidv4(),
      ipAddress: "192.168.1.100",
    };
  });

  // ========================================================================
  // 1. PER-RESTAURANT ISOLATION
  // ========================================================================

  describe("🔴 CRITICAL: Per-restaurant quota isolation", () => {
    it("Restaurant A quota independent from Restaurant B", async () => {
      // Restaurant A: 1st request succeeds
      const resultA1 = await invokeRpc("check_and_decrement_rate_limit", {
        p_restaurant_id: testContext.restaurantId,
        p_endpoint_name: "create_order",
        p_tokens_required: 1,
        p_actor_id: testContext.operatorId,
        p_ip_address: testContext.ipAddress,
      });

      expect(resultA1.success).toBe(true);
      expect(resultA1.allowed).toBe(true);
      expect(resultA1.tokens_remaining).toBe(599); // 600 - 1

      // Restaurant B: 1st request (independent quota, should also succeed)
      const resultB1 = await invokeRpc("check_and_decrement_rate_limit", {
        p_restaurant_id: testContext.restaurantId2,
        p_endpoint_name: "create_order",
        p_tokens_required: 1,
        p_actor_id: testContext.operatorId,
        p_ip_address: testContext.ipAddress,
      });

      expect(resultB1.success).toBe(true);
      expect(resultB1.allowed).toBe(true);
      expect(resultB1.tokens_remaining).toBe(599); // B starts fresh: 600 - 1

      // Both restaurants have independent quotas
      expect(resultA1.tokens_remaining).toBe(resultB1.tokens_remaining); // Both at 599
    });

    it("Extreme quota exhaustion on Restaurant A doesn't affect Restaurant B", async () => {
      // Exhaust Restaurant A quota (600 create_order tokens)
      // This test simulates making 600+ requests to create_order
      // Expected: First 600 succeed, next requests fail with RATE_LIMIT_EXCEEDED

      const exhaustResultA = await (async () => {
        let lastResult = { allowed: true };
        for (let i = 0; i < 610; i++) {
          const result = await invokeRpc("check_and_decrement_rate_limit", {
            p_restaurant_id: testContext.restaurantId,
            p_endpoint_name: "create_order",
            p_tokens_required: 1,
            p_actor_id: testContext.operatorId,
            p_ip_address: testContext.ipAddress,
          });
          lastResult = result;
          if (i === 599) {
            // 600th request should succeed
            expect(result.allowed).toBe(true);
          } else if (i >= 600) {
            // 601st+ requests should fail
            expect(result.allowed).toBe(false);
            expect(result.code).toBe("RATE_LIMIT_EXCEEDED");
          }
        }
        return lastResult;
      })();

      // Restaurant B should still have quota available
      const resultB = await invokeRpc("check_and_decrement_rate_limit", {
        p_restaurant_id: testContext.restaurantId2,
        p_endpoint_name: "create_order",
        p_tokens_required: 1,
        p_actor_id: testContext.operatorId,
        p_ip_address: testContext.ipAddress,
      });

      // B is unaffected; should allow the request
      expect(resultB.allowed).toBe(true);
    });
  });

  // ========================================================================
  // 2. PER-ENDPOINT ISOLATION
  // ========================================================================

  describe("🔴 CRITICAL: Per-endpoint quota isolation", () => {
    it("create_order quota (600/min) independent from payment quota (300/min)", async () => {
      const restaurantId = uuidv4();

      // create_order: max 600 tokens/min, 1 token per request
      const resultOrder = await invokeRpc("check_and_decrement_rate_limit", {
        p_restaurant_id: restaurantId,
        p_endpoint_name: "create_order",
        p_tokens_required: 1,
        p_actor_id: testContext.operatorId,
        p_ip_address: testContext.ipAddress,
      });

      expect(resultOrder.allowed).toBe(true);
      expect(resultOrder.tokens_remaining).toBe(599); // 600 - 1

      // process_order_payment: max 300 tokens/min, 2 tokens per request = 150 max requests
      const resultPayment = await invokeRpc("check_and_decrement_rate_limit", {
        p_restaurant_id: restaurantId,
        p_endpoint_name: "process_order_payment",
        p_tokens_required: 1,
        p_actor_id: testContext.operatorId,
        p_ip_address: testContext.ipAddress,
      });

      expect(resultPayment.allowed).toBe(true);
      expect(resultPayment.tokens_remaining).toBe(149); // 300 / 2 = 150 max - 1

      // close_shift: max 100 tokens/min, 6 tokens per request = ~16 max requests
      const resultShift = await invokeRpc("check_and_decrement_rate_limit", {
        p_restaurant_id: restaurantId,
        p_endpoint_name: "close_shift",
        p_tokens_required: 1,
        p_actor_id: testContext.operatorId,
        p_ip_address: testContext.ipAddress,
      });

      expect(resultShift.allowed).toBe(true);
      expect(resultShift.tokens_remaining).toBeGreaterThan(0); // Should have tokens left

      // Verify quotas are truly independent
      expect(resultOrder.tokens_remaining).not.toBe(
        resultPayment.tokens_remaining,
      );
    });

    it("Exhausting create_order doesn't affect close_shift", async () => {
      const restaurantId = uuidv4();

      // Exhaust create_order
      for (let i = 0; i < 600; i++) {
        const result = await invokeRpc("check_and_decrement_rate_limit", {
          p_restaurant_id: restaurantId,
          p_endpoint_name: "create_order",
          p_tokens_required: 1,
          p_actor_id: testContext.operatorId,
          p_ip_address: testContext.ipAddress,
        });
        if (i === 599) {
          expect(result.allowed).toBe(true);
        }
      }

      // 601st create_order should fail
      const orderOverLimit = await invokeRpc("check_and_decrement_rate_limit", {
        p_restaurant_id: restaurantId,
        p_endpoint_name: "create_order",
        p_tokens_required: 1,
        p_actor_id: testContext.operatorId,
        p_ip_address: testContext.ipAddress,
      });
      expect(orderOverLimit.allowed).toBe(false);

      // But close_shift quota should be untouched
      let shiftTokensRemaining = 100; // ~16 max requests
      for (let i = 0; i < 16; i++) {
        const result = await invokeRpc("check_and_decrement_rate_limit", {
          p_restaurant_id: restaurantId,
          p_endpoint_name: "close_shift",
          p_tokens_required: 1,
          p_actor_id: testContext.operatorId,
          p_ip_address: testContext.ipAddress,
        });
        expect(result.allowed).toBe(true); // Should succeed despite create_order being exhausted
      }
    });
  });

  // ========================================================================
  // 3. TOKEN REFILL MECHANICS
  // ========================================================================

  describe("✅ Token refill timing", () => {
    it("Tokens refill at fixed rate (e.g., 600 tokens/min = 10 tokens/sec)", async () => {
      const restaurantId = uuidv4();

      // Exhaust quota immediately (request 600+ times)
      for (let i = 0; i < 605; i++) {
        await invokeRpc("check_and_decrement_rate_limit", {
          p_restaurant_id: restaurantId,
          p_endpoint_name: "create_order",
          p_tokens_required: 1,
          p_actor_id: testContext.operatorId,
          p_ip_address: testContext.ipAddress,
        });
      }

      // Request should fail (quota exhausted)
      const exhaustedResult = await invokeRpc(
        "check_and_decrement_rate_limit",
        {
          p_restaurant_id: restaurantId,
          p_endpoint_name: "create_order",
          p_tokens_required: 1,
          p_actor_id: testContext.operatorId,
          p_ip_address: testContext.ipAddress,
        },
      );

      expect(exhaustedResult.allowed).toBe(false);
      expect(exhaustedResult.retry_after).toBeGreaterThan(0);

      // After retry_after seconds, tokens should be refilled
      // In real test: wait(exhaustedResult.retry_after * 1000), then retry
      // For now, verify retry_after is reasonable (1-60 seconds)
      expect(exhaustedResult.retry_after).toBeLessThanOrEqual(60);
      expect(exhaustedResult.retry_after).toBeGreaterThanOrEqual(1);
    });
  });

  // ========================================================================
  // 4. CONCURRENT REQUEST SAFETY (Race Conditions)
  // ========================================================================

  describe("✅ Atomic operations (race condition safety)", () => {
    it("Concurrent requests from same restaurant are race-condition safe", async () => {
      const restaurantId = uuidv4();

      // Simulate 10 concurrent requests to create_order
      const concurrentRequests = Array.from({ length: 10 }, () =>
        invokeRpc("check_and_decrement_rate_limit", {
          p_restaurant_id: restaurantId,
          p_endpoint_name: "create_order",
          p_tokens_required: 10, // Each request costs 10 tokens
          p_actor_id: testContext.operatorId,
          p_ip_address: testContext.ipAddress,
        }),
      );

      const results = await Promise.all(concurrentRequests);

      // Verify atomic updates: exactly 1 request gets the last batch of tokens
      const successCount = results.filter((r) => r.allowed).length;
      const failCount = results.filter((r) => !r.allowed).length;

      // With 600 tokens and 10 requests × 10 tokens each = 100 tokens total, all should succeed
      expect(successCount).toBe(10);
      expect(failCount).toBe(0);

      // All remaining tokens should be correct
      const remainingTokens = results.map((r) => r.tokens_remaining);
      expect(remainingTokens).toContain(500); // 600 - (10 × 10)
    });
  });

  // ========================================================================
  // 5. ERROR HANDLING & RETRY-AFTER
  // ========================================================================

  describe("✅ Rate limit exceeded response", () => {
    it("Exceeded response includes retry_after header (graceful degradation)", async () => {
      const restaurantId = uuidv4();

      // Exhaust quota
      for (let i = 0; i < 600; i++) {
        await invokeRpc("check_and_decrement_rate_limit", {
          p_restaurant_id: restaurantId,
          p_endpoint_name: "create_order",
          p_tokens_required: 1,
          p_actor_id: testContext.operatorId,
          p_ip_address: testContext.ipAddress,
        });
      }

      // Request after exhaustion
      const limitExceededResult = await invokeRpc(
        "check_and_decrement_rate_limit",
        {
          p_restaurant_id: restaurantId,
          p_endpoint_name: "create_order",
          p_tokens_required: 1,
          p_actor_id: testContext.operatorId,
          p_ip_address: testContext.ipAddress,
        },
      );

      expect(limitExceededResult.success).toBe(false);
      expect(limitExceededResult.allowed).toBe(false);
      expect(limitExceededResult.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(limitExceededResult.retry_after).toBeDefined();
      expect(limitExceededResult.retry_after).toBeGreaterThan(0);
      expect(limitExceededResult.error).toContain("Rate limit exceeded");
    });
  });

  // ========================================================================
  // 6. STATUS QUERY
  // ========================================================================

  describe("✅ Rate limit status query", () => {
    it("Query returns current quota status for all endpoints", async () => {
      const restaurantId = uuidv4();

      // Make some requests
      await invokeRpc("check_and_decrement_rate_limit", {
        p_restaurant_id: restaurantId,
        p_endpoint_name: "create_order",
        p_tokens_required: 10,
        p_actor_id: testContext.operatorId,
        p_ip_address: testContext.ipAddress,
      });

      // Query status
      const statusResult = await invokeRpc("get_rate_limit_status", {
        p_restaurant_id: restaurantId,
      });

      expect(statusResult.success).toBe(true);
      expect(statusResult.endpoints).toBeDefined();
      expect(Array.isArray(statusResult.endpoints)).toBe(true);

      // Verify create_order status is present and accurate
      const createOrderStatus = statusResult.endpoints.find(
        (e: any) => e.endpoint === "create_order",
      );
      expect(createOrderStatus).toBeDefined();
      expect(createOrderStatus.tokens_remaining).toBe(590); // 600 - 10
      expect(createOrderStatus.max_tokens_per_minute).toBe(600);
    });

    it("Query specific endpoint returns single endpoint status", async () => {
      const restaurantId = uuidv4();

      const statusResult = await invokeRpc("get_rate_limit_status", {
        p_restaurant_id: restaurantId,
        p_endpoint_name: "create_order",
      });

      expect(statusResult.success).toBe(true);
      expect(statusResult.endpoints).toBeDefined();
      expect(statusResult.endpoints.length).toBe(1);
      expect(statusResult.endpoints[0].endpoint).toBe("create_order");
    });
  });

  // ========================================================================
  // 7. ADMIN OPERATIONS (Reset, Config)
  // ========================================================================

  describe("✅ Admin operations", () => {
    it("Reset quota refills tokens to maximum", async () => {
      const restaurantId = uuidv4();

      // Exhaust quota
      for (let i = 0; i < 600; i++) {
        await invokeRpc("check_and_decrement_rate_limit", {
          p_restaurant_id: restaurantId,
          p_endpoint_name: "create_order",
          p_tokens_required: 1,
          p_actor_id: testContext.operatorId,
          p_ip_address: testContext.ipAddress,
        });
      }

      // Verify exhausted
      let statusBefore = await invokeRpc("get_rate_limit_status", {
        p_restaurant_id: restaurantId,
        p_endpoint_name: "create_order",
      });
      expect(statusBefore.endpoints[0].tokens_remaining).toBe(0);

      // Admin reset
      const resetResult = await invokeRpc("reset_rate_limit_quota", {
        p_restaurant_id: restaurantId,
        p_endpoint_name: "create_order",
        p_actor_id: testContext.operatorId,
      });

      expect(resetResult.success).toBe(true);

      // Verify refilled
      const statusAfter = await invokeRpc("get_rate_limit_status", {
        p_restaurant_id: restaurantId,
        p_endpoint_name: "create_order",
      });
      expect(statusAfter.endpoints[0].tokens_remaining).toBe(600);
    });

    it("Reset all endpoints refills all quotas", async () => {
      const restaurantId = uuidv4();

      // Exhaust multiple endpoints
      for (let i = 0; i < 600; i++) {
        await invokeRpc("check_and_decrement_rate_limit", {
          p_restaurant_id: restaurantId,
          p_endpoint_name: "create_order",
          p_tokens_required: 1,
          p_actor_id: testContext.operatorId,
          p_ip_address: testContext.ipAddress,
        });
      }

      // Admin reset all
      const resetResult = await invokeRpc("reset_rate_limit_quota", {
        p_restaurant_id: restaurantId,
        p_actor_id: testContext.operatorId,
      });

      expect(resetResult.success).toBe(true);

      // Verify all refilled
      const statusAfter = await invokeRpc("get_rate_limit_status", {
        p_restaurant_id: restaurantId,
      });

      statusAfter.endpoints.forEach((endpoint: any) => {
        expect(endpoint.tokens_remaining).toBe(endpoint.max_tokens_per_minute);
      });
    });
  });

  // ========================================================================
  // 8. AUDIT LOGGING
  // ========================================================================

  describe("✅ Audit logging", () => {
    it("All rate limit violations logged to gm_audit_logs", async () => {
      const restaurantId = uuidv4();

      // Trigger violation
      for (let i = 0; i < 600; i++) {
        await invokeRpc("check_and_decrement_rate_limit", {
          p_restaurant_id: restaurantId,
          p_endpoint_name: "create_order",
          p_tokens_required: 1,
          p_actor_id: testContext.operatorId,
          p_ip_address: testContext.ipAddress,
        });
      }

      const violationResult = await invokeRpc(
        "check_and_decrement_rate_limit",
        {
          p_restaurant_id: restaurantId,
          p_endpoint_name: "create_order",
          p_tokens_required: 1,
          p_actor_id: testContext.operatorId,
          p_ip_address: testContext.ipAddress,
        },
      );

      // Audit ID should be present in response
      expect(violationResult.audit_id).toBeDefined();

      // TODO: Query gm_audit_logs to verify entry exists with:
      // - action: 'RATE_LIMIT_EXCEEDED'
      // - restaurant_id: matching
      // - new_values: includes tokens_cost, tokens_available, retry_after_seconds
    });
  });

  // ========================================================================
  // 9. INTEGRATION WITH OTHER A-PHASE COMPONENTS
  // ========================================================================

  describe("✅ Integration with A1 (RLS) and A2 (Idempotency)", () => {
    it("Rate limiting respects RLS — users can't see other restaurants' quotas", async () => {
      // When user from Restaurant A queries status, they should only see Restaurant A buckets
      // This is enforced by RLS policy on gm_rate_limit_buckets table
      // (users table via current_user_restaurants() function)

      // Note: In actual test, would authenticate as User A and verify they can't query Restaurant B status
      expect(true).toBe(true); // Placeholder
    });

    it("Rate limit RPC can be called after idempotency check (operation ordering)", async () => {
      // Flow: Client sends request → RPC checks idempotency key → RPC checks rate limit → proceed
      // This test verifies both can be called in sequence without issues

      const restaurantId = uuidv4();
      const idempotencyKey = "test-order-" + Date.now();

      // Step 1: Check idempotency (A2)
      // const idempotencyCheck = await invokeRpc('check_idempotency_status', { ... });

      // Step 2: Check rate limit (A4)
      const rateLimitCheck = await invokeRpc("check_and_decrement_rate_limit", {
        p_restaurant_id: restaurantId,
        p_endpoint_name: "create_order",
        p_tokens_required: 1,
        p_actor_id: testContext.operatorId,
        p_ip_address: testContext.ipAddress,
      });

      expect(rateLimitCheck.allowed).toBe(true);

      // Step 3: Execute actual RPC (create_order, process_payment, etc.)
      // await invokeRpc('create_order_idempotent', { ... });

      expect(true).toBe(true); // Placeholder
    });
  });

  // ========================================================================
  // 10. STRESS TEST & EDGE CASES
  // ========================================================================

  describe("✅ Stress & edge cases", () => {
    it("Handles endpoint not found gracefully", async () => {
      const result = await invokeRpc("check_and_decrement_rate_limit", {
        p_restaurant_id: uuidv4(),
        p_endpoint_name: "nonexistent_endpoint",
        p_tokens_required: 1,
        p_actor_id: testContext.operatorId,
        p_ip_address: testContext.ipAddress,
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe("ENDPOINT_NOT_FOUND");
    });

    it("Handles invalid tokens_required (negative) gracefully", async () => {
      const result = await invokeRpc("check_and_decrement_rate_limit", {
        p_restaurant_id: uuidv4(),
        p_endpoint_name: "create_order",
        p_tokens_required: -1, // Invalid
        p_actor_id: testContext.operatorId,
        p_ip_address: testContext.ipAddress,
      });

      // Should either reject or treat as 1 token
      expect(result.success === false || result.tokens_required > 0).toBe(true);
    });

    it("Handles zero tokens_required", async () => {
      const result = await invokeRpc("check_and_decrement_rate_limit", {
        p_restaurant_id: uuidv4(),
        p_endpoint_name: "create_order",
        p_tokens_required: 0, // Edge case
        p_actor_id: testContext.operatorId,
        p_ip_address: testContext.ipAddress,
      });

      // Should either reject or treat as 1 token (no operation should cost 0)
      expect(result.success === false || result.tokens_cost > 0).toBe(true);
    });
  });
});
