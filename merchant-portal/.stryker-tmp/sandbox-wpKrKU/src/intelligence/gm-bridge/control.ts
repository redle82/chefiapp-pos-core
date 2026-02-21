import type { GMCommand, GMCommandType } from './types';

/**
 * Control Bridge
 * 
 * Listens for administrative commands from the Owner Dashboard.
 * In a real implementation, this subscribes to a secure Supabase Broadcast channel.
 */

type CommandHandler = (command: GMCommand) => void;

export class GMControlBridge {
    private static instance: GMControlBridge;
    private handlers: Map<GMCommandType, CommandHandler[]> = new Map();

    private constructor() {
        // Mock listener for commands
        // In production: supabase.channel('gm-control').on(...)
    }

    public static getInstance(): GMControlBridge {
        if (!GMControlBridge.instance) {
            GMControlBridge.instance = new GMControlBridge();
        }
        return GMControlBridge.instance;
    }

    public on(type: GMCommandType, handler: CommandHandler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type)?.push(handler);
    }

    /**
     * Simulator for receiving a command (Dev Mode)
     */
    public __simulateCommand(command: GMCommand) {
        const handlers = this.handlers.get(command.type) || [];
        handlers.forEach(h => h(command));

        if (import.meta.env.DEV) {
            console.log(`[GM-BRIDGE] 📥 Received Command: ${command.type}`, command);
        }
    }
}

export const Control = GMControlBridge.getInstance();
