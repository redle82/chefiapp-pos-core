import { LegalSeal, LegalEntityType } from "./types";

export interface LegalSealStore {
    getSeal(entity_type: LegalEntityType, entity_id: string): Promise<LegalSeal | null>;
    listSealsByEntity(entity_type: LegalEntityType, entity_id: string): Promise<LegalSeal[]>;
    listAllSeals(): Promise<LegalSeal[]>;
    createSeal(seal: LegalSeal): Promise<void>;
    nextSequence(): Promise<number>;
    isSealed(entity_type: LegalEntityType, entity_id: string): Promise<boolean>;
}
