// @ts-nocheck
import type { InventoryItem, TaskRecipe } from './InventoryTypes';
import type { EquipmentOrgan } from '../../pages/AppStaff/context/StaffCoreTypes';

// ------------------------------------------------------------------
// 🧬 METABOLIC ENGINE (THE LOGIC)
// ------------------------------------------------------------------
// "No task exists by habit. All tasks exist by verifiable condition."
// ------------------------------------------------------------------

export const isZombie = (
    item: InventoryItem,
    recipe: TaskRecipe,
    organs: EquipmentOrgan[] = []
): boolean => {
    // 1. Check Packaging Match (Contextual Reality)
    if (recipe.conditions.requiredPackaging) {
        if (item.packaging.type !== recipe.conditions.requiredPackaging) {
            // ZOMBIE: The physical item packaging does not match the recipe requirements.
            // e.g. Recipe needs 'bulk', Item is 'bottle'.
            return true;
        }
    }

    // 2. Check Dispenser Logic (Automation Check)
    // If recipe.requiresDispenser is FALSE (e.g. manual decanting recipe),
    // and the item HAS a dispenser, then the manual task is a Zombie.
    if (recipe.conditions.requiresDispenser === false) {
        if (item.packaging.hasDispenser) {
            // ZOMBIE: Technology (Dispenser) has solved this problem.
            return true;
        }
    }

    // 3. Check Organ Capabilities (Law 9: Capability First)
    // If the recipe requires a capability (e.g. 'sous_vide'),
    // we must find at least one ACTIVE organ that provides it.
    if (recipe.conditions.requiresCapability) {
        const hasCapability = organs.some(o =>
            (o.status === 'healthy' || o.status === 'warning') &&
            o.capabilities?.[recipe.conditions.requiresCapability!]
        );

        if (!hasCapability) {
            // ZOMBIE: The hardware required to perform this task does not exist or is broken.
            // e.g. "Vacuum Seal" task but Vacuum Sealer is broken.
            return true;
        }
    }

    // 4. Check Hunger (Metabolic Need)
    // A task to "restock" is a Zombie if we are full.
    const threshold = recipe.conditions.stockBelow ?? item.lifecycle.parLevel;
    if (item.currentStock >= threshold) {
        // DORMANT: Not a "Zombie" per se, but metabolically inactive.
        // We treat it as Zombie (Dead Task) for the current cycle.
        return true;
    }

    // ALIVE: Conditions met, Need existing.
    return false;
};
