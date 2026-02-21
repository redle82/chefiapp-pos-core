/**
 * P6-4: Voice-Activated POS Service
 * 
 * Serviço para POS totalmente controlado por voz
 */
// @ts-nocheck


import { voiceCommandService } from './VoiceCommandService';
import { Logger } from '../logger';

export interface VoiceOrderItem {
    productName: string;
    quantity: number;
    modifications?: string[];
}

export interface VoiceOrder {
    items: VoiceOrderItem[];
    tableNumber?: number;
    notes?: string;
}

class VoiceActivatedPOSService {
    private isActive = false;
    private currentOrder: VoiceOrder = { items: [] };

    /**
     * Initialize voice-activated POS
     */
    initialize(): boolean {
        if (!voiceCommandService.initialize('pt-PT')) {
            return false;
        }

        // Register voice commands for POS
        voiceCommandService.registerCommands([
            {
                pattern: /adicionar (\d+) (.+)/i,
                action: () => this.handleAddItem,
                description: 'Adicionar item ao pedido',
            },
            {
                pattern: /mesa (\d+)/i,
                action: () => this.handleSetTable,
                description: 'Definir número da mesa',
            },
            {
                pattern: /finalizar pedido/i,
                action: () => this.handleCompleteOrder,
                description: 'Finalizar pedido',
            },
            {
                pattern: /cancelar pedido/i,
                action: () => this.handleCancelOrder,
                description: 'Cancelar pedido',
            },
            {
                pattern: /mostrar pedido/i,
                action: () => this.handleShowOrder,
                description: 'Mostrar pedido atual',
            },
        ]);

        return true;
    }

    /**
     * Start voice-activated mode
     */
    start(): boolean {
        if (this.isActive) return true;

        const started = voiceCommandService.startListening();
        if (started) {
            this.isActive = true;
            this.currentOrder = { items: [] };
            Logger.info('Voice-activated POS started');
        }
        return started;
    }

    /**
     * Stop voice-activated mode
     */
    stop(): void {
        voiceCommandService.stopListening();
        this.isActive = false;
        Logger.info('Voice-activated POS stopped');
    }

    /**
     * Handle add item command
     */
    private handleAddItem = (transcript: string) => {
        const match = transcript.match(/adicionar (\d+) (.+)/i);
        if (match) {
            const quantity = parseInt(match[1]);
            const productName = match[2].trim();
            
            this.currentOrder.items.push({
                productName,
                quantity,
            });

            // Provide audio feedback
            this.speak(`Adicionado ${quantity} ${productName}`);
        }
    };

    /**
     * Handle set table command
     */
    private handleSetTable = (transcript: string) => {
        const match = transcript.match(/mesa (\d+)/i);
        if (match) {
            const tableNumber = parseInt(match[1]);
            this.currentOrder.tableNumber = tableNumber;
            this.speak(`Mesa ${tableNumber} definida`);
        }
    };

    /**
     * Handle complete order
     */
    private handleCompleteOrder = () => {
        if (this.currentOrder.items.length === 0) {
            this.speak('Pedido vazio. Adicione itens primeiro.');
            return;
        }

        // Emit event for order creation
        const event = new CustomEvent('voice-order-complete', {
            detail: this.currentOrder,
        });
        window.dispatchEvent(event);

        this.speak('Pedido finalizado com sucesso');
        this.currentOrder = { items: [] };
    };

    /**
     * Handle cancel order
     */
    private handleCancelOrder = () => {
        this.currentOrder = { items: [] };
        this.speak('Pedido cancelado');
    };

    /**
     * Handle show order
     */
    private handleShowOrder = () => {
        if (this.currentOrder.items.length === 0) {
            this.speak('Pedido vazio');
            return;
        }

        const itemsText = this.currentOrder.items
            .map(item => `${item.quantity} ${item.productName}`)
            .join(', ');

        this.speak(`Pedido atual: ${itemsText}`);
    };

    /**
     * Speak text (text-to-speech)
     */
    private speak(text: string): void {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-PT';
            window.speechSynthesis.speak(utterance);
        }
    }

    /**
     * Get current order
     */
    getCurrentOrder(): VoiceOrder {
        return { ...this.currentOrder };
    }

    /**
     * Check if active
     */
    isVoiceActive(): boolean {
        return this.isActive;
    }
}

export const voiceActivatedPOSService = new VoiceActivatedPOSService();
