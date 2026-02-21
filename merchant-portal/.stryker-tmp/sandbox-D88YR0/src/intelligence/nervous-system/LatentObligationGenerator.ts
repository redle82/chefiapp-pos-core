import type { EquipmentOrgan, LatentObligation, TaskRecipe } from '../../pages/AppStaff/context/StaffCoreTypes';
import { evaluateRecipe } from './RecipeEngine';

// ------------------------------------------------------------------
// 📜 STANDARD SOP LIBRARY (The Knowledge Base)
// ------------------------------------------------------------------
// In a real app, this comes from a database.
const STANDARD_SOP_LIBRARY: TaskRecipe[] = [
    {
        id: 'sop-clean-daily',
        title: 'Higienização Diária',
        action: 'cleaning',
        reason: 'Evita contaminação e mantém gosto.',
        preconditions: {
            targetOrganType: 'all', // Special wildcard logic
            interval: 24 * 60 * 60 * 1000,
            gracePeriod: 4 * 60 * 60 * 1000
        },
        status: 'active'
    },
    {
        id: 'sop-decant-ketchup',
        title: 'Decantar Ketchup',
        action: 'preventive',
        reason: 'Transferir para recipientes de mesa e evitar oxidação.',
        preconditions: {
            targetOrganType: 'condiments',
            requiredCapability: 'requiresDecanting',
            interval: 24 * 60 * 60 * 1000,
            gracePeriod: 4 * 60 * 60 * 1000
        },
        status: 'active'
    }
];

// ------------------------------------------------------------------
// 🧬 LATENT OBLIGATION GENERATOR
// ------------------------------------------------------------------
// Pure logic to translate Organ State -> Executive Obligations.
// This runs in the "Executive Loop" (e.g. every 1 minute or on page load).

import { now as getNow } from './Clock';

export const generateLatentObligations = (organs: EquipmentOrgan[], _ignoredExplitTime?: number): LatentObligation[] => {
    const now = getNow();
    const obligations: LatentObligation[] = [];
    const DAY = 24 * 60 * 60 * 1000;

    organs.forEach(organ => {
        // 1. Run against SOP Library
        STANDARD_SOP_LIBRARY.forEach(recipe => {
            // Special wildcard for 'clean-daily' which applies to almost everything with daily cycle
            // In a real engine, we'd map recipes to types better.
            // For MVP: manual mapping for 'sop-clean-daily'

            let applicable = false;

            if (recipe.id === 'sop-clean-daily') {
                if (organ.metabolism.cleaningCycle === 'daily') applicable = true;
            } else {
                // Standard Evaluator
                // Map 'condiments' type matching.
                // Our test uses type: 'condiments' (casted). 
                if (organ.type as string === recipe.preconditions.targetOrganType) applicable = true;
            }

            if (!applicable) return;

            // 🧛 ZOMBIE CHECK (Law 8)
            const evaluation = evaluateRecipe(recipe, organ);

            if (!evaluation.eligible) {
                // Log Zombie Detection?
                // console.log(`🧛 Zombie Task Detected: ${recipe.title} for ${organ.name} killed.`);
                return;
            }

            // Should we generate obligation? Check time.
            const timeSince = now - organ.metabolism.lastCleanedAt; // Simplification: using lastCleaned for all
            // Ideally strictly lastActionAt for that specific recipe type.

            if (timeSince > (recipe.preconditions.interval * 0.8)) { // 80% of interval passed
                obligations.push({
                    id: `${recipe.action}-${organ.id}-${Math.floor(now / DAY)}`,
                    sourceId: organ.id,
                    sourceType: 'inventory',
                    type: recipe.action as any,
                    title: `${recipe.title} (${organ.name})`,
                    description: recipe.reason,
                    validFrom: organ.metabolism.lastCleanedAt + recipe.preconditions.interval,
                    validUntil: organ.metabolism.lastCleanedAt + recipe.preconditions.interval + recipe.preconditions.gracePeriod,
                    criticality: 'medium',
                    status: 'active',
                    recurrence: 'daily',
                    recipeId: recipe.id
                });
            }
        });

        // C. MAINTENANCE (Executive/Critical - Keep Hardcoded for Safety)
        if (organ.status === 'warning') {
            obligations.push({
                id: `maint-${organ.id}-${now}`,
                sourceId: organ.id,
                sourceType: 'inventory',
                type: 'maintenance',
                title: `Manutenção: ${organ.name}`,
                description: 'Equipamento reportou estado de ALERTA.',
                validFrom: now,
                validUntil: now + (3 * DAY),
                criticality: 'high',
                status: 'active'
            });
        }
    });

    return obligations;
};
