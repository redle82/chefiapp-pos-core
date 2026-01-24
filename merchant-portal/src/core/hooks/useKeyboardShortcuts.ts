import { useEffect } from 'react';

type KeyCombo = string; // e.g., 'ctrl+k', 'meta+k', 'esc'

export function useKeyboardShortcuts(
    shortcuts: Record<KeyCombo, (e: KeyboardEvent) => void>,
    dependencies: any[] = []
) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const { key, ctrlKey, metaKey, altKey, shiftKey } = event;
            const keyLower = key.toLowerCase();

            // Construct combo string
            const parts = [];
            if (ctrlKey) parts.push('ctrl');
            if (metaKey) parts.push('meta'); // cmd on mac/win key
            if (altKey) parts.push('alt');
            if (shiftKey) parts.push('shift');
            if (keyLower !== 'control' && keyLower !== 'meta' && keyLower !== 'alt' && keyLower !== 'shift') {
                parts.push(keyLower);
            }

            const combo = parts.join('+');

            // Check for exact match
            if (shortcuts[combo]) {
                shortcuts[combo](event);
                return;
            }

            // Check for cross-platform 'mod' (ctrl OR meta)
            // e.g. 'mod+k' matches ctrl+k OR meta+k
            const modCombo = combo.replace('ctrl', 'mod').replace('meta', 'mod');
            if (shortcuts[modCombo]) {
                shortcuts[modCombo](event);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, dependencies);
}
