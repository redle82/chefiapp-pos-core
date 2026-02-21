/**
 * Employee Mentor - Mentor IA do Funcionário
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/navigation/Header';
import { BottomTabs } from '../../components/navigation/BottomTabs';
import { EmptyState } from '../../components/ui/EmptyState';
import type { MentorshipMessage } from '../../types/mentor';

export function EmployeeMentorPage() {
  const navigate = useNavigate();

  // TODO: Integrar com Mentoria IA
  // TODO: Buscar mentoria contextual
  // TODO: Coletar feedback
  const mentorship: MentorshipMessage | null = null; // Placeholder

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header
        title="Mentor IA"
        subtitle="O que fazer agora"
      />

      <div style={{ padding: '16px' }}>
        {!mentorship ? (
          <EmptyState
            title="Nada para agora"
            message="Continue assim!"
          />
        ) : (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #e0e0e0',
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              {mentorship.content.title}
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              {mentorship.content.message}
            </p>
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Contexto:</div>
              <div style={{ fontSize: '14px' }}>
                Baseado em: {mentorship.context.pattern} ({mentorship.context.frequency}x)
              </div>
            </div>
            <div style={{
              backgroundColor: '#e7f3ff',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Ação Sugerida:
              </div>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                <strong>O que:</strong> {mentorship.content.action.what}
              </div>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                <strong>Por quê:</strong> {mentorship.content.action.why}
              </div>
              <div style={{ fontSize: '14px' }}>
                <strong>Como:</strong> {mentorship.content.action.how}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  // TODO: Executar ação
                }}
                style={{
                  flex: 1,
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
                Fazer Agora
              </button>
              <button
                onClick={() => navigate('/employee/mentor/training')}
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
                Ver Treino
              </button>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  // TODO: Marcar como útil
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Foi útil
              </button>
              <button
                onClick={() => {
                  // TODO: Marcar como não útil
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Não foi útil
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => navigate('/employee/mentor/training')}
            style={{
              padding: '16px',
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
              Treino Rápido (2 min)
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Micro-lição baseada no seu erro real
            </div>
          </button>
          <button
            onClick={() => navigate('/employee/mentor/feedback')}
            style={{
              padding: '16px',
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
              Feedback do Turno
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              3 pontos: forte / melhorar / próximo passo
            </div>
          </button>
        </div>
      </div>

      <BottomTabs role="employee" />
    </div>
  );
}
