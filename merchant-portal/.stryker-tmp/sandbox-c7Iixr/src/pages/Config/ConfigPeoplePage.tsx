/**
 * ConfigPeoplePage - Configuração de Pessoas
 * 
 * Gerencia funcionários, papéis e escalas.
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RestaurantPeopleSection } from './RestaurantPeopleSection';
import { RolesSummarySection } from './RolesSummarySection';

export function ConfigPeoplePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isEmployeesTab = location.pathname.includes('/employees') || !location.pathname.includes('/');
  const isRolesTab = location.pathname.includes('/roles');

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, marginBottom: '8px', color: 'var(--text-primary)' }}>
          Pessoas
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          Gerencie funcionários, papéis e escalas.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--surface-border)' }}>
        <button
          onClick={() => navigate('/config/people/employees')}
          style={{
            padding: '12px 16px',
            border: 'none',
            borderBottom: isEmployeesTab ? '2px solid var(--color-primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontWeight: isEmployeesTab ? 600 : 400,
            color: isEmployeesTab ? 'var(--color-primary)' : 'var(--text-secondary)',
          }}
        >
          Funcionários
        </button>
        <button
          onClick={() => navigate('/config/people/roles')}
          style={{
            padding: '12px 16px',
            border: 'none',
            borderBottom: isRolesTab ? '2px solid var(--color-primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontWeight: isRolesTab ? 600 : 400,
            color: isRolesTab ? 'var(--color-primary)' : 'var(--text-secondary)',
          }}
        >
          Papéis
        </button>
        <button
          onClick={() => navigate('/manager/schedule')}
          style={{
            padding: '12px 16px',
            border: 'none',
            borderBottom: '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontWeight: 400,
            color: 'var(--text-secondary)',
          }}
        >
          Escalas →
        </button>
      </div>

      {/* Conteúdo: FASE 3 Passo 1 — pessoas operacionais (gm_restaurant_people) com código/QR */}
      {isEmployeesTab && <RestaurantPeopleSection />}
      {/* FASE 3 Passo 4: resumo do que cada papel pode fazer */}
      {isRolesTab && <RolesSummarySection />}
    </div>
  );
}
