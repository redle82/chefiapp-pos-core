/**
 * useTPVShortcuts - Hook para atalhos de teclado e ações rápidas no TPV
 * 
 * Reduz cliques para ações comuns:
 * - Criar novo pedido (Ctrl+N ou Cmd+N)
 * - Adicionar item rápido (digite nome do produto)
 * - Fechar pedido (Ctrl+Enter)
 * - Buscar mesa (Ctrl+F)
 */

import { useEffect, useState, useCallback } from 'react';

export interface TPVShortcut {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    action: () => void;
    description: string;
}

export function useTPVShortcuts(shortcuts: TPVShortcut[]) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey : !e.ctrlKey;
                const metaMatch = shortcut.metaKey ? e.metaKey : !e.metaKey;
                const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;
                const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

                if (ctrlMatch && metaMatch && shiftMatch && keyMatch) {
                    e.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}

/**
 * Hook específico para atalhos comuns do TPV
 */
export function useCommonTPVShortcuts(handlers: {
    onCreateOrder?: () => void;
    onQuickAdd?: () => void;
    onCloseOrder?: () => void;
    onSearchTable?: () => void;
}) {
    const shortcuts: TPVShortcut[] = [];

    if (handlers.onCreateOrder) {
        shortcuts.push({
            key: 'n',
            ctrlKey: true,
            action: handlers.onCreateOrder,
            description: 'Criar novo pedido',
        });
    }

    if (handlers.onCloseOrder) {
        shortcuts.push({
            key: 'Enter',
            ctrlKey: true,
            action: handlers.onCloseOrder,
            description: 'Fechar pedido atual',
        });
    }

    if (handlers.onSearchTable) {
        shortcuts.push({
            key: 'f',
            ctrlKey: true,
            action: handlers.onSearchTable,
            description: 'Buscar mesa',
        });
    }

    useTPVShortcuts(shortcuts);
}
