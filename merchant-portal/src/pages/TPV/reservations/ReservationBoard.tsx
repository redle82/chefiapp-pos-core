import React, { useState, useEffect } from 'react';
import { supabase } from '../../../core/supabase';
import { Card, Text, Button } from '../../../ui/design-system/primitives';
import { spacing } from '../../../ui/design-system/tokens/spacing';

import { CreateReservationModal } from './CreateReservationModal';
import { useReservationActions } from './useReservationActions';
import { useTables } from '../context/TableContext';

interface Reservation {
    id: string;
    customer_name: string;
    customer_phone: string;
    party_size: number;
    reservation_time: string;
    status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'NO_SHOW';
    table_id?: string;
    notes?: string;
}

interface ReservationBoardProps {
    restaurantId: string;
}

export const ReservationBoard: React.FC<ReservationBoardProps> = ({ restaurantId }) => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('gm_reservations')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .gte('reservation_time', new Date().toISOString().split('T')[0]) // From today onwards
                .order('reservation_time', { ascending: true });

            if (error) throw error;
            setReservations(data || []);
        } catch (err) {
            console.error('Failed to fetch reservations:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (restaurantId) {
            fetchReservations();

            // Realtime
            const channel = supabase
                .channel('public:gm_reservations')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'gm_reservations', filter: `restaurant_id=eq.${restaurantId}` },
                    () => { fetchReservations(); }
                )
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [restaurantId]);

    const { tables } = useTables();
    const { assignTable, seatReservation } = useReservationActions(restaurantId);

    // Filter out SEATED if we only want upcomming? Keeping for now.

    const handleAssignTable = async (resId: string, tableId: string) => {
        if (!tableId) return;
        try {
            await assignTable(resId, tableId);
            await fetchReservations(); // Refresh
        } catch (e: any) {
            alert('Erro ao atribuir mesa: ' + e.message);
        }
    };

    const handleSeat = async (res: Reservation) => {
        if (!res.table_id) return alert('Atribua uma mesa antes de sentar.');
        if (!confirm(`Sentar ${res.customer_name} na Mesa? Isso abrirá um pedido.`)) return;

        try {
            await seatReservation(res.id, res.table_id, res.party_size, res.customer_name);
            await fetchReservations(); // Refresh status
        } catch (e: any) {
            alert('Erro ao sentar: ' + e.message);
        }
    };

    return (
        <div style={{ padding: spacing[4], height: '100%', display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ color: 'white', margin: 0 }}>Reservas</h1>
                <Button tone="action" onClick={() => setIsCreateModalOpen(true)}>
                    + Nova Reserva
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: spacing[4], overflowY: 'auto' }}>
                {loading ? (
                    <Text>Carregando...</Text>
                ) : reservations.length === 0 ? (
                    <Text>Nenhuma reserva para hoje.</Text>
                ) : (
                    reservations.map(res => {
                        const assignedTable = tables.find(t => t.id === res.table_id);

                        return (
                            <Card key={res.id} surface="layer2" padding="lg">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[2] }}>
                                    <Text weight="bold" size="lg" color="primary">{res.customer_name}</Text>
                                    <span style={{
                                        backgroundColor: res.status === 'SEATED' ? '#2196f3' : res.status === 'CONFIRMED' ? '#4caf50' : '#ff9800',
                                        padding: '2px 8px',
                                        borderRadius: 4,
                                        fontSize: 12,
                                        fontWeight: 'bold',
                                        color: 'white'
                                    }}>
                                        {res.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
                                    <Text size="md" color="secondary">🕒 {new Date(res.reservation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                    <Text size="md" color="secondary">👥 {res.party_size} pessoas</Text>
                                    {res.customer_phone && <Text size="sm" color="secondary">📞 {res.customer_phone}</Text>}

                                    <div style={{ marginTop: 8, padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                                        {assignedTable ? (
                                            <Text weight="bold" color="highlight">🪑 Mesa {assignedTable.number} ({assignedTable.seats} lug.)</Text>
                                        ) : (
                                            <select
                                                onChange={(e) => handleAssignTable(res.id, e.target.value)}
                                                style={{ width: '100%', padding: 4, borderRadius: 4 }}
                                            >
                                                <option value="">Atribuir Mesa...</option>
                                                {tables.filter(t => t.status === 'free').map(t => (
                                                    <option key={t.id} value={t.id}>Mesa {t.number}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>

                                {res.status !== 'SEATED' && res.status !== 'CANCELLED' && (
                                    <div style={{ marginTop: spacing[4], display: 'flex', gap: spacing[2] }}>
                                        {assignedTable && (
                                            <Button size="sm" tone="action" onClick={() => handleSeat(res)}>Sentar & Abrir Pedido</Button>
                                        )}
                                        {!assignedTable && (
                                            <Button size="sm" tone="success">Confirmar</Button>
                                        )}
                                        <Button size="sm" variant="outline" tone="destructive">Canx</Button>
                                    </div>
                                )}
                            </Card>
                        );
                    })
                )}
            </div>

            {isCreateModalOpen && (
                <CreateReservationModal
                    restaurantId={restaurantId}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={() => {
                        setIsCreateModalOpen(false);
                        fetchReservations();
                    }}
                />
            )}
        </div>
    );
};
