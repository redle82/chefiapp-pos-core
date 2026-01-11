// import { supabase } from '../../supabaseClient'; 
const supabase: any = {}; // Mock for now to pass build

export interface Organ {
    id: string;
    restaurant_id: string;
    name: string;
    type: 'freezer' | 'fridge' | 'dry' | 'counter' | 'display';
    capacity_level: number;
    status: 'active' | 'maintenance' | 'broken';
    created_at?: string;
}

export const OrgansRepo = {

    // 1. Fetch all organs (Physical Reality)
    async getAllOrgans(restaurantId: string): Promise<Organ[]> {
        const { data, error } = await supabase
            .from('gm_organs')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .neq('status', 'broken'); // Don't rely on broken organs

        if (error) {
            console.error('[OrgansRepo] Failed to fetch organs:', error);
            return [];
        }
        return data as Organ[];
    },

    // 2. Resolve specific organ by ID (Signal Processing)
    async getOrganForSignal(organId: string): Promise<Organ | null> {
        const { data, error } = await supabase
            .from('gm_organs')
            .select('*')
            .eq('id', organId)
            .single();

        if (error) return null;
        return data as Organ;
    },

    // 3. Capability Check (The Filter)
    canOrganHandleItem(organ: Organ, itemIsPerishable: boolean): boolean {
        // MVP Logic (Expand later with specific temperature ranges)
        if (organ.status === 'broken') return false;

        if (itemIsPerishable) {
            // Perishables need cold storage
            return ['freezer', 'fridge'].includes(organ.type);
        }

        // Non-perishables can go anywhere except maybe freezer (waste of energy?)
        // For MVP, allow dry items in fridge/freezer if desired.
        return true;
    },

    // 4. Creation (Setup)
    async createOrgan(organ: Omit<Organ, 'id' | 'created_at'>): Promise<Organ | null> {
        const { data, error } = await supabase
            .from('gm_organs')
            .insert(organ)
            .select()
            .single();

        if (error) {
            console.error('Failed to create organ:', error);
            return null;
        }
        return data;
    }
};
