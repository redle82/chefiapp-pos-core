/**
 * Manager Reservations - Agenda de Reservas
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/navigation/Header';
import { BottomTabs } from '../../components/navigation/BottomTabs';
import { EmptyState } from '../../components/ui/EmptyState';
import type { Reservation } from '../../types/reservations';

export function ManagerReservationsPage() {
  const navigate = useNavigate();
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');

  // TODO: Integrar com Reservation Engine
  // TODO: Buscar reservas
  // TODO: Integrar com gm_reservations
  const reservations: Reservation[] = []; // Placeholder

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header
        title="Reservas"
        subtitle={new Date(selectedDate).toLocaleDateString('pt-BR')}
        actions={
          <button
            onClick={() => navigate('/manager/reservations/create')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#667eea',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Nova Reserva
          </button>
        }
      />

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setView('day')}
            style={{
              padding: '8px 16px',
              backgroundColor: view === 'day' ? '#667eea' : '#f0f0f0',
              color: view === 'day' ? '#fff' : '#666',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Hoje
          </button>
          <button
            onClick={() => setView('week')}
            style={{
              padding: '8px 16px',
              backgroundColor: view === 'week' ? '#667eea' : '#f0f0f0',
              color: view === 'week' ? '#fff' : '#666',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Semana
          </button>
          <button
            onClick={() => setView('month')}
            style={{
              padding: '8px 16px',
              backgroundColor: view === 'month' ? '#667eea' : '#f0f0f0',
              color: view === 'month' ? '#fff' : '#666',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Mês
          </button>
        </div>

        {reservations.length === 0 ? (
          <EmptyState
            title="Nenhuma reserva hoje"
            message="Crie reservas para organizar a agenda"
            action={{
              label: 'Nova reserva',
              onPress: () => navigate('/manager/reservations/create'),
            }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                onClick={() => navigate(`/manager/reservations/${reservation.id}`)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #e0e0e0',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                      {reservation.customer_name}
                    </h3>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {reservation.party_size} pessoas • {reservation.reservation_time}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: reservation.status === 'CONFIRMED' ? '#28a745' : '#ffc107',
                    color: '#fff',
                  }}>
                    {reservation.status === 'CONFIRMED' ? 'Confirmada' : 'Pendente'}
                  </span>
                </div>
                {reservation.table_id && (
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Mesa: {reservation.table_id.substring(0, 8)}
                  </div>
                )}
                {reservation.special_requests && (
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                    {reservation.special_requests}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/manager/reservations/map')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Mapa de Mesas
          </button>
          <button
            onClick={() => navigate('/manager/reservations/forecast')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Previsão
          </button>
        </div>
      </div>

      <BottomTabs role="manager" />
    </div>
  );
}
