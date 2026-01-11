/**
 * KDS Connection Status Tests
 * 
 * Testes para validar a lógica de conexão do KDS.
 * OBJETIVO: Garantir que o KDS detecta corretamente quando está offline.
 */

import { describe, it, expect } from '@jest/globals';

// ============================================================================
// HELPER FUNCTION (extraída da lógica do KitchenDisplay.tsx)
// ============================================================================

interface ConnectionState {
    isConnected: boolean;  // Network connectivity (navigator.onLine)
    realtimeStatus: string; // Supabase: 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'SUBSCRIBING'
}

/**
 * Determina se o KDS está efetivamente offline.
 * 
 * REGRA: O KDS é considerado "cego" (offline) quando:
 * 1. Não há conexão de rede (isConnected = false), OU
 * 2. O canal realtime não está subscrito (realtimeStatus !== 'SUBSCRIBED')
 * 
 * Isso significa que mesmo com rede, se o Supabase desconectar, 
 * o cozinheiro precisa saber que pode perder pedidos.
 */
function isKDSEffectivelyOffline(state: ConnectionState): boolean {
    const isRealtimeActive = state.realtimeStatus === 'SUBSCRIBED';
    return !state.isConnected || !isRealtimeActive;
}

/**
 * Determina se deve mostrar o banner de offline.
 */
function shouldShowOfflineBanner(state: ConnectionState): boolean {
    return isKDSEffectivelyOffline(state);
}

/**
 * Determina se ações (avançar pedido) devem ser bloqueadas.
 */
function shouldBlockActions(state: ConnectionState): boolean {
    return isKDSEffectivelyOffline(state);
}

// ============================================================================
// TESTS
// ============================================================================

describe('KDS Connection Status', () => {
    describe('isKDSEffectivelyOffline', () => {
        it('should return FALSE when connected and subscribed', () => {
            const state: ConnectionState = {
                isConnected: true,
                realtimeStatus: 'SUBSCRIBED'
            };
            expect(isKDSEffectivelyOffline(state)).toBe(false);
        });

        it('should return TRUE when network offline', () => {
            const state: ConnectionState = {
                isConnected: false,
                realtimeStatus: 'SUBSCRIBED'
            };
            expect(isKDSEffectivelyOffline(state)).toBe(true);
        });

        it('should return TRUE when realtime CLOSED (even with network)', () => {
            const state: ConnectionState = {
                isConnected: true,
                realtimeStatus: 'CLOSED'
            };
            expect(isKDSEffectivelyOffline(state)).toBe(true);
        });

        it('should return TRUE when realtime CHANNEL_ERROR', () => {
            const state: ConnectionState = {
                isConnected: true,
                realtimeStatus: 'CHANNEL_ERROR'
            };
            expect(isKDSEffectivelyOffline(state)).toBe(true);
        });

        it('should return TRUE when realtime TIMED_OUT', () => {
            const state: ConnectionState = {
                isConnected: true,
                realtimeStatus: 'TIMED_OUT'
            };
            expect(isKDSEffectivelyOffline(state)).toBe(true);
        });

        it('should return TRUE when realtime SUBSCRIBING (initial state)', () => {
            const state: ConnectionState = {
                isConnected: true,
                realtimeStatus: 'SUBSCRIBING'
            };
            expect(isKDSEffectivelyOffline(state)).toBe(true);
        });

        it('should return TRUE when both network and realtime offline', () => {
            const state: ConnectionState = {
                isConnected: false,
                realtimeStatus: 'CLOSED'
            };
            expect(isKDSEffectivelyOffline(state)).toBe(true);
        });
    });

    describe('shouldShowOfflineBanner', () => {
        it('should show banner when offline', () => {
            expect(shouldShowOfflineBanner({ isConnected: false, realtimeStatus: 'CLOSED' })).toBe(true);
        });

        it('should NOT show banner when fully connected', () => {
            expect(shouldShowOfflineBanner({ isConnected: true, realtimeStatus: 'SUBSCRIBED' })).toBe(false);
        });
    });

    describe('shouldBlockActions', () => {
        it('should block actions when offline', () => {
            expect(shouldBlockActions({ isConnected: false, realtimeStatus: 'SUBSCRIBED' })).toBe(true);
        });

        it('should block actions when realtime disconnected', () => {
            expect(shouldBlockActions({ isConnected: true, realtimeStatus: 'CHANNEL_ERROR' })).toBe(true);
        });

        it('should NOT block actions when fully connected', () => {
            expect(shouldBlockActions({ isConnected: true, realtimeStatus: 'SUBSCRIBED' })).toBe(false);
        });
    });
});

describe('KDS Reconnection Behavior', () => {
    /**
     * Simula o comportamento de reconexão:
     * - wasDisconnected = true quando desconecta
     * - Na reconexão (SUBSCRIBED), se wasDisconnected era true, faz refetch
     */

    interface ReconnectionState {
        wasDisconnected: boolean;
        currentStatus: string;
        previousStatus: string;
    }

    function shouldRefetchOnStatusChange(state: ReconnectionState): boolean {
        const justReconnected = state.previousStatus !== 'SUBSCRIBED' && state.currentStatus === 'SUBSCRIBED';
        return justReconnected && state.wasDisconnected;
    }

    it('should refetch when reconnecting after disconnect', () => {
        const state: ReconnectionState = {
            wasDisconnected: true,
            previousStatus: 'CLOSED',
            currentStatus: 'SUBSCRIBED'
        };
        expect(shouldRefetchOnStatusChange(state)).toBe(true);
    });

    it('should NOT refetch on initial subscription', () => {
        const state: ReconnectionState = {
            wasDisconnected: false,
            previousStatus: 'SUBSCRIBING',
            currentStatus: 'SUBSCRIBED'
        };
        expect(shouldRefetchOnStatusChange(state)).toBe(false);
    });

    it('should NOT refetch if still disconnected', () => {
        const state: ReconnectionState = {
            wasDisconnected: true,
            previousStatus: 'CLOSED',
            currentStatus: 'CHANNEL_ERROR'
        };
        expect(shouldRefetchOnStatusChange(state)).toBe(false);
    });
});
