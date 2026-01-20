
export type TableHealth = 'happy' | 'bored' | 'angry' | 'pulsing';

export interface TableWithHealth {
    status: 'free' | 'occupied' | 'reserved';
    health: TableHealth;
    lastActivity: Date;
    waitMinutes: number;
    nextAction?: string;
}

export const getTableHealth = (
    status: 'free' | 'occupied' | 'reserved',
    lastOrderTime: Date | null,
    seatedTime: Date | null,
    hasPendingRequest: boolean = false
): TableHealth => {
    if (status === 'free') return 'happy';
    if (hasPendingRequest) return 'pulsing';

    const now = new Date();
    const relevantTime = lastOrderTime || seatedTime || now;
    const diffMinutes = (now.getTime() - relevantTime.getTime()) / 60000;

    // Logic:
    // < 15 min: Happy (Green)
    // 15-30 min: Bored (Yellow) -> Needs attention soon
    // > 30 min: Angry (Red) -> Risk of bad review or churn

    if (diffMinutes > 30) return 'angry';
    if (diffMinutes > 15) return 'bored';

    return 'happy';
};

export const getHealthColor = (health: TableHealth, themeColors: any): string => {
    switch (health) {
        case 'angry': return themeColors.critical.base;
        case 'bored': return themeColors.warning.base;
        case 'pulsing': return themeColors.action.base; // Will have animation
        case 'happy':
        default: return themeColors.success.base;
    }
};

export const getHealthMessage = (health: TableHealth, waitMinutes: number): string => {
    if (health === 'pulsing') return '⚠️ Chamando!';
    if (health === 'angry') return `⏳ ${Math.floor(waitMinutes)}m sem pedido`;
    if (health === 'bored') return `⚠️ Atenção sugerida`;
    return '👍 Tudo certo';
};
