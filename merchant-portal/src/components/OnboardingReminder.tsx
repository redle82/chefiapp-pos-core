/**
 * OnboardingReminder - Avisos de Onboarding Incompleto
 * 
 * FASE 2 - Onboarding com Primeira Venda
 * 
 * Funcionalidades:
 * - Mostrar banner se menu não criado
 * - Mostrar banner se primeira venda não feita
 * - Botões para completar onboarding
 * - Não bloquear acesso (usuário pode voltar depois)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { Button } from '../ui/design-system/Button';
import { Card } from '../ui/design-system/primitives/Card';
import { Text } from '../ui/design-system/primitives/Text';

export const OnboardingReminder: React.FC = () => {
    const navigate = useNavigate();
    const { hasMenu, hasFirstSale, loading } = useOnboardingStatus();

    // Já completou: não mostrar reminder
    if (hasMenu && hasFirstSale) {
        return null;
    }

    // A carregar: placeholder para não deixar buraco no layout
    if (loading) {
        return (
            <div style={{
                marginBottom: '24px',
                padding: '12px 16px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 8,
                fontSize: 13,
                color: 'rgba(255,255,255,0.6)',
            }}>
                A carregar estado do onboarding…
            </div>
        );
    }

    return (
        <div style={{
            marginBottom: '24px',
        }}>
            {!hasMenu && (
                <Card surface="layer2" padding="md" style={{
                    border: '2px solid #ffa500',
                    background: 'rgba(255, 165, 0, 0.1)',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px',
                    }}>
                        <div>
                            <Text size="md" weight="bold" style={{ color: '#fff', marginBottom: '4px' }}>
                                ⚠️ Menu não criado
                            </Text>
                            <Text size="sm" color="secondary">
                                Você precisa criar um menu para fazer sua primeira venda
                            </Text>
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => navigate('/menu-builder')}
                        >
                            Criar Menu
                        </Button>
                    </div>
                </Card>
            )}

            {hasMenu && !hasFirstSale && (
                <Card surface="layer2" padding="md" style={{
                    border: '2px solid #32d74b',
                    background: 'rgba(50, 215, 75, 0.1)',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px',
                    }}>
                        <div>
                            <Text size="md" weight="bold" style={{ color: '#fff', marginBottom: '4px' }}>
                                🎯 Pronto para sua primeira venda!
                            </Text>
                            <Text size="sm" color="secondary">
                                Faça sua primeira venda para completar o onboarding
                            </Text>
                        </div>
                        <Button
                            variant="constructive"
                            onClick={() => navigate('/tpv', { replace: false })}
                        >
                            Ir para TPV
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
};
