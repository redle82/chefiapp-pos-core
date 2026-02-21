// @ts-nocheck
// 🛡️ FINANCIAL GOVERNANCE RULES
// "Fraude odeia contexto. Erro odeia ritual."

export type VoidReasonCategory = 'production' | 'service' | 'client' | 'system' | 'fraud_prevention';

export interface ValidatedReason {
    id: string;
    category: VoidReasonCategory;
    label: string; // "Cliente desistiu (Demora)"
    requiresManager: boolean; // Does it need a password?
    affectsStock: boolean; // Does the food return to inventory?
}

export const CANCEL_REASONS: ValidatedReason[] = [
    // 🏭 PRODUCTION (Kitchen Fault)
    { id: 'prod_burn', category: 'production', label: 'Erro Cozinha (Queimado/Impróprio)', requiresManager: false, affectsStock: false },
    { id: 'prod_out', category: 'production', label: 'Sem Estoque (Pós-Venda)', requiresManager: true, affectsStock: false },

    // 🤵 SERVICE (Waiter Fault)
    { id: 'serv_wrong', category: 'service', label: 'Erro Lançamento (Garçom)', requiresManager: false, affectsStock: true },
    { id: 'serv_delay', category: 'service', label: 'Cliente Desistiu (Demora)', requiresManager: true, affectsStock: true },

    // 👤 CLIENT (External factor)
    { id: 'cli_change', category: 'client', label: 'Cliente Mudou de Ideia', requiresManager: false, affectsStock: true },
    { id: 'cli_nopay', category: 'client', label: 'Cliente Saiu sem Pagar (Calote)', requiresManager: true, affectsStock: false },

    // 💻 SYSTEM (Technical)
    { id: 'sys_error', category: 'system', label: 'Erro Sistema / Duplicidade', requiresManager: true, affectsStock: true },
    { id: 'test_void', category: 'system', label: 'Teste Operacional', requiresManager: true, affectsStock: true },

    // 🚨 FRAUD PREVENTION (Immune System)
    { id: 'fraud_suspected', category: 'fraud_prevention', label: 'Suspeita de Fraude (Investigação)', requiresManager: true, affectsStock: false }
];

export const getReason = (id: string) => CANCEL_REASONS.find(r => r.id === id);

// 🔒 THE BYPASS RULE
// Any cash-out event above tolerance threshold requires a Witness.
// This is not about trust. It is about shared accountability.
export const requiresWitness = (amountCents: number): boolean => {
    return amountCents > 5000; // €50.00
};
