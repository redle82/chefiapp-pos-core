/**
 * P4-2: Event Sourcing Service
 * 
 * Serviço para event sourcing parcial de eventos críticos
 */

import { supabase } from '../supabase';
import { Logger } from '../logger';
import { hashChainService } from '../integrity/HashChainService';

export type EventType = 
    | 'order.created'
    | 'order.updated'
    | 'order.paid'
    | 'order.cancelled'
    | 'payment.processed'
    | 'cash_register.opened'
    | 'cash_register.closed'
    | 'inventory.updated'
    | 'menu.updated'
    | 'user.action';

export interface SourcedEvent {
    id: string;
    type: EventType;
    aggregateId: string; // e.g., order_id, payment_id
    payload: Record<string, unknown>;
    metadata: {
        userId?: string;
        restaurantId?: string;
        timestamp: number;
        version: number;
    };
    hash: string;
    createdAt: string;
}

class EventSourcingService {
    /**
     * Store a critical event
     */
    async storeEvent(
        type: EventType,
        aggregateId: string,
        payload: Record<string, unknown>,
        metadata: {
            userId?: string;
            restaurantId?: string;
        }
    ): Promise<SourcedEvent> {
        try {
            // Create hash chain event for integrity
            const hashEvent = await hashChainService.createEvent(type, {
                aggregateId,
                payload,
                ...metadata,
            });

            // Store in database
            const { data, error } = await supabase
                .from('event_store')
                .insert({
                    id: hashEvent.id,
                    type,
                    aggregate_id: aggregateId,
                    payload,
                    metadata: {
                        ...metadata,
                        timestamp: Date.now(),
                        version: 1,
                    },
                    hash: hashEvent.hash,
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                type: data.type as EventType,
                aggregateId: data.aggregate_id,
                payload: data.payload,
                metadata: data.metadata,
                hash: data.hash,
                createdAt: data.created_at,
            };
        } catch (err) {
            Logger.error('Failed to store event', err, { type, aggregateId });
            throw err;
        }
    }

    /**
     * Get events for an aggregate
     */
    async getEventsForAggregate(aggregateId: string): Promise<SourcedEvent[]> {
        try {
            const { data, error } = await supabase
                .from('event_store')
                .select('*')
                .eq('aggregate_id', aggregateId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            return (data || []).map(event => ({
                id: event.id,
                type: event.type as EventType,
                aggregateId: event.aggregate_id,
                payload: event.payload,
                metadata: event.metadata,
                hash: event.hash,
                createdAt: event.created_at,
            }));
        } catch (err) {
            Logger.error('Failed to get events for aggregate', err, { aggregateId });
            return [];
        }
    }

    /**
     * Replay events to rebuild state
     */
    async replayEvents(aggregateId: string, handler: (event: SourcedEvent) => Promise<void>): Promise<void> {
        const events = await this.getEventsForAggregate(aggregateId);
        
        for (const event of events) {
            await handler(event);
        }
    }

    /**
     * Get events by type
     */
    async getEventsByType(type: EventType, limit: number = 100): Promise<SourcedEvent[]> {
        try {
            const { data, error } = await supabase
                .from('event_store')
                .select('*')
                .eq('type', type)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return (data || []).map(event => ({
                id: event.id,
                type: event.type as EventType,
                aggregateId: event.aggregate_id,
                payload: event.payload,
                metadata: event.metadata,
                hash: event.hash,
                createdAt: event.created_at,
            }));
        } catch (err) {
            Logger.error('Failed to get events by type', err, { type });
            return [];
        }
    }
}

export const eventSourcingService = new EventSourcingService();
