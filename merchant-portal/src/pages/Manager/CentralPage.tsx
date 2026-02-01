/**
 * Manager Central - Central de Comando (Visão Sistêmica)
 * 
 * Pergunta: "O sistema está saudável?"
 * 
 * Componentes:
 * - Progresso operacional em tempo real
 * - Eventos relevantes (não tudo)
 * - SLAs em risco
 * - Restaurantes/turnos problemáticos
 * - Timeline dos últimos eventos críticos
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/navigation/Header';
import { BottomTabs } from '../../components/navigation/BottomTabs';

export function ManagerCentralPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('today');
  const [runId, setRunId] = useState<string | null>(null);

  // TODO: Integrar com Central de Comando real
  // TODO: Buscar progresso operacional
  // TODO: Buscar eventos relevantes
  // TODO: Buscar SLAs em risco
  // TODO: Buscar restaurantes/turnos problemáticos
  // TODO: Buscar timeline de eventos críticos

  const progress = {
    shiftProgress: 45,
    orders: { current: 23, target: 50 },
    slaViolations: 2,
    status: 'acceptable' as const,
  };

  const events = [
    { time: '14:30', event: 'Estoque crítico: Tomate', severity: 'critical' as const },
    { time: '14:25', event: 'SLA violado: Mesa 5', severity: 'critical' as const },
    { time: '14:20', event: 'Reserva confirmada: 4 pessoas', severity: 'info' as const },
  ];

  const slasAtRisk = [
    { id: '1', table: 'Mesa 5', order: '#123', time: '18min / 15min', status: 'delayed', cause: 'KDS BAR bloqueado' },
  ];

  const problematicShifts = [
    { restaurant: 'Restaurante A', shift: 'Turno 20h', slaViolations: 3, period: 'esta semana' },
  ];

  const timeline = [
    { time: '14:30', event: 'Estoque crítico', severity: 'critical' as const },
    { time: '14:25', event: 'SLA violado', severity: 'critical' as const },
    { time: '13:00', event: 'Pico de pedidos', severity: 'info' as const },
  ];

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header
        title="Central de Comando"
        subtitle="Visão sistêmica"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              style={{
                padding: '4px 8px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <option value="today">Hoje</option>
              <option value="week">Semana</option>
              <option value="month">Mês</option>
            </select>
            <input
              type="text"
              placeholder="Run ID"
              value={runId || ''}
              onChange={(e) => setRunId(e.target.value || null)}
              style={{
                padding: '4px 8px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '12px',
                width: '120px',
              }}
            />
          </div>
        }
      />

      <div style={{ padding: '16px' }}>
        {/* Progresso Operacional */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            📊 PROGRESSO OPERACIONAL
          </h3>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              Turno atual: {progress.shiftProgress}%
            </div>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              Pedidos: {progress.orders.current}/{progress.orders.target} (meta)
            </div>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              SLA: {progress.slaViolations} violado{progress.slaViolations > 1 ? 's' : ''} ({progress.status === 'acceptable' ? 'aceitável' : 'crítico'})
            </div>
          </div>
        </div>

        {/* Eventos Relevantes */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            📡 EVENTOS RELEVANTES (últimos 30min)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {events.map((evt, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '12px',
                  border: `1px solid ${evt.severity === 'critical' ? '#dc3545' : '#e0e0e0'}`,
                }}
              >
                <div style={{ fontSize: '14px' }}>
                  <strong>{evt.time}</strong> - {evt.event}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SLAs em Risco */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            ⏱️ SLAs EM RISCO ({slasAtRisk.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {slasAtRisk.map((sla) => (
              <div
                key={sla.id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid #ffc107',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                  {sla.table} - {sla.order}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                  Tempo: {sla.time} ({sla.status === 'delayed' ? 'atrasado' : 'em risco'})
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Causa: {sla.cause}
                </div>
                <button
                  onClick={() => navigate('/employee/operation')}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    backgroundColor: '#ffc107',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Ver KDS
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Restaurantes/Turnos Problemáticos */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            🏢 RESTAURANTES/TURNOS PROBLEMÁTICOS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {problematicShifts.map((shift, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid #ffc107',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                  {shift.restaurant} - {shift.shift}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                  {shift.slaViolations} SLA{shift.slaViolations > 1 ? 's' : ''} violado{shift.slaViolations > 1 ? 's' : ''} {shift.period}
                </div>
                <button
                  onClick={() => navigate('/manager/schedule')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#ffc107',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Ver detalhes
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Eventos Críticos */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            📅 TIMELINE EVENTOS CRÍTICOS
          </h3>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
              Hoje
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {timeline.map((item, index) => (
                <div key={index} style={{ fontSize: '14px' }}>
                  <strong>{item.time}</strong> █ {item.event}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <BottomTabs role="manager" />
    </div>
  );
}
