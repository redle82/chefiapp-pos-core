import { LegalSeal, LegalEntityType, LegalState } from "./types";
import { LegalSealStore } from "./LegalSealStore";

export class InMemoryLegalSealStore implements LegalSealStore {
    private mapBySealId = new Map<string, LegalSeal>();
    private mapByEntity = new Map<string, LegalSeal[]>();

    // NOTE: sequence is global (not per-entity), monotonically increasing.
    // This mirrors PostgreSQL BIGSERIAL behavior documented in schema.sql.
    // Gaps may occur on failure/rollback (acceptable for legal audit).
    private sequenceCounter = 0;

    async getSeal(entity_type: LegalEntityType, entity_id: string): Promise<LegalSeal | null> {
        const key = this.getEntityKey(entity_type, entity_id);
        const seals = this.mapByEntity.get(key);
        return seals && seals.length > 0 ? seals[seals.length - 1] : null; // Return latest
    }

    async listSealsByEntity(entity_type: LegalEntityType, entity_id: string): Promise<LegalSeal[]> {
        const key = this.getEntityKey(entity_type, entity_id);
        return [...(this.mapByEntity.get(key) || [])]; // Return copy
    }

    async listAllSeals(): Promise<LegalSeal[]> {
        return Array.from(this.mapBySealId.values());
    }

    async createSeal(seal: LegalSeal): Promise<void> {
        if (this.mapBySealId.has(seal.seal_id)) {
            throw new Error(`Seal with ID ${seal.seal_id} already exists.`);
        }

        const key = this.getEntityKey(seal.entity_type, seal.entity_id);
        const existingSeals = this.mapByEntity.get(key) || [];

        // Check if a seal with the same legal state already exists for this entity
        const duplicateState = existingSeals.find(s => s.legal_state === seal.legal_state);
        if (duplicateState) {
            throw new Error(`Seal for entity ${seal.entity_type}:${seal.entity_id} with state ${seal.legal_state} already exists.`);
        }

        // Immutable storage
        const storedSeal: LegalSeal = Object.freeze({ ...seal });

        this.mapBySealId.set(storedSeal.seal_id, storedSeal);

        // Update entity map
        const newSeals = [...existingSeals, storedSeal];
        this.mapByEntity.set(key, newSeals);
    }

    async nextSequence(): Promise<number> {
        this.sequenceCounter += 1;
        return this.sequenceCounter;
    }

    async isSealed(entity_type: LegalEntityType, entity_id: string): Promise<boolean> {
        const seals = await this.listSealsByEntity(entity_type, entity_id);

        // Define final legal states per entity type
        // This is explicit semantic definition, not hardcoded logic
        const FINAL_LEGAL_STATES: Record<LegalEntityType, LegalState[]> = {
            ORDER: ["ORDER_FINAL"],
            PAYMENT: ["PAYMENT_SEALED"],
            SESSION: [] // SESSION has no blocking final state currently
        };

        const finalStates = FINAL_LEGAL_STATES[entity_type];
        return seals.some(s => finalStates.includes(s.legal_state));
    }

    private getEntityKey(entity_type: LegalEntityType, entity_id: string): string {
        return `${entity_type}:${entity_id}`;
    }
}
