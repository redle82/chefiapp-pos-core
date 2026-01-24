/**
 * ReservationsDashboard.tsx — Dashboard Principal de Reservas
 * 
 * Inspirado no CoverManager: visão geral de reservas e gestão simplificada.
 */

import { useState, useEffect } from 'react';
import { Card } from '../../ui/design-system/primitives/Card';
import { Button } from '../../ui/design-system/primitives/Button';
import { Text } from '../../ui/design-system/primitives/Text';
import { Badge } from '../../ui/design-system/primitives/Badge';
import { useToast } from '../../ui/design-system';
import { supabase } from '../../core/supabase';
import { useSupabaseAuth } from '../../core/auth/useSupabaseAuth';

interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reservation_time: string;
  status: string;
  notes?: string;
  table_id?: string;
}

export function ReservationsDashboard() {
  const { error: showError } = useToast();
  const { restaurantId } = useSupabaseAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (restaurantId) {
      loadReservations();
    }
  }, [restaurantId, selectedDate]);

  const loadReservations = async () => {
    if (!restaurantId) return;
    setLoading(true);

    try {
      const startOfDay = `${selectedDate}T00:00:00Z`;
      const endOfDay = `${selectedDate}T23:59:59Z`;

      const { data, error } = await supabase
        .from('gm_reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('reservation_time', startOfDay)
        .lte('reservation_time', endOfDay)
        .order('reservation_time', { ascending: true });

      if (error) throw error;
      setReservations(data || []);
    } catch (err: any) {
      console.error('Error loading reservations:', err);
      showError('Erro ao carregar reservas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'destructive' | 'outline' => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'seated': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'destructive';
      case 'no_show': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmada',
      seated: 'Ocupada',
      completed: 'Concluída',
      cancelled: 'Cancelada',
      no_show: 'No-Show',
    };
    return labels[status] || status;
  };

  const formatTime = (isoString: string): string => {
    try {
      return new Date(isoString).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <Text size="2xl" weight="bold" color="primary" style={{ marginBottom: 8 }}>
          📅 Reservas
        </Text>
        <Text color="secondary">
          Gestão de reservas — Carregado de Supabase
        </Text>
      </div>

      {/* Date Selector */}
      <Card surface="layer1" padding="md" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Text weight="bold">Data:</Text>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.05)',
              color: 'inherit',
            }}
          />
          <Button
            tone="action"
            variant="outline"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          >
            Hoje
          </Button>
          <Button
            tone="action"
            onClick={loadReservations}
            disabled={loading}
          >
            {loading ? 'A carregar...' : 'Atualizar'}
          </Button>
        </div>
      </Card>

      {/* Reservations List */}
      <Card surface="layer1" padding="lg">
        <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
          Reservas ({reservations.length})
        </Text>
        {reservations.length === 0 ? (
          <Text color="secondary">Nenhuma reserva para esta data.</Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                style={{
                  padding: 16,
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div>
                    <Text weight="bold">{reservation.customer_name || 'Cliente'}</Text>
                    <Text size="sm" color="secondary">
                      📞 {reservation.customer_phone || 'Sem telefone'}
                    </Text>
                  </div>
                  <Badge
                    label={getStatusLabel(reservation.status)}
                    variant={getStatusColor(reservation.status)}
                  />
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  <Text size="sm" color="secondary">
                    🕐 {formatTime(reservation.reservation_time)}
                  </Text>
                  <Text size="sm" color="secondary">
                    👥 {reservation.party_size} pessoas
                  </Text>
                  {reservation.notes && (
                    <Text size="sm" color="secondary">
                      📝 {reservation.notes}
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
