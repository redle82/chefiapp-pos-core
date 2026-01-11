export type CashSessionStatus = 'open' | 'blind_counting' | 'closed' | 'audited';

export interface CashSession {
    id: string; // session_uuid
    workerId: string; // Who owns this wallet?
    terminalId: string; // Where is this happening?

    openedAt: number; // Timestamp
    closedAt?: number;

    openingFloatCents: number; // The "Change" (Fundo de Caixa)

    // The Truths
    computedClosingCents: number; // What the system thinks (Narrative)
    declaredClosingCents?: number; // What the human counted (Physical Reality)

    status: CashSessionStatus;

    // The Immune Response
    divergenceCents?: number; // The Leak (computed - declared)
    notes?: string;
}

export type TransactionType = 'sale' | 'void' | 'refund' | 'payout' | 'payin';

export interface TransactionEvent {
    id: string;
    sessionId: string;
    timestamp: number;

    type: TransactionType;
    amountCents: number; // Positive (money in) or Negative (money out)

    // The Context (Why?)
    orderId?: string;
    reason?: string; // Required for voids/payouts (Protocol H3)

    // The Witness (Who?)
    actorId: string;
    witnessId?: string; // For "Manager Bypass" events
}

export interface BlindCount {
    sessionId: string;
    timestamp: number;

    // The Ritual Input
    bills: Record<string, number>; // "5000": 2 (Two 50 euro notes)
    coins: Record<string, number>; // "100": 5 (Five 1 euro coins)

    totalDeclaredCents: number;
}
