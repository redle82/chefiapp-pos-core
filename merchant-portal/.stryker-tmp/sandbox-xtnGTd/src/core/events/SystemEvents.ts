// 📜 THE IRON CORE: EVENT DEFINITIONS
// "The System is the Law."

export type EventType =
  | "SHIFT_STARTED"
  | "SHIFT_ENDED"
  // Metabolic Events (Inventory)
  | "INVENTORY_CONSUMED"
  | "INVENTORY_RESTOCKED"
  | "INVENTORY_ADJUSTED"
  | "ORDER_CREATED"
  | "ORDER_UPDATED"
  | "ORDER_PAID"
  | "ORDER_CLOSED"
  | "SESSION_OPENED"
  | "SESSION_CLOSED"
  | "INVENTORY_ITEM_UPDATED" // Phase 14
  | "METABOLIC_PULSE_LOGGED" // Phase 14
  | "LEGAL_CONSENT_ACCEPTED";

// The "DNA" of the system.
export type { EventEnvelope } from "./SealTypes";
// export interface EventEnvelope<T = any> {
//     eventId: string;          // UUID v4 (The Identity)
//     type: EventType;          // What happened?
//     payload: T;               // The Data
//     meta: {
//         timestamp: number;    // Physical Time
//         actorId: string;      // Who did it?
//         sessionId?: string;   // Context (Cash Session)
//         causationId?: string; // What triggered this? (Chain of Custody)
//     };
//     seal?: LegalSeal;         // (Phase 11.2) Integrity Proof
// }

// 🔒 THE SEAL (Phase 11.2)
// A cryptographic proof that this event creates a binding reality.
export interface LegalSeal {
  hash: string; // sha256(prevHash + payload + meta)
  timestamp: number;
  witnessId?: string; // If witnessed
  signature?: string; // Client-side signature (Simulated for now)
}

// --- Specific Payloads ---

export interface OrderCreatedPayload {
  id: string;
  tableNumber: number;
  items: any[];
  totalCents: number;
}

export interface OrderUpdatedPayload {
  orderId: string;
  action: "send" | "print" | "cancel";
  items?: any[];
}

export interface PaymentPayload {
  orderId: string;
  method: "cash" | "card" | "pix";
  amountCents: number;
  splitId?: string;
}

// --- SYSTEM BUS (Local Event System) ---
type EventHandler = (payload: any) => void;

class SystemBusImpl {
  private handlers: Map<string, EventHandler[]> = new Map();

  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event)?.push(handler);
  }

  off(event: string, handler: EventHandler) {
    const list = this.handlers.get(event);
    if (list) {
      this.handlers.set(
        event,
        list.filter((h) => h !== handler),
      );
    }
  }

  emit(event: string, payload: any) {
    this.handlers.get(event)?.forEach((fn) => fn(payload));
  }
}

export const SystemEvents = new SystemBusImpl();
