/**
 * Owner Simulation - Simulação de Futuro (Time Warp UI)
 * 
 * Pergunta: "E se...?"
 * 
 * Componentes:
 * - Cenário base
 * - Ajustes (staff, estoque, reservas)
 * - Impacto previsto
 * - Comparar cenários
 * - Alertas de risco
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/navigation/Header';
import { BottomTabs } from '../../components/navigation/BottomTabs';

export function OwnerSimulationPage() {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState({
    period: 'next_week',
    staff: 3,
    stockMultiplier: 1.0,
    reservations: 'confirmed',
  });
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // TODO: Integrar com Time Warp Engine
  // TODO: Executar simulação real
  // TODO: Comparar cenários
  // TODO: Aplicar cenário

  const baseScenario = {
    period: 'Próxima semana',
    staff: 3,
    stock: 'Atual',
    reservations: 'Confirmadas',
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    // TODO: Executar simulação real
    setTimeout(() => {
      setSimulationResult({
        slaViolations: { base: 10, adjusted: 6 },
        cost: { additional: 500, period: 'semana' },
        roi: 'Positivo (menos reclamações)',
      });
      setIsSimulating(false);
    }, 2000);
  };

  const scenarios = [
    { id: 'A', name: 'Staff 3', slaViolations: 10 },
    { id: 'B', name: 'Staff 4', slaViolations: 6, difference: -40 },
  ];

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header
        title="Simulação de Futuro"
        subtitle="E se...?"
        onBack={() => navigate('/owner/vision')}
      />

      <div style={{ padding: '16px' }}>
        {/* Cenário Base */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            🎯 CENÁRIO BASE
          </h3>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>Período:</strong> {baseScenario.period}
            </div>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>Staff:</strong> {baseScenario.staff} pessoas/turno
            </div>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>Estoque:</strong> {baseScenario.stock}
            </div>
            <div style={{ fontSize: '14px' }}>
              <strong>Reservas:</strong> {baseScenario.reservations}
            </div>
          </div>
        </div>

        {/* Ajustes */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            ⚙️ AJUSTES
          </h3>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Staff: {scenario.staff} pessoas/turno
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setScenario({ ...scenario, staff: Math.max(1, scenario.staff - 1) })}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f0f0f0',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Diminuir
                </button>
                <span style={{ fontSize: '18px', fontWeight: 600, minWidth: '40px', textAlign: 'center' }}>
                  {scenario.staff}
                </span>
                <button
                  onClick={() => setScenario({ ...scenario, staff: scenario.staff + 1 })}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f0f0f0',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Aumentar
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Estoque mínimo: {Math.round(scenario.stockMultiplier * 100)}%
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setScenario({ ...scenario, stockMultiplier: Math.max(0.5, scenario.stockMultiplier - 0.2) })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#f0f0f0',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Diminuir 20%
                </button>
                <button
                  onClick={() => setScenario({ ...scenario, stockMultiplier: scenario.stockMultiplier + 0.2 })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#f0f0f0',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Aumentar 20%
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Reservas: {scenario.reservations === 'confirmed' ? 'Confirmadas' : 'Adicionar'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setScenario({ ...scenario, reservations: 'confirmed' })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: scenario.reservations === 'confirmed' ? '#667eea' : '#f0f0f0',
                    color: scenario.reservations === 'confirmed' ? '#fff' : '#666',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Confirmadas
                </button>
                <button
                  onClick={() => setScenario({ ...scenario, reservations: 'add' })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: scenario.reservations === 'add' ? '#667eea' : '#f0f0f0',
                    color: scenario.reservations === 'add' ? '#fff' : '#666',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botão Simular */}
        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isSimulating ? '#ccc' : '#667eea',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isSimulating ? 'not-allowed' : 'pointer',
            marginBottom: '24px',
          }}
        >
          {isSimulating ? 'Simulando...' : 'Simular'}
        </button>

        {/* Impacto Previsto */}
        {simulationResult && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              📊 IMPACTO PREVISTO
            </h3>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #e0e0e0',
            }}>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                Se aumentar staff para {scenario.staff}:
              </div>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                SLAs violados: {simulationResult.slaViolations.adjusted} (redução de {Math.abs(simulationResult.slaViolations.base - simulationResult.slaViolations.adjusted)})
              </div>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                Custo adicional: R$ {simulationResult.cost.additional}/{simulationResult.cost.period}
              </div>
              <div style={{ fontSize: '14px', marginBottom: '12px' }}>
                ROI: {simulationResult.roi}
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
                Ver detalhes
              </button>
            </div>
          </div>
        )}

        {/* Comparar Cenários */}
        {simulationResult && scenarios.length > 1 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              🔄 COMPARAR CENÁRIOS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {scenarios.map((sc) => (
                <div
                  key={sc.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    border: sc.id === 'B' ? '2px solid #667eea' : '1px solid #e0e0e0',
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                    Cenário {sc.id}: {sc.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    SLAs: {sc.slaViolations} violados
                  </div>
                  {sc.difference && (
                    <div style={{ fontSize: '14px', color: sc.difference < 0 ? '#28a745' : '#dc3545', marginBottom: '12px' }}>
                      Diferença: {sc.difference}%
                    </div>
                  )}
                  {sc.id === 'B' && (
                    <button
                      onClick={() => {
                        // TODO: Aplicar cenário B
                        navigate('/manager/schedule');
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
                      Aplicar Cenário {sc.id}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alertas de Risco */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            ⚠️ ALERTAS DE RISCO
          </h3>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #ffc107',
          }}>
            <div style={{ fontSize: '14px' }}>
              "Se não aumentar staff, previsão: 15 SLAs violados."
            </div>
          </div>
        </div>
      </div>

      <BottomTabs role="owner" />
    </div>
  );
}
