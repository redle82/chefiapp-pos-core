// @ts-nocheck
export interface MicroLesson {
    id: string;
    triggerContext: 'menu_item' | 'sla_breach' | 'idle' | 'error';
    triggerKey?: string; // e.g., 'Sovereign Cheese'
    title: string;
    content: string; // Max 140 chars
    role: 'kitchen' | 'waiter' | 'all';
    durationSeconds: number; // 30-60s
}

export const LESSON_REPOSITORY: MicroLesson[] = [
    // 🍔 MENU CONTEXT: Void Burger
    {
        id: 'lesson-void-burger-prep',
        triggerContext: 'menu_item',
        triggerKey: 'Void Burger',
        title: 'A Arte do Vazio',
        content: 'O Void Burger é sobre ausência. O prato deve estar IMPECÁVEL. Qualquer mancha quebra a ilusão.',
        role: 'kitchen',
        durationSeconds: 30
    },
    // 🧀 MENU CONTEXT: Sovereign Cheese
    {
        id: 'lesson-sovereign-cheese-melt',
        triggerContext: 'menu_item',
        triggerKey: 'Sovereign Cheese',
        title: 'O Ponto da Bolha',
        content: 'Não apresse o rei. O queijo só está pronto quando a terceira bolha estourar no centro.',
        role: 'kitchen',
        durationSeconds: 45
    },
    // ⏱️ SLA CONTEXT: Late Prep
    {
        id: 'lesson-sla-prep-late',
        triggerContext: 'sla_breach',
        triggerKey: 'kitchen',
        title: 'Recuperando o Tempo',
        content: 'Atrasou? Não corra. Organize a bancada primeiro. O caos gera mais atraso que a pausa.',
        role: 'kitchen',
        durationSeconds: 40
    },
    // 🤵 WAITER CONTEXT: Service
    {
        id: 'lesson-waiter-approach',
        triggerContext: 'idle',
        title: 'A Aproximação Invisível',
        content: 'O copo d\'água deve chegar antes que o cliente peça. Antecipe, não reaja.',
        role: 'waiter',
        durationSeconds: 30
    }
];

export function findRelevantLesson(
    context: MicroLesson['triggerContext'],
    key?: string,
    role?: 'kitchen' | 'waiter' | 'all',
    excludeIds: string[] = []
): MicroLesson | null {
    // 1. Filter by Context & Key
    const candidates = LESSON_REPOSITORY.filter(l =>
        l.triggerContext === context &&
        (!key || l.triggerKey === key) &&
        (!role || l.role === 'all' || l.role === role) &&
        !excludeIds.includes(l.id)
    );

    // 2. Return random if multiple
    if (candidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        return candidates[randomIndex];
    }

    return null;
}
