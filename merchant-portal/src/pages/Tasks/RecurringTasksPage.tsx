/**
 * RecurringTasksPage - Página de Tarefas Recorrentes
 */

import React, { useState, useEffect } from 'react';
import { recurringTaskEngine, type RecurringTask } from '../../core/tasks/RecurringTaskEngine';
import { useRestaurantId } from '../../core/hooks/useRestaurantId';

export function RecurringTasksPage() {
  const { restaurantId, loading: loadingRestaurantId } = useRestaurantId();
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!restaurantId) return;
      
      const fetchedTasks = await recurringTaskEngine.list(restaurantId, true);
      setTasks(fetchedTasks);
      setLoading(false);
    };

    if (!loadingRestaurantId && restaurantId) {
      fetchTasks();
    }
  }, [restaurantId, loadingRestaurantId]);

  const handleGenerateToday = async () => {
    if (!restaurantId) return;

    try {
      const count = await recurringTaskEngine.generateForToday(restaurantId);
      alert(`${count} tarefas geradas para hoje!`);
    } catch (error) {
      console.error('Error generating tasks:', error);
      alert('Erro ao gerar tarefas');
    }
  };

  if (loading || loadingRestaurantId || !restaurantId) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: '#666' }}>Carregando tarefas recorrentes...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Tarefas Recorrentes</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleGenerateToday}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Gerar Tarefas para Hoje
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tasks.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
            <p>Nenhuma tarefa recorrente configurada</p>
            <button
              onClick={async () => {
                if (!restaurantId) return;
                await recurringTaskEngine.createDefaultOpeningTasks(restaurantId);
                await recurringTaskEngine.createDefaultClosingTasks(restaurantId);
                await recurringTaskEngine.createDefaultHACCPTasks(restaurantId);
                window.location.reload();
              }}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Criar Tarefas Padrão
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                    {task.name}
                  </h3>
                  {task.description && (
                    <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
                      {task.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#999', marginTop: '8px' }}>
                    <span>🔄 {task.frequency}</span>
                    {task.timeOfDay && <span>⏰ {task.timeOfDay}</span>}
                    <span>🏷️ {task.category}</span>
                    <span>⚡ {task.priority}</span>
                    <span>⏱️ {task.estimatedMinutes} min</span>
                  </div>
                </div>
                <div>
                  {task.isActive ? (
                    <span style={{ padding: '4px 8px', backgroundColor: '#28a745', color: 'white', borderRadius: '4px', fontSize: '12px' }}>
                      Ativa
                    </span>
                  ) : (
                    <span style={{ padding: '4px 8px', backgroundColor: '#6c757d', color: 'white', borderRadius: '4px', fontSize: '12px' }}>
                      Inativa
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
