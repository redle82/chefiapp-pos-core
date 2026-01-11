import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TimeMachineWidget } from '../../Analytics/components/TimeMachineWidget';
import { usePlan } from '../../../core/auth/PlanContext';

export const Step4_TheReveal: React.FC = () => {
    const { plan, upgradeTo } = usePlan();
    const navigate = useNavigate();

    return (
        <div className="reveal-container">
            <h2 className="migration-step-title">Sua operação unificada.</h2>
            <p className="migration-step-subtitle">
                Veja o que descobrimos sobre o passado do seu restaurante<br />
                e como ele se conecta com o seu futuro.
            </p>

            <div style={{ marginBottom: '40px', textAlign: 'left', position: 'relative' }}>
                {/* 
                  The TimeMachineWidget handles the blur internally via UpgradeLock, 
                  but we can force a "Preview Mode" here if needed. 
                  For now, we rely on the UpgradeLock's blurred state but add value on top.
                */}
                <TimeMachineWidget restaurantId="current-user" />

                {/* KPI Teasers - Visible even if chart is locked */}
                {plan === 'STANDARD' && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-around',
                        marginTop: '-160px', // Overlap the blurred chart area
                        marginBottom: '40px',
                        position: 'relative',
                        zIndex: 20
                    }}>
                        <div className="kpi-teaser">
                            <span className="teaser-label">Vendas Recuperadas</span>
                            <span className="teaser-value">R$ 45.2k</span>
                        </div>
                        <div className="kpi-teaser">
                            <span className="teaser-label">Melhor Prato</span>
                            <span className="teaser-value">Burger X</span>
                        </div>
                        <div className="kpi-teaser">
                            <span className="teaser-label">Dia + Lucrativo</span>
                            <span className="teaser-value">Sexta</span>
                        </div>
                    </div>
                )}
            </div>

            {plan === 'STANDARD' && (
                <div style={{
                    marginTop: '20px',
                    padding: '30px',
                    background: 'linear-gradient(to bottom, #ffffff, #eef2ff)',
                    borderRadius: '16px',
                    textAlign: 'center',
                    border: '1px solid #c7d2fe',
                    boxShadow: '0 10px 30px rgba(79, 70, 229, 0.1)'
                }}>
                    <h3 style={{ color: '#4338ca', marginBottom: '10px', fontSize: '1.4rem' }}>
                        Sua cozinha merece paz.
                    </h3>
                    <p style={{ marginBottom: '25px', color: '#3730a3', fontSize: '1.1rem', lineHeight: '1.6' }}>
                        Já recuperamos <b>1 ano de histórico</b>.<br />
                        No PRO, você unifica tudo: Caixa + Web + Delivery + Histórico.
                    </p>
                    <button
                        className="action-btn"
                        onClick={() => upgradeTo('PRO')}
                    >
                        Assumir controle total agora
                    </button>
                    <p style={{ marginTop: '15px', fontSize: '0.9rem', color: '#666', fontWeight: 500 }}>
                        R$ 299 / mês <span style={{ fontSize: '0.8em', fontWeight: 400 }}>(Menos que 1 pedido por dia)</span>
                    </p>
                    <p style={{ marginTop: '15px', fontSize: '0.8rem', color: '#666' }}>
                        <a href="/app/dashboard" style={{ color: 'inherit', textDecoration: 'underline' }}>
                            Continuar no Plano Grátis (Sem Histórico)
                        </a>
                    </p>
                </div>
            )}

            {plan !== 'STANDARD' && (
                <button
                    className="action-btn"
                    onClick={() => navigate('/app/dashboard')}
                >
                    Ir para o Dashboard
                </button>
            )}
        </div>
    );
};
