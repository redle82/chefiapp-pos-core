export interface FinanceSnapshot {
    date: string;
    totalRevenue: number;
    totalOrders: number;
    averageTicket: number;
    paymentMethods: Record<string, number>;
    hourlySales: Record<string, number>;
    totalCost: number; // New
    grossMargin: number; // New
}

export const FinanceEngine = {
    /**
     * Get a snapshot of finances for a specific date range (default: today).
     */
    async getDailySnapshot(_tenantId: string, _startDate?: Date, _endDate?: Date): Promise<FinanceSnapshot> {
        // PURE DOCKER / DEV_STABLE:
        // Retorna um snapshot financeiro estático para narrativa visual.
        return {
            date: new Date().toISOString().split('T')[0],
            totalRevenue: 15450,
            totalOrders: 42,
            averageTicket: 36.78,
            paymentMethods: { 'credit': 10000, 'cash': 5450 },
            hourlySales: { '12': 5000, '13': 8000, '20': 2450 },
            totalCost: 4500,
            grossMargin: 10950
        };
    },

    /**
     * Get Stripe Financials (Balance & Payouts) via Edge Function
     */
    async getStripeFinancials(_tenantId: string): Promise<{ balance: any, payouts: any[] }> {
        // PURE DOCKER / DEV_STABLE:
        // Placeholder estático para saldos/payouts Stripe.
        return { balance: { available: 500000, pending: 15000, currency: 'eur' }, payouts: [] };
    },

    /**
     * Get Sales Forecast from Analytics Engine
     */
    async getSalesForecast(_tenantId: string): Promise<{ historical: any[], forecast: any[], model: any }> {
        // Placeholder simples de forecast.
        return { historical: [], forecast: [], model: {} };
    },

    /**
     * Get Staff Performance Metrics
     */
    async getStaffPerformance(_tenantId: string, _startDate?: Date, _endDate?: Date): Promise<any[]> {
        // Placeholder simples de ranking de staff.
        return [];
    },

    /**
     * Close the Day (Z-Report)
     * Atomically calculates totals, closes turns, and creates a snapshot.
     */
    async closeDay(_tenantId: string, _countedCash: number, _notes?: string): Promise<{ id: string, gross: number, cash_diff: number }> {
        // Em modo mock, apenas devolve um snapshot sintético.
        return { id: 'mock-z', gross: 15450, cash_diff: 0 };
    },

    /**
     * Get Z-Report details by ID
     */
    async getZReport(_id: string): Promise<any> {
        // Em modo mock, retorna um Z-Report sintético.
        return {
            id: 'mock-z',
            date: new Date().toISOString().split('T')[0],
            total_gross: 15450,
            total_net: 10950,
            cash_diff: 0,
        };
    }
};
