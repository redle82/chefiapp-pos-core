
import type { EquipmentOrgan, TaskRecipe, SpecDriftAlert } from '../../pages/AppStaff/context/StaffCoreTypes';

// ------------------------------------------------------------------
// 📜 RECIPE ENGINE (The Validator)
// ------------------------------------------------------------------
// "Toda tarefa deve provar continuamente que ainda faz sentido." (Law 8)

interface EvaluationResult {
    eligible: boolean;
    failedConditions: string[];
}

export const evaluateRecipe = (recipe: TaskRecipe, organ: EquipmentOrgan): EvaluationResult => {
    const failures: string[] = [];

    // 1. Type Match
    // Note: We use 'any' cast for loose matching in MVP, strictly should use specific types
    const expectedType = recipe.preconditions.targetOrganType;
    if (expectedType !== 'all' && organ.type !== expectedType && organ.type as string !== expectedType) {
        return { eligible: false, failedConditions: ['type_mismatch'] }; // Silent fail (wrong organ)
    }

    // 2. Capability Check (The Zombie Detector)
    if (recipe.preconditions.requiredCapability) {
        const required = recipe.preconditions.requiredCapability;
        // If the organ *explicitly* lists capability as FALSE, it fails.
        // If undefined, we assume TRUE (conservative/legacy behavior) OR False?
        // In "Anti-SOP", if capability is NOT present, we assume it's NOT needed?
        // Let's stick to the prompt: "if (item.hasDispenser === false)"
        // In our schema: capabilities.requiresDecanting

        // If organ doesn't have the capability map at all, assume it matches (Legacy Mode) -> Or FAIL?
        // Doctrine: "Inércia Procedimental" means we DO it unless told otherwise.
        // BUT "Zombie Task" means we STOP doing it if context changes.

        const hasCapability = organ.capabilities?.[required];

        if (hasCapability === false) {
            // Explicit Refusal (The Antidote)
            failures.push(`capability_explicitly_disabled:${required}`);
        } else if (hasCapability === undefined && organ.capabilities) {
            // Implicit Refusal (Strict Mode): Organ works in Modern Mode but lacks this key.
            // "if (item.hasDispenser === false)" logic implies absence of 'requiresDecanting' when others exist = FALSE
            failures.push(`capability_missing_in_map:${required}`);
        }
        // If organ.capabilities is undefined, we assume LEGACY ORGAN (Permissive)
    }

    return {
        eligible: failures.length === 0,
        failedConditions: failures
    };
};

export const detectSpecDrift = (
    _recipes: TaskRecipe[],
    _organs: EquipmentOrgan[]
): SpecDriftAlert[] => {
    // This runs periodically to see if active recipes are being rejected by organs
    // sending a "Spec Drift" signal to the manager.

    // For now, simpler implementation: Just check if we have any 'active' recipes causing zombies.
    // In a real system, this would listen to events.

    return []; // Placeholder for V1
};
