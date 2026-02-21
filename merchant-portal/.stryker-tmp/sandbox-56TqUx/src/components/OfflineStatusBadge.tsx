/**
 * OfflineStatusBadge - Indicador visual de status offline
 * 
 * Mostra:
 * - "Offline" quando está offline
 * - "Sincronizando..." quando está sincronizando
 * - "X pedidos pendentes" quando há pedidos na fila
 * - "Online" quando está online e sincronizado
 */
// @ts-nocheck


import React from 'react';
import { useOfflineOrder } from '../pages/TPV/context/OfflineOrderContext';

interface OfflineStatusBadgeProps {
    className?: string;
}

export const OfflineStatusBadge: React.FC<OfflineStatusBadgeProps> = ({ className = '' }) => {
    const { isOffline, isSyncing, pendingCount } = useOfflineOrder();

    // Não mostrar se está online e não há pendências
    if (!isOffline && !isSyncing && pendingCount === 0) {
        return null;
    }

    // Determinar cor e texto baseado no estado
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-700';
    let icon = '📡';
    let text = '';

    if (isOffline) {
        bgColor = 'bg-red-100';
        textColor = 'text-red-700';
        icon = '🔴';
        text = pendingCount > 0 
            ? `Offline - ${pendingCount} pedido${pendingCount > 1 ? 's' : ''} pendente${pendingCount > 1 ? 's' : ''}`
            : 'Offline';
    } else if (isSyncing) {
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-700';
        icon = '⏳';
        text = 'Sincronizando...';
    } else if (pendingCount > 0) {
        bgColor = 'bg-orange-100';
        textColor = 'text-orange-700';
        icon = '⏸️';
        text = `${pendingCount} pedido${pendingCount > 1 ? 's' : ''} pendente${pendingCount > 1 ? 's' : ''}`;
    } else {
        bgColor = 'bg-green-100';
        textColor = 'text-green-700';
        icon = '✅';
        text = 'Online';
    }

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${bgColor} ${textColor} ${className}`}>
            <span className="text-base">{icon}</span>
            <span>{text}</span>
            {isSyncing && (
                <svg 
                    className="animate-spin h-4 w-4" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                >
                    <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                    />
                    <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
        </div>
    );
};
