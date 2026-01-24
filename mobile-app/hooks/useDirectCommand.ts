import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { useAppStaff, StaffRole } from '@/context/AppStaffContext';

export type CommandResponse = 'OK' | 'UNDERSTOOD' | 'HELP';
export type CommandStatus = 'sent' | 'read' | 'responded';

export interface DirectCommand {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string; // Max 140 chars
    status: CommandStatus;
    response?: CommandResponse;
    created_at: string;
    sender?: { email: string }; // Optional joined data
}

export function useDirectCommand() {
    const { operationalContext, activeRole, userName } = useAppStaff();
    const [incomingCommands, setIncomingCommands] = useState<DirectCommand[]>([]);
    const [sentCommands, setSentCommands] = useState<DirectCommand[]>([]);
    const [loading, setLoading] = useState(false);

    // POLLING INTERVAL
    // For Staff: frequent check (The Red Phone needs to ring).
    // For Manager: less frequent, mostly to see responses.
    const POLL_INTERVAL = 5000;

    const fetchIncoming = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('gm_direct_commands')
            .select('*')
            .eq('receiver_id', user.id)
            .eq('status', 'sent') // Only unhandled commands
            .order('created_at', { ascending: false });

        if (data) {
            setIncomingCommands(data);
        }
    }, []);

    const fetchSent = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Managers only?
        const { data, error } = await supabase
            .from('gm_direct_commands')
            .select(`*, receiver:receiver_id(email)`) // pseudo-join if possible, or just id
            .eq('sender_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setSentCommands(data);
        }
    }, []);

    // Send Command (Manager -> Staff)
    const sendCommand = useCallback(async (receiverId: string, content: string) => {
        if (content.length > 140) throw new Error("Message too long (max 140)");

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
            .from('gm_direct_commands')
            .insert({
                restaurant_id: operationalContext.businessId,
                sender_id: user.id,
                receiver_id: receiverId,
                content,
                status: 'sent'
            });

        if (error) throw error;
        fetchSent(); // Refresh history
    }, [operationalContext.businessId, fetchSent]);

    // Respond (Staff -> Manager)
    const respondToCommand = useCallback(async (commandId: string, response: CommandResponse) => {
        const { error } = await supabase
            .from('gm_direct_commands')
            .update({
                status: 'responded',
                response,
                responded_at: new Date().toISOString()
            })
            .eq('id', commandId);

        if (error) throw error;

        // Optimistic remove from incoming
        setIncomingCommands(prev => prev.filter(c => c.id !== commandId));
    }, []);

    // Mark as Read (Optional intermediate step)
    const markAsRead = useCallback(async (commandId: string) => {
        await supabase
            .from('gm_direct_commands')
            .update({ status: 'read' })
            .eq('id', commandId);
    }, []);

    // Polling Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const poll = () => {
            // Staff always checks for incoming
            fetchIncoming();
            // Only Manager checks for sent history updates (responses)
            if (activeRole === 'manager' || activeRole === 'owner') {
                fetchSent();
            }
        };

        poll(); // Initial run
        interval = setInterval(poll, POLL_INTERVAL) as any;

        return () => clearInterval(interval);
    }, [activeRole, fetchIncoming, fetchSent]);

    return {
        incomingCommands,
        sentCommands,
        sendCommand,
        respondToCommand,
        markAsRead
    };
}
