// @ts-nocheck
import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { EventEnvelope } from './SealTypes';

// 🏛️ THE VAULT
const DB_NAME = 'chefiapp_event_store';
const STORE_NAME = 'events';
const DB_VERSION = 1;

interface EventDB extends DBSchema {
    events: {
        key: string; // eventId (UUID)
        value: EventEnvelope;
        indexes: { 'by-timestamp': number };
    };
}

class EventStore {
    private dbPromise: Promise<IDBPDatabase<EventDB>>;

    constructor() {
        this.dbPromise = openDB<EventDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Create the append-only log
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'eventId' });
                store.createIndex('by-timestamp', 'meta.timestamp');
            },
        });
    }

    // 🔒 APPEND ONLY
    // "History cannot be rewritten, only written."
    async append(event: EventEnvelope): Promise<void> {
        const db = await this.dbPromise;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        // 1. Idempotency Check (The Shield)
        const existing = await store.get(event.eventId);
        if (existing) {
            console.warn(`[EventStore] Idempotency Shield: Event ${event.eventId} ignored (Already exists).`);
            return; // Silent success (Idempotent)
        }

        // 2. Commit Fact
        await store.add(event);
        await tx.done;

        console.log(`[EventStore] Committed: ${event.type} (${event.eventId})`);
    }

    // 📖 READER (The Historian)
    async getAllSince(timestamp: number): Promise<EventEnvelope[]> {
        const db = await this.dbPromise;
        return db.getAllFromIndex(STORE_NAME, 'by-timestamp', IDBKeyRange.lowerBound(timestamp));
    }

    // 🔗 CHAIN SUPPORT
    async getLast(): Promise<EventEnvelope | undefined> {
        const db = await this.dbPromise;
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('by-timestamp');
        const cursor = await index.openCursor(null, 'prev'); // Latest first
        return cursor?.value;
    }

    async drop_DANGER(): Promise<void> {
        const db = await this.dbPromise;
        await db.clear(STORE_NAME);
    }
}

export const GlobalEventStore = new EventStore();
