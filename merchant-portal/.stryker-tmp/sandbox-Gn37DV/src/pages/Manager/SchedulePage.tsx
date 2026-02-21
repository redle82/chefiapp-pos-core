/**
 * Manager Schedule - Escala do Dia
 * 
 * Lista de turnos por função, faltas, atrasos, substituições
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/navigation/Header';
import { BottomTabs } from '../../components/navigation/BottomTabs';
import { EmptyState } from '../../components/ui/EmptyState';
import type { Shift } from '../../types/schedule';

export function ManagerSchedulePage() {
  const navigate = useNavigate();
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  // TODO: Integrar com Employee Time Engine
  // TODO: Buscar turnos do dia
  // TODO: Integrar check-in/check-out
  const shifts: Shift[] = []; // Placeholder

  const roles = ['WAITER', 'KITCHEN', 'BAR', 'CLEANING'] as const;

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header
        title="Escala"
        subtitle={`${new Date(selectedDate).toLocaleDateString('pt-BR')}`}
        actions={
          <button
            onClick={() => navigate('/manager/schedule/create')}
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
            + Novo Turno
          </button>
        }
      />

      <div style={{ padding: '16px' }}>
        {shifts.length === 0 ? (
          <EmptyState
            title="Nenhum turno hoje"
            message="Crie turnos para organizar a equipe"
            action={{
              label: 'Criar turno',
              onPress: () => navigate('/manager/schedule/create'),
            }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {roles.map((role) => {
              const roleShifts = shifts.filter((s) => s.role === role);
              if (roleShifts.length === 0) return null;

              return (
                <div key={role} style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #e0e0e0',
                }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                    {role === 'WAITER' ? 'Garçom' :
                     role === 'KITCHEN' ? 'Cozinha' :
                     role === 'BAR' ? 'Bar' : 'Limpeza'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {roleShifts.map((shift) => (
                      <div
                        key={shift.id}
                        style={{
                          padding: '12px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600 }}>
                            {/* TODO: Buscar nome do usuário */}
                            Usuário {shift.user_id.substring(0, 8)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {new Date(shift.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(shift.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: shift.status === 'CONFIRMED' ? '#28a745' : '#ffc107',
                            color: '#fff',
                          }}>
                            {shift.status === 'CONFIRMED' ? 'Confirmado' : 'Agendado'}
                          </span>
                          <button
                            onClick={() => navigate(`/manager/schedule/${shift.id}`)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: 'transparent',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Ver
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomTabs role="manager" />
    </div>
  );
}
