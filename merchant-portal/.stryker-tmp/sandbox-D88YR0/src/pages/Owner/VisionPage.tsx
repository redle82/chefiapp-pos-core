/**
 * Owner Vision - Visão (KPIs de negócio)
 *
 * Pergunta: "Como está o negócio?"
 *
 * Componentes:
 * - KPIs principais
 * - Previsão operacional
 * - Alertas críticos
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/navigation/Header';
import { BottomTabs } from '../../components/navigation/BottomTabs';
import { DataModeBanner } from '../../components/DataModeBanner';
import { useRestaurantRuntime } from '../../context/RestaurantRuntimeContext';

export function OwnerVisionPage() {
  const navigate = useNavigate();
  const { runtime } = useRestaurantRuntime();

  // TODO: Integrar com Core para buscar KPIs reais
  // TODO: Buscar previsão operacional
  // TODO: Buscar alertas críticos

  const kpis = [
    { title: 'Pedidos Hoje', value: 156, variation: { value: 12, isPositive: true } },
    { title: 'Receita Hoje', value: 'R$ 8.450', variation: { value: 8, isPositive: true } },
    { title: 'SLAs Violados', value: 3, variation: { value: -2, isPositive: true } },
    { title: 'Estoque Crítico', value: 1, variation: { value: 0, isPositive: true } },
  ];

  const forecast = {
    reservations: 12,
    peakTime: '21:00',
    suggestion: 'Adicionar 1 pessoa no turno',
  };

  const alerts = [
    { severity: 'critical' as const, message: '3 itens com estoque crítico', action: 'Ver estoque' },
  ];

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header title="Visão" subtitle="KPIs de negócio" />
      <DataModeBanner dataMode={runtime.dataMode} />
      <div style={{ padding: '16px' }}>
        {/* KPIs */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            📊 KPIs PRINCIPAIS
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {kpis.map((kpi, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #e0e0e0',
                }}
              >
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                  {kpi.title}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
                  {kpi.value}
                </div>
                {kpi.variation && (
                  <div style={{
                    fontSize: '12px',
                    color: kpi.variation.isPositive ? '#28a745' : '#dc3545',
                  }}>
                    {kpi.variation.isPositive ? '+' : ''}{kpi.variation.value}% vs ontem
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Previsão Operacional */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            📊 PREVISÃO OPERACIONAL
          </h3>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>Reservas confirmadas:</strong> {forecast.reservations}
            </div>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>Pico previsto:</strong> {forecast.peakTime}
            </div>
            <div style={{ fontSize: '14px', marginBottom: '12px' }}>
              <strong>Sugestão:</strong> {forecast.suggestion}
            </div>
            <button
              onClick={() => navigate('/manager/schedule')}
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
              Ver Escala
            </button>
          </div>
        </div>

        {/* Alertas Críticos */}
        {alerts.length > 0 && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              ⚠️ ALERTAS CRÍTICOS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    border: `1px solid ${alert.severity === 'critical' ? '#dc3545' : '#ffc107'}`,
                  }}
                >
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: alert.severity === 'critical' ? '#dc3545' : '#ffc107',
                    marginBottom: '8px',
                  }}>
                    {alert.severity === 'critical' ? '🔴' : '🟡'} {alert.message}
                  </div>
                  <button
                    onClick={() => navigate('/owner/purchases')}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: alert.severity === 'critical' ? '#dc3545' : '#ffc107',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {alert.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomTabs role="owner" />
    </div>
  );
}
