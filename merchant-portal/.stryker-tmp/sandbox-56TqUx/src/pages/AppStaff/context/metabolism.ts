// @ts-nocheck

// ------------------------------------------------------------------
// 🧬 METABOLIC TYPES (Core 5)
// ------------------------------------------------------------------
// Moved here to fix HMR/Cache issues with types.ts

export interface LatentObligation {
    id: string; // 'clean-fridge-week-42'
    sourceId: string; // 'fridge-01'
    sourceType: 'inventory' | 'compliance';
    type: 'cleaning' | 'maintenance' | 'audit';
    title: string;
    description: string;
    validFrom: number; // Start of window
    validUntil: number; // Deadline
    criticality: 'low' | 'medium' | 'high';
    status: 'latent' | 'active' | 'fulfilled' | 'expired';
    recurrence?: string; // Metadata for calendar
}

export interface EquipmentOrgan {
    id: string;
    name: string;
    type: 'fridge' | 'oven' | 'coffee_machine' | 'hvac';
    status: 'healthy' | 'warning' | 'critical';
    metabolism: {
        cleaningCycle: 'daily' | 'weekly';
        maintenanceCycle: 'monthly' | 'yearly';
        lastCleanedAt: number;
        lastMaintainedAt: number;
    }
}
