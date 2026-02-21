/**
 * Manager Analysis - Análise & Padrões Invisíveis
 * 
 * Pergunta: "O que sempre dá errado?"
 * 
 * Componentes:
 * - Padrões detectados
 * - Gargalos recorrentes
 * - Turnos problemáticos
 * - Itens causadores
 * - Ações sugeridas
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/navigation/Header';
import { BottomTabs } from '../../components/navigation/BottomTabs';
import { EmptyState } from '../../components/ui/EmptyState';

export function ManagerAnalysisPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'week' | 'month' | 'semester'>('week');

  // TODO: Integrar com Core Level 2 (Rule Engine)
  // TODO: Buscar padrões detectados automaticamente
  // TODO: Buscar gargalos recorrentes
  // TODO: Buscar turnos problemáticos
  // TODO: Buscar itens causadores
  // TODO: Buscar ações sugeridas

  const patterns = [
    {
      id: '1',
      title: 'SLAs violados em segundas',
      frequency: '80% das segundas',
      cause: 'Substaffing',
      impact: 'high' as const,
      fix: 'Ajustar escala segunda 20h',
    },
  ];

  const bottlenecks = [
    {
      id: '1',
      name: 'KDS BAR',
      frequency: '3x por semana',
      time: '20h - 22h',
      cause: 'Falta de limão',
      solution: 'Aumentar estoque mínimo',
    },
  ];

  const problematicShifts = [
    {
      id: '1',
      shift: 'Segunda 20h',
      slaViolations: 5,
      staff: '2 pessoas (substaffed)',
      correlation: 90,
    },
  ];

  const causingItems = [
    {
      id: '1',
      name: 'Caipirinha',
      delays: 12,
      period: 'esta semana',
      cause: 'Falta de limão',
      solution: 'Aumentar estoque mínimo',
    },
  ];

  const suggestedActions = [
    { id: '1', action: 'Ajustar escala segunda 20h', priority: 'high' as const },
    { id: '2', action: 'Aumentar estoque mínimo limão', priority: 'medium' as const },
    { id: '3', action: 'Trocar fornecedor limão', priority: 'low' as const },
  ];

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header
        title="Análise & Padrões"
        subtitle="O que sempre dá errado"
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
              <option value="week">Semana</option>
              <option value="month">Mês</option>
              <option value="semester">Semestre</option>
            </select>
          </div>
        }
      />

      <div style={{ padding: '16px' }}>
        {/* Padrões Detectados */}
        {patterns.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              🔍 PADRÕES DETECTADOS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {patterns.map((pattern) => (
                <div
                  key={pattern.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    border: `2px solid ${pattern.impact === 'high' ? '#dc3545' : '#ffc107'}`,
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                    Padrão: {pattern.title}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Frequência: {pattern.frequency}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Causa: {pattern.cause}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                    Impacto: {pattern.impact === 'high' ? 'Alto' : 'Médio'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => navigate('/manager/schedule')}
                      style={{
                        flex: 1,
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
                      Ver detalhes
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Aplicar fix automaticamente
                        navigate('/manager/schedule');
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Aplicar fix
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gargalos Recorrentes */}
        {bottlenecks.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              🚧 GARGALOS RECORRENTES
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {bottlenecks.map((bottleneck) => (
                <div
                  key={bottleneck.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #ffc107',
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                    Gargalo: {bottleneck.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Frequência: {bottleneck.frequency}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Horário: {bottleneck.time}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Causa: {bottleneck.cause}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                    Solução: {bottleneck.solution}
                  </div>
                  <button
                    onClick={() => navigate('/owner/purchases')}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#ffc107',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Aplicar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Turnos Problemáticos */}
        {problematicShifts.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              📅 TURNOS PROBLEMÁTICOS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {problematicShifts.map((shift) => (
                <div
                  key={shift.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #ffc107',
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                    Turno: {shift.shift}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    SLAs violados: {shift.slaViolations}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Staff: {shift.staff}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                    Correlação: {shift.correlation}%
                  </div>
                  <button
                    onClick={() => navigate('/manager/schedule')}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#ffc107',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Ajustar escala
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Itens Causadores */}
        {causingItems.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              🍽️ ITENS CAUSADORES
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {causingItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #ffc107',
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                    Item: {item.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Atrasos: {item.delays} {item.period}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Causa: {item.cause}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                    Solução: {item.solution}
                  </div>
                  <button
                    onClick={() => navigate('/owner/purchases')}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#ffc107',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Aplicar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ações Sugeridas */}
        {suggestedActions.length > 0 && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              ✅ AÇÕES SUGERIDAS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {suggestedActions.map((action) => (
                <div
                  key={action.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '12px',
                    border: `1px solid ${action.priority === 'high' ? '#dc3545' : action.priority === 'medium' ? '#ffc107' : '#28a745'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: '14px' }}>
                    {action.priority === 'high' ? '1.' : action.priority === 'medium' ? '2.' : '3.'} {action.action}
                  </div>
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: action.priority === 'high' ? '#dc3545' : action.priority === 'medium' ? '#ffc107' : '#28a745',
                    color: '#fff',
                  }}>
                    {action.priority === 'high' ? 'Alta' : action.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                // TODO: Aplicar todas as ações
                navigate('/manager/schedule');
              }}
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
              Aplicar todas
            </button>
          </div>
        )}

        {patterns.length === 0 && bottlenecks.length === 0 && problematicShifts.length === 0 && causingItems.length === 0 && (
          <EmptyState
            title="Nenhum padrão detectado"
            message="Continue monitorando para identificar padrões"
          />
        )}
      </div>

      <BottomTabs role="manager" />
    </div>
  );
}
