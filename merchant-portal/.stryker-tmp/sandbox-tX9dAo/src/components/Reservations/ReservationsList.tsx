/**
 * ReservationsList - Lista de Reservas
 */

import React from 'react';
import type { Reservation } from '../../core/reservations/ReservationEngine';

interface Props {
  reservations: Reservation[];
}

export function ReservationsList({ reservations }: Props) {
  if (reservations.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
        <p>Nenhuma reserva para esta data</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#007bff';
      case 'seated': return '#28a745';
      case 'completed': return '#6c757d';
      case 'cancelled': return '#dc3545';
      case 'no_show': return '#ff9800';
      default: return '#ffc107';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'online': return '🌐';
      case 'phone': return '📞';
      case 'walk_in': return '🚶';
      default: return '📋';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {reservations.map((reservation) => (
        <div
          key={reservation.id}
          style={{
            border: reservation.isOverbooking ? '2px solid #ff9800' : '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                  {reservation.customerName}
                </h3>
                <span style={{ fontSize: '16px' }}>{getSourceIcon(reservation.source)}</span>
                {reservation.isOverbooking && (
                  <span style={{ padding: '4px 8px', backgroundColor: '#ff9800', color: 'white', borderRadius: '4px', fontSize: '12px' }}>
                    OVERBOOKING
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                {reservation.reservationTime} • {reservation.partySize} pessoas
              </p>
              {reservation.customerPhone && (
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                  📞 {reservation.customerPhone}
                </p>
              )}
              {reservation.tableId && (
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                  🪑 Mesa: {reservation.tableId.substring(0, 8)}
                </p>
              )}
            </div>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: getStatusColor(reservation.status),
                color: 'white',
              }}
            >
              {reservation.status.toUpperCase()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
