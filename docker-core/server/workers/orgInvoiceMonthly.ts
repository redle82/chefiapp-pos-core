import {
  getPreviousMonthPeriod,
  isCurrentMonthPeriod,
} from "../billing/periodUtils";
import {
  runOrgInvoiceWorker,
  type OrgInvoiceWorkerInput,
  type OrgInvoiceWorkerResult,
} from "./orgInvoiceWorker";

export interface OrgInvoiceMonthlyInput {
  periodStart?: string;
  periodEnd?: string;
  referenceDate?: Date;
  runWorker?: (input: OrgInvoiceWorkerInput) => Promise<OrgInvoiceWorkerResult>;
}

export interface OrgInvoiceMonthlyResult {
  blocked: boolean;
  periodStart: string;
  periodEnd: string;
  workerResult: OrgInvoiceWorkerResult | null;
}

export async function runOrgInvoiceMonthly(
  input: OrgInvoiceMonthlyInput = {},
): Promise<OrgInvoiceMonthlyResult> {
  const referenceDate = input.referenceDate ?? new Date();
  const inferred = getPreviousMonthPeriod(referenceDate);
  const periodStart = input.periodStart ?? inferred.periodStart;
  const periodEnd = input.periodEnd ?? inferred.periodEnd;

  if (isCurrentMonthPeriod(periodStart, periodEnd, referenceDate)) {
    console.log(
      JSON.stringify({
        event: "org.invoice.monthly.blocked_current_month",
        periodStart,
        periodEnd,
      }),
    );

    return {
      blocked: true,
      periodStart,
      periodEnd,
      workerResult: null,
    };
  }

  const runner = input.runWorker ?? runOrgInvoiceWorker;
  const workerResult = await runner({ periodStart, periodEnd });

  console.log(
    JSON.stringify({
      event: "org.invoice.monthly.completed",
      periodStart,
      periodEnd,
      summary: {
        scanned: workerResult.scanned,
        processed: workerResult.processed,
        issued: workerResult.issued,
        blocked: workerResult.blocked,
        failed: workerResult.failed,
      },
    }),
  );

  return {
    blocked: false,
    periodStart,
    periodEnd,
    workerResult,
  };
}

async function main(): Promise<void> {
  const result = await runOrgInvoiceMonthly();

  if (result.blocked) {
    process.exitCode = 1;
    return;
  }

  if (result.workerResult && result.workerResult.failed > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      JSON.stringify({
        event: "org.invoice.monthly.crash",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    process.exit(1);
  });
}
