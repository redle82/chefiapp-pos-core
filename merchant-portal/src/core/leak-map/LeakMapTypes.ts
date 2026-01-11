export type LeakCategory =
    | 'production_quality'
    | 'purchasing_suppliers'
    | 'inventory_waste'
    | 'portioning_pricing'
    | 'cash_fraud'
    | 'cash_breakage'
    | 'delivery_channels'
    | 'people_ops'
    | 'energy_maintenance'
    | 'hotel_extras'
    | 'management_silent';

export type LeakSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface LeakDefinition {
    id: string; // 'leak-refire-dish'
    category: LeakCategory;
    name: string;
    symptoms: string[];
    root_causes: string[];

    // 🧠 The Reflex (How to catch it)
    signals: string[]; // What metrics to watch?
    daily_ritual?: string; // What to check daily?
    weekly_audit?: string; // What to check weekly?

    owner_role: 'kitchen' | 'manager' | 'owner' | 'bar' | 'maintenance';
    severity: LeakSeverity;

    // ✅ MONEY FIELDS ARE ALWAYS CENTS (Integer)
    estimated_monthly_impact_cents: number;

    // 🔴 Real-Time Tracking (The Pulse)
    realTimeDetectedValue_cents?: number; // Accumulated value detected by Reflexes
    lastDetectedAt?: number;

    // 🛡️ Immune System Stats (Positive Reinforcement)
    prevention_stats?: {
        avoided_instances: number; // "5 panic buys blocked"
        avoided_value_cents: number; // "Saved €500"
    };
}

export const LEAK_FAMILIES: Record<LeakCategory, string> = {
    production_quality: 'Produção & Qualidade',
    purchasing_suppliers: 'Compras & Fornecedores',
    inventory_waste: 'Estoque & Desperdício',
    portioning_pricing: 'Porcionamento & Precificação',
    cash_fraud: 'Caixa & Fraude',
    cash_breakage: 'Quebra de Caixa', // 🪙 The Physical Reality Leak
    delivery_channels: 'Delivery & Canais',
    people_ops: 'Pessoas & Operação',
    energy_maintenance: 'Energia & Manutenção',
    hotel_extras: 'Hotel Extras',
    management_silent: 'Gestão Silenciosa'
};
