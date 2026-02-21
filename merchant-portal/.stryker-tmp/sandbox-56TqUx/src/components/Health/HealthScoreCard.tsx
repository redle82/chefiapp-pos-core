/**
 * HealthScoreCard - Card de Score de Saúde
 */
// @ts-nocheck


import React from 'react';
import type { RestaurantHealthScore } from '../../core/health/HealthEngine';

interface Props {
  healthScore: RestaurantHealthScore;
}

export function HealthScoreCard({ healthScore }: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#28a745';
      case 'degraded': return '#ffc107';
      case 'critical': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy': return 'Saudável';
      case 'degraded': return 'Degradado';
      case 'critical': return 'Crítico';
      default: return 'Desconhecido';
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        border: `2px solid ${getStatusColor(healthScore.overallStatus)}`,
        borderRadius: '12px',
        backgroundColor: '#fff',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
        Score Geral de Saúde
      </div>
      <div
        style={{
          fontSize: '64px',
          fontWeight: 700,
          color: getStatusColor(healthScore.overallStatus),
          marginBottom: '8px',
        }}
      >
        {Math.round(healthScore.overallScore * 100)}
      </div>
      <div
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: getStatusColor(healthScore.overallStatus),
          marginBottom: '16px',
        }}
      >
        {getStatusLabel(healthScore.overallStatus)}
      </div>

      {/* Breakdown Visual */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Operacional</div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>
            {Math.round(healthScore.operationalScore * 100)}%
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Humano</div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>
            {Math.round(healthScore.humanScore * 100)}%
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Financeiro</div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>
            {Math.round(healthScore.financialScore * 100)}%
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Sistema</div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>
            {Math.round(healthScore.systemScore * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}
