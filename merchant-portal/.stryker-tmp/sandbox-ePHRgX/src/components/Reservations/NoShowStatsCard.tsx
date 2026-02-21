/**
 * NoShowStatsCard - Card de Estatísticas de No-Show
 */
// @ts-nocheck


import React from 'react';
import type { NoShowStats } from '../../core/reservations/ReservationEngine';

interface Props {
  stats: NoShowStats;
}

export function NoShowStatsCard({ stats }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
      <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total No-Shows</div>
        <div style={{ fontSize: '32px', fontWeight: 600, color: '#ff9800' }}>
          {stats.totalNoShows}
        </div>
      </div>
      <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Reservas</div>
        <div style={{ fontSize: '32px', fontWeight: 600, color: '#667eea' }}>
          {stats.totalReservations}
        </div>
      </div>
      <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Taxa de No-Show</div>
        <div style={{ fontSize: '32px', fontWeight: 600, color: stats.noShowRate > 10 ? '#dc3545' : '#28a745' }}>
          {stats.noShowRate.toFixed(1)}%
        </div>
      </div>
      <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Perda de Receita</div>
        <div style={{ fontSize: '32px', fontWeight: 600, color: '#dc3545' }}>
          R$ {stats.totalRevenueLoss.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
