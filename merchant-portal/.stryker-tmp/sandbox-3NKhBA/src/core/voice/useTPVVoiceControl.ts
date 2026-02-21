// @ts-nocheck
import { useEffect, useState } from 'react';
import { useVoiceCommands } from './useVoiceCommands';

// Define TPV action types
export type TPVVoiceAction =
    | { type: 'SELECT_TABLE'; tableId: string }
    | { type: 'TOGGLE_VIEW'; view: 'tables' | 'pos' }
    | { type: 'OPEN_DRAWER' };

interface TPVVoiceControlProps {
    onAction: (action: TPVVoiceAction) => void;
    enabled?: boolean;
}

export function useTPVVoiceControl({ onAction, enabled = true }: TPVVoiceControlProps) {
    const [lastRecognized, setLastRecognized] = useState<string>('');

    // Speak helper
    const speak = (text: string) => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-PT';
            window.speechSynthesis.speak(utterance);
        }
    };

    const commands = [
        {
            pattern: /(?:mesa|table)\s+(\d+)/i, // Matches "Mesa 5", "Table 12"
            description: 'Select a table',
            action: (match: RegExpMatchArray | null | undefined) => { // Updated type signature
                if (match && match[1]) {
                    const tableNum = match[1];
                    setLastRecognized(`Mesa ${tableNum}`);
                    speak(`Mesa ${tableNum}`);
                    onAction({ type: 'SELECT_TABLE', tableId: tableNum });
                }
            }
        },
        {
            pattern: /(?:ver|ir para)\s+(?:mesas|sala)/i,
            description: 'Switch to Table View',
            action: () => {
                setLastRecognized('Ver Mesas');
                speak('Ok');
                onAction({ type: 'TOGGLE_VIEW', view: 'tables' });
            }
        },
        {
            pattern: /(?:abrir|open)\s+(?:caixa|gaveta|cash|drawer)/i,
            description: 'Open Drawer',
            action: () => {
                setLastRecognized('Abrir Caixa');
                speak('Opening Drawer');
                onAction({ type: 'OPEN_DRAWER' });
            }
        }
    ];

    // Use the generic hook
    const voice = useVoiceCommands(commands, enabled);

    return {
        ...voice,
        lastRecognized
    };
}
