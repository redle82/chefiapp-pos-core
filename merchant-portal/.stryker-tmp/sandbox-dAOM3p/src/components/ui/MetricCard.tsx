/**
 * MetricCard - Card de métrica reutilizável
 * 
 * Usado para mostrar KPIs e métricas
 */
// @ts-nocheck


import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  variation?: {
    value: number;
    isPositive: boolean;
  };
  trend?: 'up' | 'down' | 'stable';
}

export function MetricCard({ title, value, variation, trend }: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      case 'stable': return '→';
      default: return '';
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #e0e0e0',
      }}
    >
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
        {title}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
        {value}
      </div>
      {variation && (
        <div style={{
          fontSize: '12px',
          color: variation.isPositive ? '#28a745' : '#dc3545',
        }}>
          {variation.isPositive ? '+' : ''}{variation.value}% vs ontem {getTrendIcon()}
        </div>
      )}
    </div>
  );
}
