/**
 * ReservationsDashboard.tsx — Dashboard Principal de Reservas
 * 
 * Inspirado no CoverManager: visão geral de reservas, fila virtual, e CRM.
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/design-system/primitives/Card';
import { Button } from '../../ui/design-system/primitives/Button';
import { Text } from '../../ui/design-system/primitives/Text';
import { Badge } from '../../ui/design-system/primitives/Badge';
import { useToast } from '../../ui/design-system';
import { CONFIG } from '../../config';
import { getTabIsolated } from '../../core/storage/TabIsolatedStorage';

interface Reservation {
  id: string;
  reservation_code: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: string;
  customer_name?: string;
  table_id?: string;
}

interface WaitlistEntry {
  id: string;
  party_size: number;
  customer_name?: string;
  customer_phone: string;
  position: number;
  estimated_wait_time?: number;
}

export function ReservationsDashboard() {
  const { success, error } = useToast();
  const [restaurantId] = useState<string | null>(getTabIsolated('chefiapp_restaurant_id'));
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (restaurantId) {
      loadReservations();
      loadWaitlist();
    }
  }, [restaurantId, selectedDate]);

  const loadReservations = async () => {
    if (!restaurantId) return;

    try {
      const response = await fetch(
        `${CONFIG.API_BASE}/api/reservations?restaurant_id=${restaurantId}&date=${selectedDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setReservations(data.reservations || []);
      }
    } catch (err) {
      console.error('Error loading reservations:', err);
    }
  };

  const loadWaitlist = async () => {
    if (!restaurantId) return;

    try {
      const response = await fetch(
        `${CONFIG.API_BASE}/api/reservations/waitlist?restaurant_id=${restaurantId}`
      );
      if (response.ok) {
        const data = await response.json();
        setWaitlist(data.entries || []);
      }
    } catch (err) {
      console.error('Error loading waitlist:', err);
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

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <Text size="2xl" weight="bold" color="primary" style={{ marginBottom: 8 }}>
          📅 Reservas
        </Text>
        <Text color="secondary">
          Gestão de reservas e fila virtual — Inspirado no CoverManager
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
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Reservations */}
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
                      <Text weight="bold">{reservation.reservation_code}</Text>
                      <Text size="sm" color="secondary">
                        {reservation.customer_name || 'Cliente'}
                      </Text>
                    </div>
                    <Badge
                      label={getStatusLabel(reservation.status)}
                      variant={getStatusColor(reservation.status)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <Text size="sm" color="secondary">
                      🕐 {reservation.reservation_time}
                    </Text>
                    <Text size="sm" color="secondary">
                      👥 {reservation.party_size} pessoas
                    </Text>
                    {reservation.table_id && (
                      <Text size="sm" color="secondary">
                        🪑 Mesa {reservation.table_id.substring(0, 8)}
                      </Text>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Waitlist */}
        <Card surface="layer1" padding="lg">
          <Text size="lg" weight="bold" color="primary" style={{ marginBottom: 16 }}>
            Fila Virtual ({waitlist.length})
          </Text>
          {waitlist.length === 0 ? (
            <Text color="secondary">Nenhum cliente na fila.</Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {waitlist.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    borderLeft: `4px solid ${entry.position === 1 ? '#32d74b' : '#ff9500'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <div>
                      <Text weight="bold">#{entry.position}</Text>
                      <Text size="sm" color="secondary">
                        {entry.customer_name || entry.customer_phone}
                      </Text>
                    </div>
                    {entry.estimated_wait_time && (
                      <Text size="sm" color="secondary">
                        ⏱ {entry.estimated_wait_time} min
                      </Text>
                    )}
                  </div>
                  <Text size="sm" color="secondary">
                    👥 {entry.party_size} pessoas
                  </Text>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

