// @ts-nocheck

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface TierConfig {
    name: string;
    thresholdCents: number;
    color: string;
    icon: string;
}

export const LOYALTY_TIERS: Record<LoyaltyTier, TierConfig> = {
    bronze: {
        name: 'Bronze',
        thresholdCents: 0,
        color: '#cd7f32', // Bronze
        icon: '🥉'
    },
    silver: {
        name: 'Silver',
        thresholdCents: 10000, // 100 EUR
        color: '#c0c0c0', // Silver
        icon: '🥈'
    },
    gold: {
        name: 'Gold',
        thresholdCents: 50000, // 500 EUR
        color: '#ffd700', // Gold
        icon: '🥇'
    },
    platinum: {
        name: 'Platinum',
        thresholdCents: 100000, // 1000 EUR
        color: '#e5e4e2', // Platinum
        icon: '👑'
    }
};

export const getCustomerTier = (totalSpendCents: number = 0): TierConfig => {
    if (totalSpendCents >= LOYALTY_TIERS.platinum.thresholdCents) return LOYALTY_TIERS.platinum;
    if (totalSpendCents >= LOYALTY_TIERS.gold.thresholdCents) return LOYALTY_TIERS.gold;
    if (totalSpendCents >= LOYALTY_TIERS.silver.thresholdCents) return LOYALTY_TIERS.silver;
    return LOYALTY_TIERS.bronze;
};

export const getNextTierProgress = (totalSpendCents: number = 0) => {
    const currentTier = getCustomerTier(totalSpendCents);
    let nextTier: TierConfig | null = null;

    if (currentTier.name === 'Bronze') nextTier = LOYALTY_TIERS.silver;
    else if (currentTier.name === 'Silver') nextTier = LOYALTY_TIERS.gold;
    else if (currentTier.name === 'Gold') nextTier = LOYALTY_TIERS.platinum;

    if (!nextTier) return { percent: 100, nextTierName: null, remainingCents: 0 };

    const needed = nextTier.thresholdCents - currentTier.thresholdCents;
    const progress = totalSpendCents - currentTier.thresholdCents;
    const percent = Math.min(100, Math.max(0, (progress / needed) * 100));

    return {
        percent,
        nextTierName: nextTier.name,
        remainingCents: nextTier.thresholdCents - totalSpendCents
    };
};

export interface AICopilotSuggestion {
    type: 'upsell' | 'loyalty_booster' | 'reward';
    message: string;
    actionLabel?: string;
    actionValue?: number; // e.g., cents to spend
}

export const getSmartSuggestion = (totalSpendCents: number = 0): AICopilotSuggestion | null => {
    const tier = getCustomerTier(totalSpendCents);
    const progress = getNextTierProgress(totalSpendCents);

    // 1. Platinum: Treat like Royalty
    if (tier.name === 'Platinum') {
        return {
            type: 'upsell',
            message: '👑 Cliente VIP! Sugira a Carta de Vinhos Premium.',
            actionLabel: 'Ver Vinhos',
        };
    }

    // 2. Loyalty Booster (Close to next tier)
    if (progress.nextTierName && progress.remainingCents > 0 && progress.remainingCents < 1500) { // Less than 15 EUR to go
        const euros = (progress.remainingCents / 100).toFixed(2);
        return {
            type: 'loyalty_booster',
            message: `🥈 Faltam apenas ${euros}€ para nível ${progress.nextTierName}! Sugira uma sobremesa.`,
            actionLabel: 'Sobremesas',
        };
    }

    // 3. Gold: Standard Upsell
    if (tier.name === 'Gold') {
        return {
            type: 'upsell',
            message: '🥇 Sugira um Starter para acompanhar.',
            actionLabel: 'Entradas',
        };
    }

    return null;
};
