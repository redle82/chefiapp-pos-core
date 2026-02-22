#!/usr/bin/env node

/**
 * Day 6 Phase 3: Load Testing Runner
 * Execute comprehensive load tests for payment webhook infrastructure
 */

import fs from "fs";
import path from "path";
import LoadTestService from "./services/load-test";

// Configuration
const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:4320";
const OUTPUT_DIR = path.join(process.cwd(), "load-test-results");
const LOADTEST_RESTAURANT_ID =
  process.env.LOADTEST_RESTAURANT_ID || "550e8400-e29b-41d4-a716-446655440000";
const LOADTEST_ORDER_ID =
  process.env.LOADTEST_ORDER_ID || "660e8400-e29b-41d4-a716-446655440001";
const LOADTEST_WEBHOOK_EVENT_ID =
  process.env.LOADTEST_WEBHOOK_EVENT_ID ||
  "770e8400-e29b-41d4-a716-446655440002";

async function main() {
  console.log(
    "\n╔════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║   Day 6 Phase 3: Payment Infrastructure Load Testing        ║",
  );
  console.log("║   Webhook Payload Processing & Stress Testing              ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n",
  );

  console.log(`Gateway URL: ${GATEWAY_URL}`);
  console.log(`Fixture restaurant: ${LOADTEST_RESTAURANT_ID}`);
  console.log(`Fixture order: ${LOADTEST_ORDER_ID}`);
  console.log(`Fixture webhook event: ${LOADTEST_WEBHOOK_EVENT_ID}`);
  console.log(`Results will be saved to: ${OUTPUT_DIR}\n`);

  // Verify gateway is running
  try {
    const response = await fetch(`${GATEWAY_URL}/health`);
    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}`);
    }
    console.log("✓ Gateway is running and responding\n");
  } catch (error: any) {
    console.error(`✗ Cannot reach gateway at ${GATEWAY_URL}`);
    console.error(`  Error: ${error.message}`);
    process.exit(1);
  }

  // Create results directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Initialize load test service
  const loadTest = new LoadTestService({
    gatewayUrl: GATEWAY_URL,
    duration: 300, // 5 minutes
    targetRps: 5, // 5 requests per second
    concurrentConnections: 10,
    testCases: [
      "payment-update",
      "merchant-resolution",
      "pending-queries",
      "monitoring",
      "link-order",
    ],
  });

  // Run tests
  try {
    const results = await loadTest.runAllTests();

    // Save detailed results to JSON
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const resultsFile = path.join(OUTPUT_DIR, `load-test-${timestamp}.json`);

    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n✓ Results saved to: ${resultsFile}`);

    // Summary
    process.exit(0);
  } catch (error) {
    console.error("\n✗ Load testing failed:");
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default main;
