/**
 * useTPVShortcuts - Hook para atalhos de teclado e ações rápidas no TPV
 * 
 * P3-3: Keyboard Shortcuts expandidos
 * 
 * Reduz cliques para ações comuns:
 * - Criar novo pedido (Ctrl+N ou Cmd+N)
 * - Adicionar item rápido (digite nome do produto)
 * - Fechar pedido (Ctrl+Enter)
 * - Buscar mesa (Ctrl+F)
 * - Abrir caixa (Ctrl+O)
 * - Fechar caixa (Ctrl+Shift+C)
 * - Pagamento (Ctrl+P)
 * - Cancelar (Esc)
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
            // Ignore shortcuts when typing in inputs
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                // Allow Esc to close modals even when typing
                if (e.key === 'Escape') {
                    // Continue to process Esc
                } else {
                    return;
                }
            }

            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrlKey ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
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
 * P3-3: Expandido com mais atalhos
 */
export function useCommonTPVShortcuts(handlers: {
    onCreateOrder?: () => void;
    onQuickAdd?: () => void;
    onCloseOrder?: () => void;
    onSearchTable?: () => void;
    onOpenCash?: () => void;
    onCloseCash?: () => void;
    onPayment?: () => void;
    onCancel?: () => void;
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

    if (handlers.onOpenCash) {
        shortcuts.push({
            key: 'o',
            ctrlKey: true,
            action: handlers.onOpenCash,
            description: 'Abrir caixa',
        });
    }

    if (handlers.onCloseCash) {
        shortcuts.push({
            key: 'c',
            ctrlKey: true,
            shiftKey: true,
            action: handlers.onCloseCash,
            description: 'Fechar caixa',
        });
    }

    if (handlers.onPayment) {
        shortcuts.push({
            key: 'p',
            ctrlKey: true,
            action: handlers.onPayment,
            description: 'Pagamento',
        });
    }

    if (handlers.onCancel) {
        shortcuts.push({
            key: 'Escape',
            action: handlers.onCancel,
            description: 'Cancelar/Fechar',
        });
    }

    useTPVShortcuts(shortcuts);
}
