/**
 * CustomerService - Serviço para gerenciar clientes (CRM)
 * Core quando Docker — Fase 4
 */

import { getTableClient } from '../infra/coreOrSupabaseRpc';

// Helper to standardise Profile from DB row
const mapFromDb = (row: any): CustomerProfile => ({
    id: row.id,
    restaurant_id: row.restaurant_id,
    email: row.email,
    phone: row.phone,
    full_name: row.name, // Mapped from 'name'
    preferred_name: row.name?.split(' ')[0], // Derived
    date_of_birth: row.date_of_birth, // If exists
    dietary_restrictions: row.dietary_restrictions || [],
    preferences: row.preferences || {},
    total_visits: row.visit_count || 0, // Mapped
    total_spent: (row.total_spend_cents || 0) / 100, // Mapped & Converted
    last_visit_at: row.last_visit_at,
    notes: row.notes,
    tags: row.tags || [],
    created_at: row.created_at,
    updated_at: row.updated_at
});

export interface CustomerProfile {
    id: string;
    restaurant_id: string;
    email?: string;
    phone?: string;
    full_name?: string;
    preferred_name?: string;
    date_of_birth?: string;
    dietary_restrictions?: string[];
    preferences: Record<string, any>;
    total_visits: number;
    total_spent: number;
    last_visit_at?: string;
    notes?: string;
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export class CustomerService {
    /**
     * Buscar ou criar cliente por email/telefone
     */
    static async findOrCreateCustomer(
        restaurantId: string,
        data: {
            email?: string;
            phone?: string;
            full_name?: string;
        }
    ): Promise<CustomerProfile> {
        // Tentar encontrar cliente existente
        let query = supabase
            .from('gm_customers')
            .select('*')
            .eq('restaurant_id', restaurantId);

        if (data.email) {
            query = query.eq('email', data.email);
        } else if (data.phone) {
            query = query.eq('phone', data.phone);
        }

        const { data: existing, error: searchError } = await query.maybeSingle();

        if (existing && !searchError) {
            return mapFromDb(existing);
        }

        // Criar novo cliente
        const { data: newCustomer, error: createError } = await supabase
            .from('gm_customers')
            .insert({
                restaurant_id: restaurantId,
                email: data.email || null,
                phone: data.phone || null,
                name: data.full_name || null, // Map to 'name'
                total_spend_cents: 0,
                visit_count: 0
            })
            .select()
            .single();

        if (createError) throw createError;
        return mapFromDb(newCustomer);
    }

    /**
     * Atualizar cliente após pedido
     */
    static async updateAfterOrder(
        customerId: string,
        orderTotal: number
    ): Promise<void> {
        // Convert to cents
        const amountCents = Math.round(orderTotal * 100);

        const { invokeRpc } = await import('../infra/coreOrSupabaseRpc');
        const { error } = await invokeRpc('update_customer_after_visit', {
            p_customer_id: customerId,
            p_order_total_cents: amountCents,
        });

        if (error) {
            console.error('Failed to update customer stats via RPC', error);
            // Fallback: update manual se RPC falhar (embora RPC seja preferido)
            // Note: manual update of counters is racy, better to just log error.
        }
    }

    /**
     * Buscar clientes
     */
    static async searchCustomers(
        restaurantId: string,
        query: string
    ): Promise<CustomerProfile[]> {
        const searchTerm = `%${query}%`;
        const client = await getTableClient();
        const { data, error } = await client
            .from('gm_customers')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
            .order('last_visit_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        return (Array.isArray(data) ? data : []).map(mapFromDb);
    }

    /**
     * Obter top clientes
     */
    static async getTopCustomers(
        restaurantId: string,
        limit: number = 10
    ): Promise<CustomerProfile[]> {
        const client = await getTableClient();
        const { data, error } = await client
            .from('gm_customers')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('total_spend_cents', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return (Array.isArray(data) ? data : []).map(mapFromDb);
    }

    /**
     * Obter perfil do cliente
     */
    static async getCustomerProfile(
        restaurantId: string,
        customerId: string
    ): Promise<CustomerProfile | null> {
        const client = await getTableClient();
        const { data, error } = await client
            .from('gm_customers')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('id', customerId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data ? mapFromDb(data) : null;
    }
}
