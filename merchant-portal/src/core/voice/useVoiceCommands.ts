/**
 * P5-8: Voice Commands Hook
 * 
 * Hook para usar comandos de voz
 */

import { useEffect, useState } from 'react';
import { voiceCommandService, type VoiceCommand } from './VoiceCommandService';

export function useVoiceCommands(commands: VoiceCommand[], enabled: boolean = true) {
    const [isListening, setIsListening] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);

    useEffect(() => {
        // Check if speech recognition is available
        const available = typeof window !== 'undefined' && 
            ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
        setIsAvailable(available);

        if (available) {
            // Initialize
            voiceCommandService.initialize('pt-PT');
            
            // Register commands
            voiceCommandService.registerCommands(commands);

            return () => {
                voiceCommandService.stopListening();
            };
        }
    }, [commands]);

    const startListening = () => {
        if (isAvailable && enabled) {
            const started = voiceCommandService.startListening();
            setIsListening(started);
            return started;
        }
        return false;
    };

    const stopListening = () => {
        voiceCommandService.stopListening();
        setIsListening(false);
    };

    return {
        isAvailable,
        isListening,
        startListening,
        stopListening,
    };
}
