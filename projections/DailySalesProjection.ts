import { CoreEvent } from "../event-log/types";
import { Projection } from "./types";

export interface ReadDailySales {
    date: string; // YYYY-MM-DD
    totalSalesCents: number;
    transactionCount: number;
    paymentMethods: Record<string, number>; // e.g. { "CREDIT": 1000, "PIX": 500 }
}

/**
 * DailySalesProjection
 * 
 * Aggregates FINANCIAL FACTS (PAYMENT_CONFIRMED) into a daily report.
 * Ignores Orders, looks only at Money.
 */
export class DailySalesProjection implements Projection {
    readonly projectionName = "daily_sales_v1";

    private storage: Map<string, ReadDailySales> = new Map();

    async handle(event: CoreEvent): Promise<void> {
        if (event.type !== "PAYMENT_CONFIRMED") return;

        const payload = event.payload;
        const paidAt = new Date(event.occurred_at);
        const dateKey = paidAt.toISOString().split('T')[0]; // YYYY-MM-DD

        let report = this.storage.get(dateKey);
        if (!report) {
            report = {
                date: dateKey,
                totalSalesCents: 0,
                transactionCount: 0,
                paymentMethods: {}
            };
        }

        const amount = payload.amount_cents;
        const method = payload.method; // e.g. "CREDIT_CARD", "PIX"

        report.totalSalesCents += amount;
        report.transactionCount += 1;

        // Aggregate by method
        if (!report.paymentMethods[method]) {
            report.paymentMethods[method] = 0;
        }
        report.paymentMethods[method] += amount;

        this.storage.set(dateKey, report);
    }

    async reset(): Promise<void> {
        this.storage.clear();
    }

    async getReport(date: string): Promise<ReadDailySales | undefined> {
        return this.storage.get(date);
    }
}
