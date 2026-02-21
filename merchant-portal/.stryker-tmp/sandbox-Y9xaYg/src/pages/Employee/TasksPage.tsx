/**
 * Employee Tasks - Tarefas do Funcionário
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/navigation/Header';
import { BottomTabs } from '../../components/navigation/BottomTabs';
import { EmptyState } from '../../components/ui/EmptyState';

export function EmployeeTasksPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress'>('all');

  // TODO: Integrar com Task Engine
  // TODO: Buscar tasks do usuário
  // TODO: Atualizar status em tempo real
  const tasks: any[] = []; // Placeholder

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header
        title="Tarefas"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '4px 8px',
                backgroundColor: filter === 'all' ? '#667eea' : '#f0f0f0',
                color: filter === 'all' ? '#fff' : '#666',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('pending')}
              style={{
                padding: '4px 8px',
                backgroundColor: filter === 'pending' ? '#667eea' : '#f0f0f0',
                color: filter === 'pending' ? '#fff' : '#666',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Pendentes
            </button>
          </div>
        }
      />

      <div style={{ padding: '16px' }}>
        {tasks.length === 0 ? (
          <EmptyState
            title="Nenhuma tarefa pendente"
            message="Parabéns! Você está em dia"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/employee/tasks/${task.id}`)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #e0e0e0',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{task.title}</h3>
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: task.status === 'PENDING' ? '#ffc107' : '#28a745',
                    color: '#fff',
                  }}>
                    {task.status === 'PENDING' ? 'Pendente' : 'Em andamento'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                  Tipo: {task.type} | SLA: {task.sla_remaining || 'N/A'}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Iniciar tarefa
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#667eea',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {task.status === 'PENDING' ? 'Iniciar' : 'Concluir'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomTabs role="employee" />
    </div>
  );
}
