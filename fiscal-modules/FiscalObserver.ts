import { CoreEvent } from "../event-log/types";
import { LegalSeal } from "../legal-boundary/types";
import { FiscalResult } from "./types";

/**
 * The Fiscal Observer listens to the 'Legal Stream'.
 * It only acts when a Seal is confirmed.
 */
export interface FiscalObserver {
    /**
     * Called when a Seal is detected.
     * Implementations should be idempotent.
     * 
     * @param seal The immutable legal seal (The Proof)
     * @param event The immutable financial fact (The Truth)
     */
    onSealed(seal: LegalSeal, event: CoreEvent): Promise<FiscalResult>;
}
