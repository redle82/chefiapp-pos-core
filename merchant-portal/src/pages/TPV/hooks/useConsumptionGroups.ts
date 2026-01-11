import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../core/supabase';
import type { ConsumptionGroup, CreateConsumptionGroupInput, UpdateConsumptionGroupInput, PayConsumptionGroupInput } from '../types/ConsumptionGroup';

export function useConsumptionGroups(orderId: string | null) {
    const [groups, setGroups] = useState<ConsumptionGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchGroups = useCallback(async () => {
        if (!orderId) {
            setGroups([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('SESSION_REQUIRED');
            }

            const response = await fetch(`/api/consumption-groups?order_id=${orderId}`, {
                headers: {
                    'X-ChefiApp-Token': session.access_token,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch groups: ${response.statusText}`);
            }

            const data = await response.json();
            setGroups(data.groups || []);
        } catch (err: any) {
            console.error('[useConsumptionGroups] Fetch failed:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const createGroup = useCallback(async (input: CreateConsumptionGroupInput): Promise<ConsumptionGroup> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw new Error('SESSION_REQUIRED');
        }

        const response = await fetch('/api/consumption-groups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-ChefiApp-Token': session.access_token,
            },
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create group');
        }

        const data = await response.json();
        await fetchGroups(); // Refresh
        return data.group;
    }, [fetchGroups]);

    const updateGroup = useCallback(async (groupId: string, input: UpdateConsumptionGroupInput): Promise<ConsumptionGroup> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw new Error('SESSION_REQUIRED');
        }

        const response = await fetch(`/api/consumption-groups/${groupId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-ChefiApp-Token': session.access_token,
            },
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update group');
        }

        const data = await response.json();
        await fetchGroups(); // Refresh
        return data.group;
    }, [fetchGroups]);

    const payGroup = useCallback(async (groupId: string, input: PayConsumptionGroupInput): Promise<ConsumptionGroup> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw new Error('SESSION_REQUIRED');
        }

        const response = await fetch(`/api/consumption-groups/${groupId}/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-ChefiApp-Token': session.access_token,
            },
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to pay group');
        }

        const data = await response.json();
        await fetchGroups(); // Refresh
        return data.group;
    }, [fetchGroups]);

    const moveItemToGroup = useCallback(async (itemId: string, groupId: string | null): Promise<void> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw new Error('SESSION_REQUIRED');
        }

        const response = await fetch(`/api/order-items/${itemId}/group`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-ChefiApp-Token': session.access_token,
            },
            body: JSON.stringify({ consumption_group_id: groupId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to move item');
        }

        await fetchGroups(); // Refresh
    }, [fetchGroups]);

    return {
        groups,
        loading,
        error,
        fetchGroups,
        createGroup,
        updateGroup,
        payGroup,
        moveItemToGroup,
    };
}
