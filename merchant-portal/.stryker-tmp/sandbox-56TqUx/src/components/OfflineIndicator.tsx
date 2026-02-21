/**
 * OfflineIndicator - Indicador visual de status offline
 * 
 * Mostra quando está offline e quantos pedidos estão pendentes de sync
 */
// @ts-nocheck


import { useOrders } from '../pages/TPV/context/OrderContextReal';

export function OfflineIndicator() {
    const { isOffline, pendingSync, syncNow, isConnected } = useOrders();

    // Não mostrar se está online e sem pending
    if (isConnected && pendingSync === 0) {
        return null;
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 16,
                left: 16,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 8,
                backgroundColor: isOffline ? '#ef4444' : '#f59e0b',
                color: 'white',
                fontSize: 14,
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
        >
            {/* Status dot */}
            <span
                style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: isOffline ? '#fca5a5' : '#fcd34d',
                    animation: isOffline ? 'pulse 1.5s infinite' : 'none',
                }}
            />

            {/* Text */}
            {isOffline ? (
                <span>📴 Offline {pendingSync > 0 && `(${pendingSync} pendente${pendingSync > 1 ? 's' : ''})`}</span>
            ) : (
                <span>⏳ Sincronizando... ({pendingSync})</span>
            )}

            {/* Sync button (only when online with pending) */}
            {!isOffline && pendingSync > 0 && (
                <button
                    onClick={() => syncNow()}
                    style={{
                        marginLeft: 8,
                        padding: '4px 8px',
                        borderRadius: 4,
                        border: 'none',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: 12,
                    }}
                >
                    🔄 Sync
                </button>
            )}

            {/* Pulse animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}

/**
 * OfflineBadge - Badge compacto para usar em headers
 */
export function OfflineBadge() {
    const { isOffline, pendingSync } = useOrders();

    if (!isOffline && pendingSync === 0) {
        return null;
    }

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 12,
                backgroundColor: isOffline ? '#fee2e2' : '#fef3c7',
                color: isOffline ? '#dc2626' : '#d97706',
                fontSize: 12,
                fontWeight: 500,
            }}
        >
            {isOffline ? '📴' : '⏳'}
            {pendingSync > 0 && <span>{pendingSync}</span>}
        </span>
    );
}
