/**
 * P5-8: Voice Command Service
 * 
 * Serviço para comandos de voz usando Web Speech API
 */

export type VoiceCommand = {
    pattern: string | RegExp;
    action: (match?: RegExpMatchArray | null) => void | Promise<void>;
    description: string;
};

export class VoiceCommandService {
    private recognition: SpeechRecognition | null = null;
    private isListening: boolean = false;
    private commands: VoiceCommand[] = [];
    private language: string = 'pt-PT';
    private wakeWord: string | undefined;

    constructor() {
        if (typeof window !== 'undefined') {
            const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognitionAPI) {
                this.recognition = new SpeechRecognitionAPI();
                this.recognition.continuous = true;
                this.recognition.interimResults = false;
                this.recognition.lang = this.language;

                this.recognition.onresult = (event: SpeechRecognitionEvent) => {
                    const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
                    console.log(`[VoiceCommandService] Heard: "${transcript}"`);
                    this.processCommand(transcript);
                };

                this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                    console.error('[VoiceCommandService] Error:', event.error);
                    if (event.error === 'not-allowed') {
                        this.isListening = false;
                    }
                };

                this.recognition.onend = () => {
                    if (this.isListening) {
                        // Restart if still supposed to be listening
                        try {
                            this.recognition?.start();
                        } catch (e) {
                            console.warn('[VoiceCommandService] Restart failed:', e);
                        }
                    }
                };
            }
        }
    }

    /**
     * Register commands
     */
    registerCommands(commands: VoiceCommand[]): void {
        this.commands = commands;
    }

    /**
     * Process a voice command
     */
    private processCommand(transcript: string): void {
        let commandText = transcript;

        // Verify Wake Word if configured
        if (this.wakeWord) {
            const wakeWordLower = this.wakeWord.toLowerCase();
            if (transcript.startsWith(wakeWordLower)) {
                // Strip wake word
                commandText = transcript.slice(wakeWordLower.length).trim();
                console.log(`[VoiceCommandService] Wake Word detected. Command: "${commandText}"`);
            } else {
                console.log(`[VoiceCommandService] Ignored (No Wake Word): "${transcript}"`);
                return;
            }
        }

        for (const command of this.commands) {
            let matches = false;
            let matchResult: RegExpMatchArray | null = null;

            if (typeof command.pattern === 'string') {
                matches = commandText.includes(command.pattern.toLowerCase());
            } else {
                matchResult = commandText.match(command.pattern);
                matches = !!matchResult;
            }

            if (matches) {
                console.log(`[VoiceCommandService] Matched: "${commandText}" -> ${command.description}`);
                try {
                    const result = command.action(matchResult);
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
     * Get available languages
     */
    getAvailableLanguages(): string[] {
        return ['pt-PT', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT'];
    }

    /**
     * Set Wake Word
     */
    setWakeWord(word: string | undefined): void {
        this.wakeWord = word;
        console.log(`[VoiceCommandService] Wake Word set to: "${word}"`);
    }
}

export const voiceCommandService = new VoiceCommandService();
