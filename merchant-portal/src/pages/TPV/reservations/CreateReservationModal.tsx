import React, { useState } from 'react';
import { supabase } from '../../../core/supabase';
import { Card, Text, Button } from '../../../ui/design-system/primitives';
import { spacing } from '../../../ui/design-system/tokens/spacing';

import { useTables } from '../context/TableContext';

interface CreateReservationModalProps {
    restaurantId: string;
    onClose: () => void;
    onCreated: () => void;
}

export const CreateReservationModal: React.FC<CreateReservationModalProps> = ({ restaurantId, onClose, onCreated }) => {
    const { tables } = useTables();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [partySize, setPartySize] = useState(2);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('19:00');
    const [selectedTableId, setSelectedTableId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const reservationTime = new Date(`${date}T${time}:00`).toISOString();

            const { error } = await supabase
                .from('gm_reservations')
                .insert({
                    restaurant_id: restaurantId,
                    customer_name: name,
                    customer_phone: phone,
                    party_size: partySize,
                    reservation_time: reservationTime,
                    status: 'PENDING',
                    table_id: selectedTableId || null
                });

            if (error) throw error;
            onCreated();
        } catch (err: any) {
            console.error('Error creating reservation:', err);
            alert('Erro ao criar reserva: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <Card surface="layer1" padding="xl" style={{ width: 400 }}>
                <Text weight="bold" size="xl" color="primary" style={{ marginBottom: spacing[4] }}>
                    Nova Reserva
                </Text>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                    <div>
                        <label style={{ display: 'block', color: 'white', marginBottom: 4 }}>Nome do Cliente</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            style={{ width: '100%', padding: 8, borderRadius: 4 }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', color: 'white', marginBottom: 4 }}>Telefone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            style={{ width: '100%', padding: 8, borderRadius: 4 }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', color: 'white', marginBottom: 4 }}>Pessoas</label>
                        <input
                            type="number"
                            min="1"
                            value={partySize}
                            onChange={e => setPartySize(parseInt(e.target.value))}
                            required
                            style={{ width: '100%', padding: 8, borderRadius: 4 }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', color: 'white', marginBottom: 4 }}>Mesa (Opcional)</label>
                        <select
                            value={selectedTableId}
                            onChange={e => setSelectedTableId(e.target.value)}
                            style={{ width: '100%', padding: 8, borderRadius: 4 }}
                        >
                            <option value="">Sem mesa</option>
                            {tables.map(t => (
                                <option key={t.id} value={t.id}>Mesa {t.number} ({t.seats} lug.)</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: spacing[2] }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', color: 'white', marginBottom: 4 }}>Data</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                                style={{ width: '100%', padding: 8, borderRadius: 4 }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', color: 'white', marginBottom: 4 }}>Hora</label>
                            <input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                required
                                style={{ width: '100%', padding: 8, borderRadius: 4 }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: spacing[2], marginTop: spacing[4] }}>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading} style={{ flex: 1 }}>
                            Cancelar
                        </Button>
                        <Button type="submit" tone="action" disabled={loading} style={{ flex: 1 }}>
                            {loading ? 'Criando...' : 'Criar Reserva'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
