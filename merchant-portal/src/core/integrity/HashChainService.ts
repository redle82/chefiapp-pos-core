/**
 * P4-1: Hash Chain Service
 * 
 * Serviço para verificação de integridade usando hash chain
 */

import { Logger } from '../logger/Logger';

export interface HashChainEvent {
    id: string;
    type: string;
    payload: Record<string, unknown>;
    previousHash: string | null;
    hash: string;
    timestamp: number;
}

class HashChainService {
    private events: Map<string, HashChainEvent> = new Map();
    private lastHash: string | null = null;

    /**
     * Generate hash for data
     */
    private async generateHash(data: string): Promise<string> {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Create a new event in the hash chain
     */
    async createEvent(type: string, payload: Record<string, unknown>): Promise<HashChainEvent> {
        try {
            const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const timestamp = Date.now();
            
            // Build data string for hashing
            const dataString = JSON.stringify({
                id,
                type,
                payload,
                previousHash: this.lastHash,
                timestamp,
            });

            // Generate hash
            const hash = await this.generateHash(dataString);

            const event: HashChainEvent = {
                id,
                type,
                payload,
                previousHash: this.lastHash,
                hash,
                timestamp,
            };

            // Store event
            this.events.set(id, event);
            this.lastHash = hash;

            return event;
        } catch (err) {
            Logger.error('Failed to create hash chain event', err, { type, payload });
            throw err;
        }
    }

    /**
     * Verify integrity of the hash chain
     */
    async verifyIntegrity(): Promise<{
        isValid: boolean;
        invalidEvents: string[];
        errors: string[];
    }> {
        const invalidEvents: string[] = [];
        const errors: string[] = [];
        let previousHash: string | null = null;

        for (const [id, event] of this.events.entries()) {
            // Rebuild data string
            const dataString = JSON.stringify({
                id: event.id,
                type: event.type,
                payload: event.payload,
                previousHash: event.previousHash,
                timestamp: event.timestamp,
            });

            // Regenerate hash
            const expectedHash = await this.generateHash(dataString);

            // Check if hash matches
            if (event.hash !== expectedHash) {
                invalidEvents.push(id);
                errors.push(`Event ${id}: Hash mismatch`);
            }

            // Check if previous hash matches
            if (event.previousHash !== previousHash) {
                invalidEvents.push(id);
                errors.push(`Event ${id}: Previous hash mismatch`);
            }

            previousHash = event.hash;
        }

        return {
            isValid: invalidEvents.length === 0,
            invalidEvents,
            errors,
        };
    }

    /**
     * Get all events
     */
    getEvents(): HashChainEvent[] {
        return Array.from(this.events.values()).sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * Get event by ID
     */
    getEvent(id: string): HashChainEvent | undefined {
        return this.events.get(id);
    }

    /**
     * Get last hash
     */
    getLastHash(): string | null {
        return this.lastHash;
    }

    /**
     * Clear all events (for testing)
     */
    clear(): void {
        this.events.clear();
        this.lastHash = null;
    }
}

export const hashChainService = new HashChainService();
