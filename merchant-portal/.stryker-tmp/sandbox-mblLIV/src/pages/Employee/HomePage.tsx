/**
 * Employee Home - Início do Funcionário
 * 
 * Status do turno + foco do dia
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/navigation/Header';
import { BottomTabs } from '../../components/navigation/BottomTabs';
import { EmptyState } from '../../components/ui/EmptyState';

export function EmployeeHomePage() {
  const navigate = useNavigate();

  // TODO: Integrar com Employee Time Engine
  // TODO: Buscar turno atual do usuário
  // TODO: Calcular tempo restante
  const hasShift = false; // Placeholder
  const shiftStatus = {
    status: 'Em turno',
    hours: '08:00 - 16:00',
    remaining: '4h 30min',
  };

  const focusItems = [
    { id: '1', title: 'Limpar cozinha', priority: 'high' },
    { id: '2', title: 'Verificar estoque', priority: 'medium' },
    { id: '3', title: 'Preparar ingredientes', priority: 'low' },
  ];

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header title="Início" subtitle="Status do turno" />

      <div style={{ padding: '16px' }}>
        {hasShift ? (
          <>
            {/* Shift Status Card */}
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                Status do Turno
              </h3>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <div>Status: {shiftStatus.status}</div>
                <div>Horário: {shiftStatus.hours}</div>
                <div>Tempo restante: {shiftStatus.remaining}</div>
              </div>
            </div>

            {/* Focus Card */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #e0e0e0',
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                Foco do Dia
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {focusItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>{item.title}</span>
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: item.priority === 'high' ? '#ff6b6b' : '#ffd93d',
                      color: '#fff',
                    }}>
                      {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/employee/tasks')}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#667eea',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Ver todas as tarefas
              </button>
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => navigate('/employee/operation')}
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
                Ver Operação
              </button>
              <button
                onClick={() => navigate('/employee/tasks')}
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
                Ver Tarefas
              </button>
            </div>
          </>
        ) : (
          <EmptyState
            title="Você não está em turno hoje"
            message="Verifique seus próximos turnos"
            action={{
              label: 'Ver próximos turnos',
              onPress: () => navigate('/employee/profile'),
            }}
          />
        )}
      </div>

      <BottomTabs role="employee" />
    </div>
  );
}
