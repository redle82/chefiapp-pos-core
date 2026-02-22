import axios, { AxiosInstance } from "axios";

interface LoadTestConfig {
  gatewayUrl: string;
  duration: number; // seconds
  targetRps: number; // requests per second
  concurrentConnections: number;
  testCases: string[];
}

interface TestResult {
  testName: string;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  latencies: number[];
  errors: string[];
  startTime: number;
  endTime: number;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
}

/**
 * LoadTestService
 * Comprehensive load testing for payment webhook infrastructure
 */
export class LoadTestService {
  private gateway: AxiosInstance;
  private baseUrl: string;
  private results: TestResult[] = [];
  private restaurantId: string;
  private orderId: string;
  private webhookEventId: string;
  private merchantCode: string;
  private merchantProvider: string;

  constructor(config: LoadTestConfig) {
    this.baseUrl = config.gatewayUrl;
    this.gateway = axios.create({
      baseURL: config.gatewayUrl,
      timeout: 30000,
      validateStatus: () => true, // Don't throw on any status
    });
    this.restaurantId =
      process.env.LOADTEST_RESTAURANT_ID ||
      "550e8400-e29b-41d4-a716-446655440000";
    this.orderId =
      process.env.LOADTEST_ORDER_ID || "660e8400-e29b-41d4-a716-446655440001";
    this.webhookEventId =
      process.env.LOADTEST_WEBHOOK_EVENT_ID ||
      "770e8400-e29b-41d4-a716-446655440002";
    this.merchantCode =
      process.env.LOADTEST_MERCHANT_CODE || "acct_loadtest_merchant_001";
    this.merchantProvider = process.env.LOADTEST_PROVIDER || "stripe";
  }

  /**
   * Execute a test case with controlled rate and concurrency
   */
  async executeTest(
    testName: string,
    requestCount: number,
    requestFactory: () => Promise<any>,
    concurrency: number = 5,
  ): Promise<TestResult> {
    console.log(
      `\n[${testName}] Starting test with ${requestCount} requests...`,
    );

    const result: TestResult = {
      testName,
      totalRequests: requestCount,
      successCount: 0,
      failureCount: 0,
      latencies: [],
      errors: [],
      startTime: Date.now(),
      endTime: 0,
      avgLatency: 0,
      p50Latency: 0,
      p95Latency: 0,
      p99Latency: 0,
    };

    const batch = [];
    for (let i = 0; i < requestCount; i++) {
      batch.push(requestFactory());

      // Execute batch when we reach concurrency limit
      if (batch.length >= concurrency) {
        const batchResults = await Promise.allSettled(batch);
        this.processBatchResults(batchResults, result);
        batch.length = 0;
      }
    }

    // Process remaining requests
    if (batch.length > 0) {
      const batchResults = await Promise.allSettled(batch);
      this.processBatchResults(batchResults, result);
    }

    result.endTime = Date.now();
    this.calculatePercentiles(result);
    this.results.push(result);

    console.log(
      `[${testName}] Complete: ${result.successCount}/${result.totalRequests} success, ` +
        `avg latency: ${result.avgLatency.toFixed(2)}ms`,
    );

    return result;
  }

  /**
   * Test webhook update endpoint under load
   */
  async testPaymentWebhookUpdate(): Promise<TestResult> {
    const requestFactory = async () => {
      const startTime = Date.now();
      try {
        const payload = {
          webhook_event_id: this.webhookEventId,
          payment_status: ["completed", "processing", "failed"][
            Math.floor(Math.random() * 3)
          ],
          payment_amount: Math.floor(Math.random() * 10000) / 100,
        };

        const response = await this.gateway.post(
          "/api/v1/payment/update-from-event",
          payload,
        );
        const latency = Date.now() - startTime;

        return {
          status: response.status,
          latency,
          success: response.status === 200 || response.status === 201,
          error: response.status >= 400 ? response.statusText : null,
        };
      } catch (error: any) {
        return {
          status: 0,
          latency: Date.now() - startTime,
          success: false,
          error: error.message,
        };
      }
    };

    return this.executeTest("Payment Webhook Update", 100, requestFactory, 10);
  }

  /**
   * Test merchant resolution under load
   */
  async testMerchantResolution(): Promise<TestResult> {
    const requestFactory = async () => {
      const startTime = Date.now();
      try {
        const merchantCode = this.merchantCode;
        const provider = this.merchantProvider;

        const response = await this.gateway.get(
          `/api/v1/payment/resolve-merchant/${merchantCode}?provider=${provider}`,
        );
        const latency = Date.now() - startTime;

        return {
          status: response.status,
          latency,
          success: response.status === 200 || response.status === 404,
          error: response.status >= 500 ? response.statusText : null,
        };
      } catch (error: any) {
        return {
          status: 0,
          latency: Date.now() - startTime,
          success: false,
          error: error.message,
        };
      }
    };

    return this.executeTest(
      "Merchant Resolution Lookup",
      50,
      requestFactory,
      8,
    );
  }

  /**
   * Test pending payment queries
   */
  async testPendingPaymentQueries(): Promise<TestResult> {
    const requestFactory = async () => {
      const startTime = Date.now();
      try {
        const restaurantId = this.restaurantId;
        const maxAge = 30 + Math.floor(Math.random() * 120);

        const response = await this.gateway.get(
          `/api/v1/payment/pending/${restaurantId}?maxAgeMinutes=${maxAge}`,
        );
        const latency = Date.now() - startTime;

        return {
          status: response.status,
          latency,
          success: response.status === 200,
          error: response.status >= 400 ? response.statusText : null,
        };
      } catch (error: any) {
        return {
          status: 0,
          latency: Date.now() - startTime,
          success: false,
          error: error.message,
        };
      }
    };

    return this.executeTest("Pending Payment Queries", 50, requestFactory, 5);
  }

