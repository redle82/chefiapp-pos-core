// @ts-nocheck
import type { EquipmentOrgan } from '../../pages/AppStaff/context/StaffCoreTypes';

// ------------------------------------------------------------------
// 🧬 EQUIPMENT ORGAN REGISTRY
// ------------------------------------------------------------------
// "Hardware dictates Software."
// This registry defines the physical capabilities of the kitchen.
// If an organ breaks, its capabilities disappear, and dependent tasks die.

export const ORGAN_REGISTRY: EquipmentOrgan[] = [
    {
        id: 'organ-squeeze-station-A',
        name: 'Squeeze Station Alpha',
        type: 'pump_station' as any, // Mismatch in types between StaffCore and InventoryTypes (pump_station vs fridge/oven)
        // We need to either update StaffCoreTypes to include more organ types or map them.
        // StaffCoreTypes: 'fridge' | 'oven' | 'coffee_machine' | 'hvac'
        // InventoryTypes: 'bottle_warmer' | 'sous_vide' | 'pump_station'
        // I will cast for now or update StaffCoreTypes.
        status: 'healthy',
        capabilities: { dispense_viscous_liquid: true, measure_volume: true },
        metabolism: {
            cleaningCycle: 'daily',
            maintenanceCycle: 'monthly',
            lastCleanedAt: Date.now(),
            lastMaintainedAt: Date.now()
        }
    },
    {
        id: 'organ-sous-vide-bath-1',
        name: 'Sous Vide 1',
        type: 'oven' as any, // mapping 'sous_vide' to closest? or just casting.
        status: 'healthy',
        capabilities: { thermal_precision: true, long_cook: true },
        metabolism: {
            cleaningCycle: 'daily',
            maintenanceCycle: 'monthly',
            lastCleanedAt: Date.now(),
            lastMaintainedAt: Date.now()
        }
    },
    {
        id: 'organ-ketchup-pump-dispenser',
        name: 'Ketchup Pump',
        type: 'pump_station' as any,
        status: 'healthy',
        capabilities: { bulk_dispense: true },
        metabolism: {
            cleaningCycle: 'daily',
            maintenanceCycle: 'monthly',
            lastCleanedAt: Date.now(),
            lastMaintainedAt: Date.now()
        }
    },
    // ✅ MVP BASIC ORGANS (Added for Extermination Protocol)
    {
        id: 'organ-main-freezer',
        name: 'Main Freezer',
        type: 'fridge', // freezer is close to fridge
        status: 'healthy',
        capabilities: { frozen_storage: true },
        metabolism: {
            cleaningCycle: 'weekly',
            maintenanceCycle: 'yearly',
            lastCleanedAt: Date.now(),
            lastMaintainedAt: Date.now()
        }
    },
    {
        id: 'organ-main-fridge',
        name: 'Main Fridge',
        type: 'fridge',
        status: 'healthy',
        capabilities: { cold_storage: true, drink_dispense: true },
        metabolism: {
            cleaningCycle: 'weekly',
            maintenanceCycle: 'yearly',
            lastCleanedAt: Date.now(),
            lastMaintainedAt: Date.now()
        }
    },
    {
        id: 'organ-dry-storage-A',
        name: 'Dry Storage A',
        type: 'hvac' as any, // dry storage... closest mechanism? or just cast.
        status: 'healthy',
        capabilities: { dry_storage: true },
        metabolism: {
            cleaningCycle: 'weekly',
            maintenanceCycle: 'yearly',
            lastCleanedAt: Date.now(),
            lastMaintainedAt: Date.now()
        }
    }
];

// Helper to find capabilities
export const getOrganCapabilities = (organs: EquipmentOrgan[]): Set<string> => {
    const caps = new Set<string>();
    organs.forEach(o => {
        if (o.status === 'healthy') {
            Object.keys(o.capabilities || {}).forEach(c => {
                if (o.capabilities?.[c]) caps.add(c);
            });
        }
    });
    return caps;
};

// API for the Nervous System to query Reality
export const EquipmentOrganRegistry = {
    getAll: () => ORGAN_REGISTRY,

    get: (organId: string): EquipmentOrgan | undefined => {
        return ORGAN_REGISTRY.find(o => o.id === organId);
    },

    // Dynamic Registry (future: load from DB)
    register: (organ: EquipmentOrgan) => {
        const idx = ORGAN_REGISTRY.findIndex(o => o.id === organ.id);
        if (idx >= 0) ORGAN_REGISTRY[idx] = organ;
        else ORGAN_REGISTRY.push(organ);
    }
};
