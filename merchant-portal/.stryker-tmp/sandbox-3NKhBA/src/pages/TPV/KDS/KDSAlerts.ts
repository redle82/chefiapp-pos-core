/**
 * KDS NEW ORDER ALERTS
 * 
 * Handles visual + audio alerts for new orders in the kitchen display.
 * 
 * Features:
 * - Detects new orders by comparing IDs between renders
 * - Plays notification sound (configurable)
 * - Tracks "unread" state per order (clears on interaction or timeout)
 * - Browser notification support (if granted)
 * 
 * @constitutional Critical UX for kitchen operations - reduces human error.
 */
// @ts-nocheck


// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
    // Sound
    SOUND_ENABLED_KEY: 'kds_sound_enabled',
    SOUND_VOLUME: 0.7,

    // Visual
    FLASH_DURATION_MS: 30_000, // 30s before auto-clearing "new" highlight
    PULSE_ANIMATION_DURATION: '1.5s',

    // Storage
    SEEN_ORDERS_KEY: 'kds_seen_orders',
    SEEN_ORDERS_TTL_MS: 24 * 60 * 60 * 1000, // 24h
};

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

import { SoundEngine } from '../../../intelligence/nervous-system/SoundEngine';

/**
 * Initialize audio context (must be called after user interaction)
 */
export async function initAudioContext(): Promise<void> {
    // SoundEngine handles its own initialization lazily or we can add an init method there if needed.
    // For now, SoundEngine.playNewOrder checks context creation safely.
    // We can just log here.
    console.log('[KDSAlert] Audio system ready');
}

/**
 * Play notification sound
 */
export function playNotificationSound(): void {
    if (!isSoundEnabled()) return;

    try {
        SoundEngine.playNewOrder();
    } catch (err) {
        console.warn('[KDSAlert] Sound play failed:', err);
    }
}

import { getTabIsolated, setTabIsolated } from '../../../core/storage/TabIsolatedStorage';

/**
 * Check if sound is enabled
 */
export function isSoundEnabled(): boolean {
    try {
        const stored = getTabIsolated(CONFIG.SOUND_ENABLED_KEY);
        return stored !== 'false'; // Default to true
    } catch {
        return true;
    }
}

/**
 * Toggle sound on/off
 */
export function setSoundEnabled(enabled: boolean): void {
    try {
        setTabIsolated(CONFIG.SOUND_ENABLED_KEY, String(enabled));
    } catch {
        // Ignore
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SEEN ORDERS TRACKING
// ─────────────────────────────────────────────────────────────────────────────

interface SeenOrdersMap {
    [orderId: string]: number; // timestamp when marked as seen
}

/**
 * Load seen orders from storage
 */
function loadSeenOrders(): SeenOrdersMap {
    try {
        const stored = getTabIsolated(CONFIG.SEEN_ORDERS_KEY);
        if (!stored) return {};

        const map: SeenOrdersMap = JSON.parse(stored);
        const now = Date.now();

        // Clean expired entries
        const cleaned: SeenOrdersMap = {};
        for (const [id, ts] of Object.entries(map)) {
            if (now - ts < CONFIG.SEEN_ORDERS_TTL_MS) {
                cleaned[id] = ts;
            }
        }

        return cleaned;
    } catch {
        return {};
    }
}

/**
 * Save seen orders to storage
 */
function saveSeenOrders(map: SeenOrdersMap): void {
    try {
        setTabIsolated(CONFIG.SEEN_ORDERS_KEY, JSON.stringify(map));
    } catch {
        // Ignore
    }
}

/**
 * Mark order as seen
 */
export function markOrderAsSeen(orderId: string): void {
    const map = loadSeenOrders();
    map[orderId] = Date.now();
    saveSeenOrders(map);
}

/**
 * Check if order has been seen
 */
export function isOrderSeen(orderId: string): boolean {
    const map = loadSeenOrders();
    return orderId in map;
}

/**
 * Get set of seen order IDs
 */
export function getSeenOrderIds(): Set<string> {
    return new Set(Object.keys(loadSeenOrders()));
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW ORDER DETECTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect new orders by comparing current vs previous order IDs
 * Returns array of order IDs that are new (not seen before)
 */
export function detectNewOrders(
    currentOrderIds: string[],
    seenOrderIds: Set<string>
): string[] {
    return currentOrderIds.filter(id => !seenOrderIds.has(id));
}

/**
 * Process new orders: play sound, trigger alerts
 */
export function alertNewOrders(newOrderIds: string[]): void {
    if (newOrderIds.length === 0) return;

    console.log('[KDSAlert] 🔔 New orders detected:', newOrderIds.length);

    // Play sound once (not per order)
    playNotificationSound();

    // Browser notification (if supported and granted)
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🍳 Novo Pedido!', {
            body: `${newOrderIds.length} pedido(s) chegaram`,
            icon: '/logo.png',
            tag: 'kds-new-order', // Replace previous notification
            requireInteraction: false
        });
    }
}

/**
 * Request notification permission (call on user interaction)
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS ANIMATIONS (inject once)
// ─────────────────────────────────────────────────────────────────────────────

const KDS_ALERT_STYLES_ID = 'kds-alert-styles';

export function injectKDSAlertStyles(): void {
    if (document.getElementById(KDS_ALERT_STYLES_ID)) return;

    const style = document.createElement('style');
    style.id = KDS_ALERT_STYLES_ID;
    style.textContent = `
        @keyframes kds-pulse-new {
            0%, 100% {
                box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7);
            }
            50% {
                box-shadow: 0 0 20px 10px rgba(251, 191, 36, 0.4);
            }
        }
        
        @keyframes kds-badge-bounce {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.1);
            }
        }
        
        .kds-ticket-new {
            animation: kds-pulse-new ${CONFIG.PULSE_ANIMATION_DURATION} ease-in-out infinite;
        }
        
        .kds-badge-new {
            position: absolute;
            top: -8px;
            right: -8px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            font-size: 11px;
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            animation: kds-badge-bounce 1s ease-in-out infinite;
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.5);
            z-index: 10;
        }
    `;

    document.head.appendChild(style);
}
