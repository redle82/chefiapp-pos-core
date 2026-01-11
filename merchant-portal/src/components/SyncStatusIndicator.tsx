import React from 'react';
import { useOfflineOrder } from '../pages/TPV/context/OfflineOrderContext';

export const SyncStatusIndicator: React.FC = () => {
    const { isOffline, pendingCount, forceSync, isSyncing } = useOfflineOrder();

    // Styles
    const containerStyle: React.CSSProperties = {
        padding: '8px 12px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: '#1c1c1e', // Dark background default
        border: '1px solid rgba(255,255,255,0.1)',
        cursor: pendingCount > 0 ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
    };

    const dotStyle: React.CSSProperties = {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: isOffline ? '#ff453a' : '#30d158', // Red if offline, Green if online
        boxShadow: isOffline ? '0 0 8px rgba(255, 69, 58, 0.5)' : '0 0 8px rgba(48, 209, 88, 0.5)',
    };

    if (pendingCount > 0) {
        // Pending State
        return (
            <div style={{ ...containerStyle, borderColor: '#ff9f0a', color: '#ff9f0a' }} onClick={!isSyncing ? forceSync : undefined} title={isSyncing ? "Syncing..." : "Click to force sync"}>
                <div style={{ ...dotStyle, backgroundColor: '#ff9f0a', boxShadow: '0 0 8px rgba(255, 159, 10, 0.5)' }} />
                <span>{isSyncing ? 'Syncing...' : `${pendingCount} Pending`}</span>
                {isSyncing && (
                    <span style={{ fontSize: '10px', opacity: 0.7 }}>⏳</span>
                )}
            </div>
        );
    }

    if (isOffline) {
        // Offline State
        return (
            <div style={{ ...containerStyle, borderColor: '#ff453a', color: '#ff453a' }}>
                <div style={dotStyle} />
                <span>OFFLINE</span>
            </div>
        );
    }

    // Online & Synced State
    return (
        <div style={{ ...containerStyle, color: '#30d158' }}>
            <div style={dotStyle} />
            <span style={{ opacity: 0.8 }}>ONLINE</span>
        </div>
    );
};
