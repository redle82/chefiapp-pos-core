/**
 * EmployeeProfileCard - Card de Perfil de Funcionário
 */

import React from 'react';
import type { EmployeeProfile } from '../../core/people/EmployeeProfileEngine';

interface Props {
  profile: EmployeeProfile;
  onSelect: () => void;
}

export function EmployeeProfileCard({ profile, onSelect }: Props) {
  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'expert': return '#28a745';
      case 'advanced': return '#007bff';
      case 'intermediate': return '#ffc107';
      case 'beginner': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 0.9) return '#28a745';
    if (score >= 0.7) return '#ffc107';
    if (score >= 0.5) return '#ff9800';
    return '#dc3545';
  };

  const onTimeRate = profile.totalTasksCompleted > 0
    ? (profile.totalTasksOnTime / profile.totalTasksCompleted) * 100
    : 0;

  return (
    <div
      onClick={onSelect}
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: '#fff',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Funcionário #{profile.employeeId.slice(0, 8)}
          </h3>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '14px' }}>
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: getPerformanceColor(profile.currentPerformanceLevel),
                color: 'white',
                fontWeight: 600,
              }}
            >
              {profile.currentPerformanceLevel.toUpperCase()}
            </span>
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: getReliabilityColor(profile.reliabilityScore),
                color: 'white',
                fontWeight: 600,
              }}
            >
              Confiabilidade: {Math.round(profile.reliabilityScore * 100)}%
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#667eea' }}>
            {Math.round(profile.impactScore)}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>Impact Score</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Velocidade</div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>
            {profile.speedRating.toFixed(1)}x
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Multitarefa</div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>
            {profile.multitaskCapability.toFixed(1)}x
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Tarefas Completas</div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>
            {profile.totalTasksCompleted}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Taxa de Pontualidade</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: onTimeRate >= 80 ? '#28a745' : '#dc3545' }}>
            {Math.round(onTimeRate)}%
          </div>
        </div>
      </div>

      {profile.averageDelayMinutes > 0 && (
        <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '14px' }}>
          ⚠️ Atraso médio: {Math.round(profile.averageDelayMinutes)} minutos
        </div>
      )}
    </div>
  );
}
