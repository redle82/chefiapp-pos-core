import type {
  CommissioningTest,
  CommissioningTestId,
  CommissioningResult,
  TestStatus,
} from "./commissioningTypes";

type TestRunner = () => Promise<{ passed: boolean; error?: string }>;
type ProgressCallback = (result: CommissioningResult) => void;

const DEFAULT_TESTS: CommissioningTest[] = [
  {
    id: "tpv_order_create",
    label: "Criar pedido de teste",
    description: "Cria um pedido de teste no TPV para validar o fluxo completo",
    required: true,
    status: "pending",
  },
  {
    id: "kds_receive",
    label: "Recepção no KDS",
    description: "Verifica se o pedido aparece no ecrã da cozinha",
    required: true,
    status: "pending",
  },
  {
    id: "order_state_change",
    label: "Mudança de estado",
    description: "Valida que o pedido transita correctamente entre estados",
    required: true,
    status: "pending",
  },
  {
    id: "order_handoff",
    label: "Handoff / Expedição",
    description: "Confirma que o pedido chega à fase de expedição",
    required: true,
    status: "pending",
  },
  {
    id: "order_complete",
    label: "Fecho do pedido",
    description: "Verifica que o pedido pode ser marcado como completo",
    required: true,
    status: "pending",
  },
  {
    id: "printer_check",
    label: "Verificação de impressora",
    description: "Testa se a impressora está configurada e acessível",
    required: false,
    status: "pending",
  },
  {
    id: "staff_app_check",
    label: "Staff App conectada",
    description: "Verifica se existe pelo menos um dispositivo staff conectado",
    required: false,
    status: "pending",
  },
  {
    id: "web_channel_check",
    label: "Canal web publicado",
    description: "Verifica se a página pública do restaurante está acessível",
    required: false,
    status: "pending",
  },
];

export class CommissioningEngine {
  private tests: CommissioningTest[];
  private runners: Map<CommissioningTestId, TestRunner> = new Map();
  private retryCounts: Map<CommissioningTestId, number> = new Map();
  private onProgress?: ProgressCallback;
  private startedAt: number = 0;
  private static MAX_RETRIES = 3;

  constructor(onProgress?: ProgressCallback) {
    this.tests = DEFAULT_TESTS.map((t) => ({ ...t }));
    this.onProgress = onProgress;
  }

  registerRunner(testId: CommissioningTestId, runner: TestRunner): void {
    this.runners.set(testId, runner);
  }

  private updateTest(
    id: CommissioningTestId,
    updates: Partial<CommissioningTest>
  ): void {
    const idx = this.tests.findIndex((t) => t.id === id);
    if (idx >= 0) {
      this.tests[idx] = { ...this.tests[idx], ...updates };
    }
    this.emitProgress();
  }

  private emitProgress(): void {
    if (this.onProgress) {
      this.onProgress(this.getResult());
    }
  }

  getResult(): CommissioningResult {
    const passed = this.tests.filter((t) => t.status === "passed");
    const failed = this.tests.filter((t) => t.status === "failed");
    const skipped = this.tests.filter((t) => t.status === "skipped");
    const required = this.tests.filter((t) => t.required);
    const requiredPassed = required.filter((t) => t.status === "passed");

    const hasRunning = this.tests.some((t) => t.status === "running");
    const hasPending = this.tests.some((t) => t.status === "pending");
    const allRequiredPassed = required.every(
      (t) => t.status === "passed" || t.status === "skipped"
    );

    let overallStatus: CommissioningResult["overallStatus"] = "pending";
    if (hasRunning) overallStatus = "running";
    else if (!hasPending && !hasRunning) {
      overallStatus = allRequiredPassed ? "passed" : "failed";
    }

    return {
      tests: [...this.tests],
      startedAt: this.startedAt,
      completedAt: overallStatus === "passed" || overallStatus === "failed" ? Date.now() : undefined,
      overallStatus,
      passedCount: passed.length,
      failedCount: failed.length,
      skippedCount: skipped.length,
      totalRequired: required.length,
      requiredPassed: requiredPassed.length,
    };
  }

  async runAll(): Promise<CommissioningResult> {
    this.startedAt = Date.now();
    this.emitProgress();

    for (const test of this.tests) {
      const runner = this.runners.get(test.id);

      if (!runner) {
        this.updateTest(test.id, { status: "skipped" });
        continue;
      }

      this.updateTest(test.id, { status: "running" });
      const testStart = Date.now();

      try {
        const result = await runner();
        const durationMs = Date.now() - testStart;

        if (result.passed) {
          this.updateTest(test.id, { status: "passed", durationMs });
        } else {
          this.updateTest(test.id, {
            status: "failed",
            error: result.error ?? "Test failed",
            durationMs,
          });

          // If a required test fails, skip remaining required tests
          if (test.required) {
            for (const remaining of this.tests) {
              if (remaining.status === "pending" && remaining.required) {
                this.updateTest(remaining.id, {
                  status: "skipped",
                  error: `Skipped: prerequisite "${test.label}" failed`,
                });
              }
            }
            break;
          }
        }
      } catch (err) {
        const durationMs = Date.now() - testStart;
        this.updateTest(test.id, {
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
          durationMs,
        });

        if (test.required) break;
      }
    }

    // Mark remaining pending optional tests as skipped
    for (const test of this.tests) {
      if (test.status === "pending") {
        this.updateTest(test.id, { status: "skipped" });
      }
    }

    return this.getResult();
  }

  async runSingle(testId: CommissioningTestId): Promise<CommissioningTest> {
    const runner = this.runners.get(testId);
    if (!runner) {
      this.updateTest(testId, { status: "skipped", error: "No runner registered" });
      return this.tests.find((t) => t.id === testId)!;
    }

    this.updateTest(testId, { status: "running" });
    const testStart = Date.now();

    try {
      const result = await runner();
      const durationMs = Date.now() - testStart;
      const status: TestStatus = result.passed ? "passed" : "failed";
      this.updateTest(testId, { status, durationMs, error: result.error });
    } catch (err) {
      const durationMs = Date.now() - testStart;
      this.updateTest(testId, {
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
        durationMs,
      });
    }

    return this.tests.find((t) => t.id === testId)!;
  }

  async retryFailed(): Promise<CommissioningResult> {
    const failedTests = this.tests.filter((t) => t.status === "failed");

    for (const test of failedTests) {
      const retryCount = this.retryCounts.get(test.id) ?? 0;
      if (retryCount >= CommissioningEngine.MAX_RETRIES) {
        continue; // Max retries reached
      }

      this.retryCounts.set(test.id, retryCount + 1);
      await this.runSingle(test.id);
    }

    return this.getResult();
  }

  reset(): void {
    this.tests = DEFAULT_TESTS.map((t) => ({ ...t }));
    this.retryCounts.clear();
    this.startedAt = 0;
    this.emitProgress();
  }
}
