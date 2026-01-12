/**
 * P5-8: Voice Command Service
 * 
 * Serviço para comandos de voz usando Web Speech API
 */

export type VoiceCommand = {
    pattern: string | RegExp;
    action: () => void | Promise<void>;
    description: string;
};

class VoiceCommandService {
    private recognition: SpeechRecognition | null = null;
    private commands: VoiceCommand[] = [];
    private isListening = false;
    private language = 'pt-PT';

    constructor() {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            // @ts-ignore - webkitSpeechRecognition is not in types
            this.recognition = new webkitSpeechRecognition();
        } else if (typeof window !== 'undefined' && 'SpeechRecognition' in window) {
            this.recognition = new (window as any).SpeechRecognition();
        }
    }

    /**
     * Initialize voice recognition
     */
    initialize(language: string = 'pt-PT'): boolean {
        if (!this.recognition) {
            console.warn('[VoiceCommandService] Speech recognition not available');
            return false;
        }

        this.language = language;
        this.recognition.lang = language;
        this.recognition.continuous = true;
        this.recognition.interimResults = false;

        this.recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            this.processCommand(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('[VoiceCommandService] Error:', event.error);
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                // Restart if still listening
                this.recognition?.start();
            }
        };

        return true;
    }

    /**
     * Register a voice command
     */
    registerCommand(command: VoiceCommand): void {
        this.commands.push(command);
    }

    /**
     * Register multiple commands
     */
    registerCommands(commands: VoiceCommand[]): void {
        this.commands.push(...commands);
    }

    /**
     * Process a voice command
     */
    private processCommand(transcript: string): void {
        for (const command of this.commands) {
            let matches = false;

            if (typeof command.pattern === 'string') {
                matches = transcript.includes(command.pattern.toLowerCase());
            } else {
                matches = command.pattern.test(transcript);
            }

            if (matches) {
                console.log(`[VoiceCommandService] Matched: "${transcript}" -> ${command.description}`);
                try {
                    const result = command.action();
                    if (result instanceof Promise) {
                        result.catch(err => console.error('[VoiceCommandService] Action error:', err));
                    }
                } catch (err) {
                    console.error('[VoiceCommandService] Action error:', err);
                }
                break;
            }
        }
    }

    /**
     * Start listening
     */
    startListening(): boolean {
        if (!this.recognition) {
            return false;
        }

        if (this.isListening) {
            return true;
        }

        try {
            this.recognition.start();
            this.isListening = true;
            return true;
        } catch (err) {
            console.error('[VoiceCommandService] Failed to start:', err);
            return false;
        }
    }

    /**
     * Stop listening
     */
    stopListening(): void {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    /**
     * Check if listening
     */
    getListening(): boolean {
        return this.isListening;
    }

    /**
     * Set language
     */
    setLanguage(language: string): void {
        this.language = language;
        if (this.recognition) {
            this.recognition.lang = language;
        }
    }

    /**
     * Get available languages
     */
    getAvailableLanguages(): string[] {
        return ['pt-PT', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT'];
    }
}

export const voiceCommandService = new VoiceCommandService();
