export type PulseState = 'satisfied' | 'digesting' | 'orphan' | 'hungry' | 'signaling'

/**
 * Pulse Hook: The autonomic nervous system for Tables.
 * 
 * Rules:
 * - SATISFIED: Interaction < 15m.
 * - DIGESTING: Interaction > 15m.
 * - ORPHAN: Interaction > 35m.
 * 
 * Future:
 * - HUNGRY: Undelivered items > 10m.
 */
export const usePulse = (lastInteractionAt: number | null | undefined): PulseState => {
    if (!lastInteractionAt) return 'orphan' // Unknown state = assumes risk

    const now = Date.now()
    const diffMinutes = (now - lastInteractionAt) / 1000 / 60

    if (diffMinutes < 15) return 'satisfied'
    if (diffMinutes < 35) return 'digesting'
    return 'orphan'
}