  /**
   * Test monitoring endpoints
   */
  async testMonitoringEndpoints(): Promise<TestResult> {
    const endpoints = [
      "/api/v1/monitoring/performance",
      "/api/v1/monitoring/dashboard",
      "/api/v1/monitoring/alerts",
    ];

    const requestFactory = async () => {
      const startTime = Date.now();
      try {
        const endpoint =
          endpoints[Math.floor(Math.random() * endpoints.length)];
        const response = await this.gateway.get(endpoint);
        const latency = Date.now() - startTime;

        return {
          status: response.status,
          latency,
          success: response.status === 200,
          error: response.status >= 400 ? response.statusText : null,
        };
      } catch (error: any) {
        return {
          status: 0,
          latency: Date.now() - startTime,
          success: false,
          error: error.message,
        };
      }
    };

    return this.executeTest("Monitoring Endpoints", 75, requestFactory, 5);
  }

  /**
   * Test link payment to order endpoint
   */
  async testLinkPaymentToOrder(): Promise<TestResult> {
    const requestFactory = async () => {
      const startTime = Date.now();
      try {
        const payload = {
          order_id: this.orderId,
          webhook_event_id: this.webhookEventId,
          payment_status: ["completed", "failed", "pending"][
            Math.floor(Math.random() * 3)
          ],
          payment_amount: Math.floor(Math.random() * 5000) / 100,
        };

        const response = await this.gateway.post(
          "/api/v1/payment/link-order",
          payload,
        );
        const latency = Date.now() - startTime;

        return {
          status: response.status,
          latency,
          success: response.status === 200 || response.status === 201,
          error: response.status >= 400 ? response.statusText : null,
        };
      } catch (error: any) {
        return {
          status: 0,
          latency: Date.now() - startTime,
          success: false,
          error: error.message,
        };
      }
    };

    return this.executeTest("Link Payment to Order", 80, requestFactory, 8);
  }

  /**
   * Run all test suites
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log(
      "\n╔════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║     Payment Infrastructure Load Testing                    ║",
    );
    console.log(
      "╚════════════════════════════════════════════════════════════╝\n",
    );

    await this.testPaymentWebhookUpdate();
    await this.testMerchantResolution();
    await this.testPendingPaymentQueries();
    await this.testMonitoringEndpoints();
    await this.testLinkPaymentToOrder();

    this.printSummary();
    return this.results;
  }

  /**
   * Process a batch of settled promises
   */
  private processBatchResults(
    batchResults: PromiseSettledResult<any>[],
    result: TestResult,
  ) {
    for (const settled of batchResults) {
      if (settled.status === "fulfilled") {
        const test = settled.value;
        if (test.success) {
          result.successCount++;
          result.latencies.push(test.latency);
        } else {
          result.failureCount++;
          if (test.error) {
            result.errors.push(test.error);
          }
        }
      } else {
        result.failureCount++;
        result.errors.push(settled.reason?.message || "Unknown error");
      }
    }
  }

  /**
   * Calculate latency percentiles
   */
  private calculatePercentiles(result: TestResult) {
    if (result.latencies.length === 0) {
      return;
    }

    const sorted = result.latencies.sort((a, b) => a - b);
    result.avgLatency = sorted.reduce((a, b) => a + b, 0) / sorted.length;

    const getPercentile = (percentile: number) => {
      const index = Math.ceil((percentile / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    };

    result.p50Latency = getPercentile(50);
    result.p95Latency = getPercentile(95);
    result.p99Latency = getPercentile(99);
  }

  /**
   * Print summary of all test results
   */
  private printSummary() {
    console.log(
      "\n╔════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                  Load Test Summary Report                  ║",
    );
    console.log(
      "╚════════════════════════════════════════════════════════════╝\n",
    );

    let totalRequests = 0;
    let totalSuccess = 0;
    let allLatencies: number[] = [];

    for (const result of this.results) {
      totalRequests += result.totalRequests;
      totalSuccess += result.successCount;
      allLatencies.push(...result.latencies);

      const successRate = (
        (result.successCount / result.totalRequests) *
        100
      ).toFixed(1);
      console.log(`\n${result.testName}:`);
      console.log(
        `  Success Rate: ${successRate}% (${result.successCount}/${result.totalRequests})`,
      );
      console.log(
        `  Latency - Avg: ${result.avgLatency.toFixed(2)}ms | p50: ${
          result.p50Latency
        }ms | p95: ${result.p95Latency}ms | p99: ${result.p99Latency}ms`,
      );

      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.length} failures recorded`);
      }
    }

    // Overall statistics
    const overallSuccessRate = ((totalSuccess / totalRequests) * 100).toFixed(
      1,
    );
    const allSorted = allLatencies.sort((a, b) => a - b);
    const overallAvg =
      allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length;

    console.log("\n" + "═".repeat(60));
    console.log("OVERALL RESULTS:");
    console.log("═".repeat(60));
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Success Rate: ${overallSuccessRate}%`);
    console.log(`Average Latency: ${overallAvg.toFixed(2)}ms`);
    console.log(
      `P50 Latency: ${allSorted[Math.floor(allSorted.length * 0.5)]}ms`,
    );
    console.log(
      `P95 Latency: ${allSorted[Math.floor(allSorted.length * 0.95)]}ms`,
    );
    console.log(
      `P99 Latency: ${allSorted[Math.floor(allSorted.length * 0.99)]}ms`,
    );
    console.log("═".repeat(60) + "\n");
  }
}

// Export for use in tests
export default LoadTestService;
