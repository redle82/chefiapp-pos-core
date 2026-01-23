import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAppStaff } from '@/context/AppStaffContext';

export interface Notice {
    id: string;
    content: string;
    severity: 'info' | 'attention' | 'critical';
    created_at: string;
    author_id?: string;
    expires_at?: string;
    read_by_me?: boolean; // Joined field
}

export function useNotices() {
    const { operationalContext, userName } = useAppStaff();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotices = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch active notices
            const { data, error } = await supabase
                .from('gm_notices')
                .select(`
                    *,
                    gm_notice_reads!left (user_id)
                `)
                .eq('restaurant_id', operationalContext.businessId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching notices:', error);
                return;
            }

            // Client-side transform to check if read by current user
            // Supabase join returns array of reads. If array not empty -> read.
            const formatted = data.map((n: any) => ({
                ...n,
                read_by_me: n.gm_notice_reads.some((r: any) => r.user_id === user.id)
            }));

            setNotices(formatted);
        } catch (e) {
            console.error('Error in fetchNotices', e);
        } finally {
            setLoading(false);
        }
    }, [operationalContext.businessId]);

    const postNotice = useCallback(async (content: string, severity: 'info' | 'attention' | 'critical') => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('gm_notices')
                .insert({
                    restaurant_id: operationalContext.businessId,
                    author_id: user.id,
                    content,
                    severity
                });

            if (error) throw error;
            fetchNotices();
        } catch (e) {
            console.error('Error posting notice', e);
            throw e;
        }
    }, [operationalContext.businessId, fetchNotices]);

    const deleteNotice = useCallback(async (id: string) => {
        await supabase.from('gm_notices').delete().eq('id', id);
        fetchNotices();
    }, [fetchNotices]);

    const markAsRead = useCallback(async (noticeId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('gm_notice_reads').insert({
            notice_id: noticeId,
            user_id: user.id
        });

        // Optimistic update
        setNotices(prev => prev.map(n => n.id === noticeId ? { ...n, read_by_me: true } : n));
    }, []);

    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]);

    return {
        notices,
        loading,
        fetchNotices,
        postNotice,
        deleteNotice,
        markAsRead
    };
}
