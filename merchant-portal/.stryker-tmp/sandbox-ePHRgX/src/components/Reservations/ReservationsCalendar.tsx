/**
 * ReservationsCalendar - Calendário de Reservas
 * 
 * Componente placeholder para calendário visual
 */
// @ts-nocheck


import React from 'react';

interface Props {
  reservations: any[];
  onDateSelect: (date: Date) => void;
}

export function ReservationsCalendar({ reservations: _reservations, onDateSelect: _onDateSelect }: Props) {
  // Placeholder - pode ser implementado com uma biblioteca de calendário
  return (
    <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
      <p>Calendário de reservas (a implementar)</p>
    </div>
  );
}
