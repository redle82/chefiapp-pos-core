// @ts-nocheck
import type { CashSession, BlindCount, TransactionEvent } from './FinanceTypes';

// 🛡️ FINANCIAL IMMUNOLOGY ENGINE
// "Money in the drawer is physical reality. Sales reports are just a narrative."

export const validateBlindCount = (
    session: CashSession,
    count: BlindCount
): { divergence: number; isLeak: boolean } => {

    // 1. Establish System Truth (Narrative)
    // In a real scenario, this comes from summing TransactionEvents
    const systemExpected = session.computedClosingCents;

    // 2. Establish Physical Truth (Reality)
    const physicalReality = count.totalDeclaredCents;

    // 3. Calculate Divergence (Immunological Truth)
    // Formula: Reality - Narrative
    // If System says 100, Reality says 90, Divergence is -10 (Leak)
    const divergence = physicalReality - systemExpected;

    // 4. Semantic Classification (Protocol H3)
    // Negative = Leak (Money missing)
    // Positive = Surplus (Risk of unrecorded sales)
    const isLeak = divergence < 0;

    return {
        divergence,
        isLeak
    };
};

export const createTransaction = (
    type: TransactionEvent['type'],
    amountCents: number,
    actorId: string,
    reason?: string,
    witnessId?: string
): TransactionEvent => {
    // 🔒 Enforce Protocol H3: Manager Bypass for negative events
    if (['void', 'refund', 'payout'].includes(type)) {
        if (!reason) throw new Error("Financial Protocol Violation: Reason required for money-out events.");
        // In a stricter mode, we would enforce witnessId here too
    }

    return {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: 'current_session_placeholder', // Should be injected
        timestamp: Date.now(),
        type,
        amountCents,
        actorId,
        reason,
        witnessId
    };
};
