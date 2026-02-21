import { useEffect, useCallback } from 'react';

// Standard standard mapping (can be customized)
// Common Bump Bar codes often map to specific keys or Numpad
export const BUMP_BAR_KEYS = {
    // Navigation
    UP: ['ArrowUp', '8'],
    DOWN: ['ArrowDown', '2'],
    LEFT: ['ArrowLeft', '4'],
    RIGHT: ['ArrowRight', '6'],

    // Actions
    SELECT: ['Enter', '5', ' '], // Space is common
    BUMP: ['Enter', '5'],        // Usually same as select or dedicated
    UNDO: ['Backspace', 'Delete', '.'],
    PAGE_NEXT: ['PageDown', '3', '9'],
    PAGE_PREV: ['PageUp', '1', '7'],

    // Numbers for direct selection
    NUM_1: '1',
    NUM_2: '2',
    NUM_3: '3',
    NUM_4: '4',
    NUM_5: '5',
    NUM_6: '6',
    NUM_7: '7',
    NUM_8: '8',
    NUM_9: '9',
    NUM_0: '0',
};

interface UseBumpBarProps {
    onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void;
    onSelect?: () => void;
    onBump?: () => void;
    onUndo?: () => void;
    onPageChange?: (direction: 'next' | 'prev') => void;
    onNumberPress?: (number: number) => void;
    enabled?: boolean;
}

export function useBumpBar({
    onNavigate,
    onSelect,
    onBump,
    onUndo,
    onPageChange,
    onNumberPress,
    enabled = true
}: UseBumpBarProps) {

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        const key = event.key;

        // Prevent default scrolling for arrow keys if handled
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) {
            event.preventDefault();
        }

        if (BUMP_BAR_KEYS.UP.includes(key)) onNavigate?.('up');
        else if (BUMP_BAR_KEYS.DOWN.includes(key)) onNavigate?.('down');
        else if (BUMP_BAR_KEYS.LEFT.includes(key)) onNavigate?.('left');
        else if (BUMP_BAR_KEYS.RIGHT.includes(key)) onNavigate?.('right');

        else if (BUMP_BAR_KEYS.BUMP.includes(key)) onBump?.();
        // Note: SELECT might overlap with BUMP, clarify precedence or context

        else if (BUMP_BAR_KEYS.UNDO.includes(key)) onUndo?.();

        else if (BUMP_BAR_KEYS.PAGE_NEXT.includes(key)) onPageChange?.('next');
        else if (BUMP_BAR_KEYS.PAGE_PREV.includes(key)) onPageChange?.('prev');

        // Number keys
        if (!isNaN(parseInt(key))) {
            onNumberPress?.(parseInt(key));
        }

    }, [enabled, onNavigate, onSelect, onBump, onUndo, onPageChange, onNumberPress]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
