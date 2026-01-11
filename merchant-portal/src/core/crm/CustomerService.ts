/**
 * CustomerService - Serviço para gerenciar clientes (CRM)
 * 
 * FASE 3: Integração completa com TPV
 */

import { supabase } from '../supabase';

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
            .from('customer_profiles')
            .select('*')
            .eq('restaurant_id', restaurantId);

        if (data.email) {
            query = query.eq('email', data.email);
        } else if (data.phone) {
            query = query.eq('phone', data.phone);
        }

        const { data: existing, error: searchError } = await query.single();

        if (existing && !searchError) {
            return existing;
        }

        // Criar novo cliente
        const { data: newCustomer, error: createError } = await supabase
            .from('customer_profiles')
            .insert({
                restaurant_id: restaurantId,
                email: data.email || null,
                phone: data.phone || null,
                full_name: data.full_name || null,
            })
            .select()
            .single();

        if (createError) throw createError;
        return newCustomer;
    }

    /**
     * Atualizar cliente após pedido
     */
    static async updateAfterOrder(
        customerId: string,
        orderTotal: number
    ): Promise<void> {
        const { error } = await supabase.rpc('update_customer_after_visit', {
            p_customer_id: customerId,
            p_order_total: orderTotal,
        });

        if (error) {
            // Fallback: update manual se RPC não existir
            const { data: customer } = await supabase
                .from('customer_profiles')
                .select('total_visits, total_spent')
                .eq('id', customerId)
                .single();

            if (customer) {
                await supabase
                    .from('customer_profiles')
                    .update({
                        total_visits: (customer.total_visits || 0) + 1,
                        total_spent: (parseFloat(customer.total_spent?.toString() || '0') + orderTotal).toFixed(2),
                        last_visit_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', customerId);
            }
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
        const { data, error } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
            .order('last_visit_at', { ascending: false, nullsFirst: false })
            .limit(20);

        if (error) throw error;
        return data || [];
    }

    /**
     * Obter top clientes
     */
    static async getTopCustomers(
        restaurantId: string,
        limit: number = 10
    ): Promise<CustomerProfile[]> {
        const { data, error } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('total_spent', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    }

    /**
     * Obter perfil do cliente
     */
    static async getCustomerProfile(
        restaurantId: string,
        customerId: string
    ): Promise<CustomerProfile | null> {
        const { data, error } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('id', customerId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    }
}
