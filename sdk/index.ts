/**
 * COTE: System of Record SDK (v1.0.0-AUDIT)
 * 
 * This is the ONLY public interface for integrating with the ChefIApp POS Core.
 * Consumers must not import from internal directories (core-engine, legal-boundary, etc.) directly.
 * 
 * Governance:
 * - This file represents the "Frozen Interface".
 * - Changes here require a version bump and re-audit.
 */

// --- 1. CORE FINANCIAL TYPES ---
// Source of Truth: core-engine
export type {
    Session,
    Order,
    OrderItem,
    Payment,
    TransitionRequest,
    TransitionResult,
} from "../core-engine"; // Imports from core-engine/index.ts

// --- 2. EVENT LOG TYPES ---
// Source of Truth: event-log
export type {
    CoreEvent,
    StreamId,
    EventType,
    EventStore,
    EventMetadata,
} from "../event-log/types";

// --- 3. LEGAL BOUNDARY TYPES ---
// Source of Truth: legal-boundary
export type {
    LegalSeal,
    LegalEntityType,
    LegalState,
} from "../legal-boundary/types";

export type {
    LegalSealStore
} from "../legal-boundary/LegalSealStore";

export type {
    LegalBoundary
} from "../legal-boundary/LegalBoundary"; // Exporting class type as interface reference is allowed

// --- 4. FISCAL ADAPTER TYPES ---
// Source of Truth: fiscal-modules
export type {
    TaxDocument,
    TaxDocumentType,
    FiscalStatus,
    FiscalResult,
} from "../fiscal-modules/types";

export type {
    FiscalObserver
} from "../fiscal-modules/FiscalObserver";

// --- 5. UTILITIES ---
// (None currently certified for public usage)
