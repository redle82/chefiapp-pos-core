/**
 * TaskCard - Card de Tarefa Individual
 */

import React from 'react';
import type { Task } from '../../core/tasks/TaskFiltering';

interface Props {
  task: Task;
  onSelect: () => void;
  variant?: 'light' | 'dark';
}

const VPC_DARK = {
  surface: '#141414',
  border: '#262626',
  text: '#fafafa',
  textMuted: '#a3a3a3',
  radius: 8,
};

export function TaskCard({ task, onSelect, variant = 'light' }: Props) {
  const isDark = variant === 'dark';
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc3545';
      case 'high': return '#ffc107';
      case 'normal': return '#007bff';
      case 'low': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'in_progress': return '#007bff';
      case 'overdue': return '#dc3545';
      case 'pending': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 0) {
      const absMin = Math.abs(minutes);
      const absHours = Math.floor(absMin / 60);
      const absDays = Math.floor(absHours / 24);
      if (absMin < 60) return `Atrasado há ${absMin} min`;
      if (absHours < 24) return `Atrasado há ~${absHours} h`;
      return `Atrasado há ~${absDays} dia${absDays !== 1 ? "s" : ""}`;
    }
    if (minutes < 60) return `Em ${minutes} min`;
    if (hours < 24) return `Em ${hours}h`;
    return `Em ${days} dias`;
  };

  return (
    <div
      onClick={onSelect}
      style={{
        border: `1px solid ${isDark ? VPC_DARK.border : '#e0e0e0'}`,
        borderRadius: isDark ? VPC_DARK.radius : 8,
        padding: 16,
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: isDark ? VPC_DARK.surface : '#fff',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, flex: 1, color: isDark ? VPC_DARK.text : undefined }}>
          {task.title}
        </h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: getPriorityColor(task.priority),
              color: 'white',
            }}
          >
            {task.priority.toUpperCase()}
          </span>
          <span
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12,
              backgroundColor: getStatusColor(task.status),
              color: 'white',
            }}
          >
            {task.status}
          </span>
        </div>
      </div>

      {task.description && (
        <p style={{ margin: '0 0 8px', fontSize: 14, color: isDark ? VPC_DARK.textMuted : '#666' }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: isDark ? VPC_DARK.textMuted : '#999' }}>
        <span>📅 {formatDueDate(task.dueAt)}</span>
        {task.category && <span>🏷️ {task.category}</span>}
      </div>
    </div>
  );
}
