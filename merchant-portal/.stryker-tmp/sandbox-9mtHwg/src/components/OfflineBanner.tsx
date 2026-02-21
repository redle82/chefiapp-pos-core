import React from 'react';
import { useOfflineOrder } from '../pages/TPV/context/OfflineOrderContext';
import { colors } from '../ui/design-system/tokens/colors';
import { Text } from '../ui/design-system/primitives/Text';

export const OfflineBanner: React.FC = () => {
    const { isOffline, pendingCount, forceSync, isSyncing } = useOfflineOrder();

    if (!isOffline && pendingCount === 0) return null;

    const isPendingOnly = !isOffline && pendingCount > 0;

    return (
        <div style={{
            backgroundColor: isPendingOnly ? '#ff9f0a' : colors.destructive.base,
            color: '#fff',
            padding: '8px 16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            position: 'sticky',
            top: 0,
            zIndex: 1000, // Above everything
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            fontSize: '14px',
            fontWeight: 600
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isOffline ? (
                    <>
                        <span>⚠️</span>
                        <span>MODO OFFLINE ATIVO</span>
                    </>
                ) : (
                    <>
                        <span>⏳</span>
                        <span>SINCRONIZAÇÃO PENDENTE</span>
                    </>
                )}
            </div>

            <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.3)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Text size="sm" color="white" weight="medium">
                    {pendingCount} ações aguardando sincronização
                </Text>

                {isPendingOnly && (
                    <button
                        onClick={() => !isSyncing && forceSync()}
                        disabled={isSyncing}
                        style={{
                            marginLeft: '8px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 12px',
                            color: '#fff',
                            cursor: isSyncing ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    >
                        {isSyncing ? 'Sincronizando...' : 'Forçar Sync'}
                    </button>
                )}
            </div>
        </div>
    );
};
