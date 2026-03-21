export type CommissioningTestId =
  | "tpv_order_create"
  | "kds_receive"
  | "order_state_change"
  | "order_handoff"
  | "order_complete"
  | "printer_check"
  | "staff_app_check"
  | "web_channel_check";

export type TestStatus = "pending" | "running" | "passed" | "failed" | "skipped";

export interface CommissioningTest {
  id: CommissioningTestId;
  label: string;
  description: string;
  required: boolean;
  status: TestStatus;
  error?: string;
  durationMs?: number;
}

export interface CommissioningResult {
  tests: CommissioningTest[];
  startedAt: number;
  completedAt?: number;
  overallStatus: "pending" | "running" | "passed" | "failed";
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  totalRequired: number;
  requiredPassed: number;
}
