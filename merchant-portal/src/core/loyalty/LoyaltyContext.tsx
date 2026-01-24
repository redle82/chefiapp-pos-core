import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

export interface Customer {
    id: string;
    name: string;
    phone: string;
    points_balance: number;
    visit_count: number;
    last_visit_at: string;
    total_spend_cents: number;
}

interface LoyaltyContextType {
    activeCustomer: Customer | null;
    setActiveCustomer: (customer: Customer | null) => void;
    searchCustomerByPhone: (phone: string, restaurantId: string) => Promise<Customer | null>;
    createCustomer: (name: string, phone: string, restaurantId: string) => Promise<Customer>;
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const LoyaltyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

    const searchCustomerByPhone = async (phone: string, restaurantId: string) => {
        const { data, error } = await supabase
            .from('gm_customers')
            .select('id, name, phone, points_balance, visit_count, last_visit_at, total_spend_cents')
            .eq('restaurant_id', restaurantId)
            .eq('phone', phone)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error searching customer:', error);
            throw error;
        }

        return data as Customer | null;
    };

    const createCustomer = async (name: string, phone: string, restaurantId: string): Promise<Customer> => {
        const { data, error } = await supabase
            .from('gm_customers')
            .insert({
                restaurant_id: restaurantId,
                name,
                phone,
                points_balance: 0,
                visit_count: 0
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    };

    // Realtime Updates for Active Customer
    useEffect(() => {
        if (!activeCustomer) return;

        const channel = supabase
            .channel(`customer_update_${activeCustomer.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'gm_customers',
                    filter: `id=eq.${activeCustomer.id}`
                },
                (payload) => {
                    setActiveCustomer(payload.new as Customer);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeCustomer?.id]);

    return (
        <LoyaltyContext.Provider value={{ activeCustomer, setActiveCustomer, searchCustomerByPhone, createCustomer }}>
            {children}
        </LoyaltyContext.Provider>
    );
};

export const useLoyalty = () => {
    const context = useContext(LoyaltyContext);
    if (context === undefined) {
        throw new Error('useLoyalty must be used within a LoyaltyProvider');
    }
    return context;
};
