/**
 * BottomTabs - Navegação inferior por perfil
 * 
 * Componente reutilizável que renderiza tabs diferentes baseado no perfil do usuário
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { UserRole } from '../../types/navigation';
import { EMPLOYEE_TABS, MANAGER_TABS, OWNER_TABS } from '../../types/navigation';

interface Props {
  role: UserRole;
}

export function BottomTabs({ role }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = 
    role === 'employee' ? EMPLOYEE_TABS :
    role === 'manager' ? MANAGER_TABS :
    OWNER_TABS;

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderTop: '1px solid #e0e0e0',
      padding: '8px 0',
      zIndex: 1000,
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => navigate(tab.path)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 16px',
            border: 'none',
            background: 'transparent',
            color: isActive(tab.path) ? '#667eea' : '#666',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
