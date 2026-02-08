/**
 * RecommendationCard - Card de Recomendação Individual
 */

import React from 'react';
import { useMentor } from '../../context/MentorContext';
import type { MentorRecommendation } from '../../core/mentor/MentorEngine';

interface Props {
  recommendation: MentorRecommendation;
}

export function RecommendationCard({ recommendation }: Props) {
  const { acceptRecommendation, rejectRecommendation } = useMentor();

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'transformative': return '#9c27b0';
      case 'high': return '#28a745';
      case 'medium': return '#ffc107';
      case 'low': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'transformative': return 'Transformador';
      case 'high': return 'Alto';
      case 'medium': return 'Médio';
      case 'low': return 'Baixo';
      default: return 'Desconhecido';
    }
  };

  return (
    <div
      style={{
        border: `2px solid ${getImpactColor(recommendation.estimatedImpact)}`,
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#fff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
              {recommendation.title}
            </h3>
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: getImpactColor(recommendation.estimatedImpact),
                color: 'white',
              }}
            >
              Impacto: {getImpactLabel(recommendation.estimatedImpact)}
            </span>
          </div>
          <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
            {recommendation.description}
          </p>
          {recommendation.benefits.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <strong style={{ fontSize: '14px' }}>Benefícios:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '14px', color: '#666' }}>
                {recommendation.benefits.map((benefit, idx) => (
                  <li key={idx}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}
          {recommendation.requirements.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <strong style={{ fontSize: '14px' }}>Requisitos:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '14px', color: '#666' }}>
                {recommendation.requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            Criado em: {recommendation.createdAt.toLocaleString()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {recommendation.status === 'pending' && (
            <>
              <button
                onClick={() => acceptRecommendation(recommendation.id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Aceitar
              </button>
              <button
                onClick={() => rejectRecommendation(recommendation.id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Rejeitar
              </button>
            </>
          )}
          {recommendation.status === 'accepted' && (
            <span style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', borderRadius: '4px', fontSize: '12px' }}>
              Aceita
            </span>
          )}
          {recommendation.status === 'rejected' && (
            <span style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', borderRadius: '4px', fontSize: '12px' }}>
              Rejeitada
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
