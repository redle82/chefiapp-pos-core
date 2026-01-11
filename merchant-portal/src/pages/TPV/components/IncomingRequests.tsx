import React, { useEffect, useState } from 'react';
import { supabase } from '../../../core/supabase';
import { Card, Text, Button } from '../../../ui/design-system/primitives';
import { OrderProcessingService } from '../../../core/services/OrderProcessingService';

interface IncomingRequestsProps {
    restaurantId: string | null;
    onOrderAccepted: () => void; // Callback to refresh active orders
}

interface RequestItem {
    id: string;
    customer_contact: { name: string; phone?: string };
    items: { name: string; quantity: number }[];
    total_cents: number;
    created_at: string;
    status: string;
}

export const IncomingRequests: React.FC<IncomingRequestsProps> = ({ restaurantId, onOrderAccepted }) => {
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [processing, setProcessing] = useState<string | null>(null);

    const [tenantId, setTenantId] = useState<string | null>(null);

    // 0. Resolve Tenant ID
    useEffect(() => {
        if (!restaurantId) return;
        const resolveTenant = async () => {
            const { data: rest } = await supabase
                .from('gm_restaurants')
                .select('id')
                .eq('id', restaurantId)
                .single();
            if (rest) setTenantId(rest.id);
        };
        resolveTenant();
    }, [restaurantId]);

    // 1. Load Initial Data
    const fetchRequests = async () => {
        if (!tenantId) return; // Wait for tenant resolution
        const { data } = await supabase
            .from('gm_order_requests')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('status', 'PENDING')
            .order('created_at', { ascending: true });

        if (data) setRequests(data as any);
    };

    useEffect(() => {
        if (!tenantId) return;
        fetchRequests();

        // 2. Realtime Subscription
        const channel = supabase
            .channel('public:gm_order_requests')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'gm_order_requests', filter: `tenant_id=eq.${tenantId}` },
                (payload) => {
                    console.log('[IncomingRequests] Realtime update:', payload);
                    fetchRequests();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tenantId]);


    const handleAccept = async (req: RequestItem) => {
        if (!restaurantId) return;
        setProcessing(req.id);
        try {
            await OrderProcessingService.acceptRequest(req.id, restaurantId); // Assuming restaurantId is safe to pass or ignored if using relation
            // Remove from local list immediately for UX
            setRequests(prev => prev.filter(r => r.id !== req.id));
            onOrderAccepted();
        } catch (err) {
            console.error('Accept Failed:', err);
            alert('Erro ao aceitar pedido.');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (req: RequestItem) => {
        if (!window.confirm('Recusar pedido?')) return;
        setProcessing(req.id);
        try {
            await OrderProcessingService.rejectRequest(req.id);
            setRequests(prev => prev.filter(r => r.id !== req.id));
        } catch (err) {
            console.error('Reject Failed:', err);
        } finally {
            setProcessing(null);
        }
    };

    if (requests.length === 0) return null;

    return (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                borderRadius: 8,
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>COZINHA / PEDIDOS WEB ({requests.length})</span>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>AO VIVO</span>
            </div>

            {requests.map(req => (
                <Card key={req.id} surface="layer2" padding="md">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <Text weight="bold" size="lg" color="primary">{req.customer_contact.name}</Text>
                            <Text size="sm" color="secondary">
                                {new Date(req.created_at).toLocaleTimeString()}
                            </Text>
                            <div style={{ marginTop: 8 }}>
                                {req.items.map((item, idx) => (
                                    <div key={idx} style={{ color: '#ccc' }}>
                                        {item.quantity}x {item.name}
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 8, fontWeight: 'bold', color: '#fff' }}>
                                Total: {(req.total_cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Button
                                tone="success"
                                size="sm"
                                onClick={() => handleAccept(req)}
                                disabled={processing === req.id}
                            >
                                {processing === req.id ? '...' : 'ACEITAR'}
                            </Button>
                            <Button
                                tone="destructive"
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(req)}
                                disabled={processing === req.id}
                            >
                                XXX
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};
